import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { sendBookingConfirmationEmail } from '@/lib/emails/send';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-05-27.dahlia',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

  let event: Stripe.Event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // Fallback for dev/testing if webhook secret isn't configured yet
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === 'checkout.session.completed') {
    // A) BOOKINGS LOGIC
    if (session.metadata?.classId && session.metadata?.memberId && session.metadata?.organizationId) {
      const { classId, memberId, organizationId } = session.metadata;

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
              cancelled_at: null
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
            },
            include: {
              classes: { include: { organizations: true } },
              studio_members: true
            }
          });
        }

        if (booking && booking.status !== 'cancelled') {
          await prisma.bookings.update({
            where: { id: booking.id },
            data: {
              status: 'confirmed',
              payment_status: 'paid',
            }
          });

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
        console.error('Error processing checkout session metadata:', e);
      }
    } 
    // B) SUBSCRIPTIONS LOGIC
    else if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const userId = session?.metadata?.userId;
        const plan = session?.metadata?.plan;

        if (userId) {
          await prisma.user_profiles.update({
            where: { user_id: userId },
            data: {
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              stripe_price_id: subscription.items.data[0].price.id,
              subscription_status: subscription.status,
              plan: plan,
              trial_ends_at: null,
            },
          });
          console.log(`[Stripe Webhook] Successfully updated user ${userId} to ${plan}`);
        }
      } catch (dbError: any) {
        console.error(`[Stripe Webhook] Database update failed: ${dbError.message}`);
      }
    }
  }

  // 2. Paiement réussi ou abonnement mis à jour
  if (event.type === "invoice.payment_succeeded") {
    try {
      const invoice = event.data.object as any;

      if (invoice.subscription) {
        await prisma.organizations.update({
          where: { stripe_subscription_id: invoice.subscription as string },
          data: {},
        });

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        await prisma.user_profiles.updateMany({
          where: {
            stripe_subscription_id: subscription.id,
          },
          data: {
            subscription_status: subscription.status,
            stripe_price_id: subscription.items.data[0].price.id,
          },
        });
      }
    } catch(e) {}
  }

  // 3. Abonnement annulé ou expiré
  if (event.type === "customer.subscription.deleted") {
    try {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.user_profiles.updateMany({
        where: {
          stripe_subscription_id: subscription.id,
        },
        data: {
          subscription_status: subscription.status,
          // On garde le plan actuel mais le statut bloquera l'accès
        },
      });
    } catch(e) {}
  }

  return new NextResponse('OK', { status: 200 });
}
