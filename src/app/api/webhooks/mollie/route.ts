import { NextResponse } from 'next/server';
import { createMollieClient } from '@mollie/api-client';
import prisma from '@/lib/prisma';
import { sendBookingConfirmationEmail } from '@/lib/emails/send';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    const formData = await req.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return new NextResponse('Missing ID', { status: 400 });
    }

    let mollieClient;
    if (orgId) {
      const org = await prisma.organizations.findUnique({ where: { id: orgId } });
      if (org?.mollie_access_token) {
        mollieClient = createMollieClient({ accessToken: org.mollie_access_token });
      } else {
        console.error(`[Mollie Webhook] Organization ${orgId} missing access token`);
      }
    }
    
    if (!mollieClient) {
      if (process.env.MOLLIE_API_KEY) {
        mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY as string });
      } else {
        return new NextResponse('Configuration Error: Missing access token and API Key', { status: 500 });
      }
    }

    let payment;
    try {
      payment = await mollieClient.payments.get(id);
    } catch (error: any) {
      if (error.message?.includes('No payment exists') || error.message?.includes('wrong mode')) {
        payment = await mollieClient.payments.get(id, { testmode: true });
      } else {
        throw error;
      }
    }
    const metadata = payment.metadata as any;

    if (payment.status === 'paid') {
      // A) BOOKINGS LOGIC
      if (metadata?.classId && metadata?.memberId && metadata?.organizationId) {
        const { classId, memberId, organizationId } = metadata;

        try {
          let booking = await prisma.bookings.findUnique({
            where: {
              class_id_studio_member_id: {
                class_id: classId,
                studio_member_id: memberId
              }
            },
            include: {
              classes: { include: { organizations: true } },
              studio_members: true
            }
          });

          if (booking && booking.status === 'cancelled') {
            booking = await prisma.bookings.update({
              where: { id: booking.id },
              data: {
                status: 'confirmed',
                payment_status: 'paid',
                cancelled_at: null,
                mollie_session_id: payment.id,
              },
              include: {
                classes: { include: { organizations: true } },
                studio_members: true
              }
            });
          } else if (!booking) {
            booking = await prisma.bookings.create({
              data: {
                class_id: classId,
                studio_member_id: memberId,
                organization_id: organizationId,
                status: 'confirmed',
                payment_status: 'paid',
                mollie_session_id: payment.id,
              },
              include: {
                classes: { include: { organizations: true } },
                studio_members: true
              }
            });
          } else {
             await prisma.bookings.update({
              where: { id: booking.id },
              data: {
                status: 'confirmed',
                payment_status: 'paid',
                mollie_session_id: payment.id,
              }
            });
          }

          if (booking && booking.status !== 'cancelled') {
            const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            await sendBookingConfirmationEmail({
              email: booking.studio_members.email,
              fullName: booking.studio_members.full_name,
              className: booking.classes.title,
              startsAt: booking.classes.starts_at,
              studioName: booking.classes.organizations.name,
              isNewUser: false,
              baseUrl: host
            });
          }
        } catch (e) {
          console.error('Error processing payment metadata:', e);
        }
      }
      
      // C) STUDIO PASS LOGIC
      if (metadata?.type === 'studio_pass' && metadata?.memberId && metadata?.orgId) {
        try {
           const passType = metadata.passType as 'monthly' | 'yearly';
           
           // Calculate expiration date
           const expiresAt = new Date();
           if (passType === 'yearly') {
             expiresAt.setFullYear(expiresAt.getFullYear() + 1);
           } else {
             expiresAt.setMonth(expiresAt.getMonth() + 1);
           }

           // Ensure transaction or multiple awaits
           await prisma.studio_members.update({
             where: { id: metadata.memberId },
             data: { has_active_subscription: true }
           });
           
           await prisma.member_subscriptions.create({
             data: {
               organization_id: metadata.orgId,
               studio_member_id: metadata.memberId,
               type: passType,
               price_paid: payment.amount.value,
               currency: payment.amount.currency,
               mollie_payment_id: payment.id,
               expires_at: expiresAt,
               is_active: true
             }
           });

           console.log(`[Mollie Webhook] Activated studio pass (${passType}) for member ${metadata.memberId}, expires at ${expiresAt.toISOString()}`);
        } catch (e) {
           console.error('[Mollie Webhook] Error activating studio pass:', e);
        }
      }
      
      // B) SUBSCRIPTIONS LOGIC
      // If it's the first payment of a subscription (usually has a mandate)
      // or a recurring payment.
      if (payment.subscriptionId || metadata?.isSubscription) {
         try {
           const userId = metadata?.userId;
           const plan = metadata?.plan;
           
           if (userId) {
             const customerId = payment.customerId as string;
             // Mollie subscriptions are usually created after the first payment succeeds
             let subscriptionId = payment.subscriptionId;
             if (!subscriptionId && metadata?.isSubscription) {
                // If it's the first payment, we need to create the subscription now
                const subscription = await mollieClient.customerSubscriptions.create({
                   customerId,
                   amount: payment.amount,
                   interval: "1 months",
                   description: `Subscription ${plan} (${payment.id})`
                });
                subscriptionId = subscription.id;
             }

             await prisma.user_profiles.update({
               where: { user_id: userId },
               data: {
                 mollie_subscription_id: subscriptionId,
                 mollie_customer_id: customerId,
                 mollie_price_id: metadata?.priceId || null,
                 subscription_status: 'active',
                 plan: plan || 'pro',
                 trial_ends_at: null,
               },
             });
             console.log(`[Mollie Webhook] Successfully updated user ${userId} to ${plan}`);
           } else if (payment.subscriptionId) {
              // Existing subscription renewal
              await prisma.user_profiles.updateMany({
                where: {
                  mollie_subscription_id: payment.subscriptionId,
                },
                data: {
                  subscription_status: 'active',
                },
              });
           }
         } catch (dbError: any) {
           console.error(`[Mollie Webhook] Database update failed: ${dbError.message}`);
         }
      }
    } else if (payment.status === 'failed' || payment.status === 'expired' || payment.status === 'canceled') {
        // Handle failed recurring payments
        if (payment.subscriptionId) {
             await prisma.user_profiles.updateMany({
               where: {
                 mollie_subscription_id: payment.subscriptionId,
               },
               data: {
                 subscription_status: 'past_due',
               },
             });
        }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error(`Webhook error:`, error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
