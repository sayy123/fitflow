import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { sendBookingConfirmationEmail } from '@/lib/emails/send';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // The client_reference_id contains our booking.id
    if (session.client_reference_id) {
      try {
        const booking = await prisma.bookings.findUnique({
          where: { id: session.client_reference_id },
          include: {
            classes: { include: { organizations: true } },
            studio_members: true
          }
        });

        if (booking && booking.status === 'pending_payment') {
          // Mark booking as confirmed and paid
          await prisma.bookings.update({
            where: { id: booking.id },
            data: {
              status: 'confirmed',
              payment_status: 'paid',
            }
          });

          // Send confirmation email now that they have paid
          const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          await sendBookingConfirmationEmail({
            email: booking.studio_members.email,
            fullName: booking.studio_members.full_name,
            className: booking.classes.title,
            startsAt: booking.classes.starts_at,
            studioName: booking.classes.organizations.name,
            isNewUser: false, // Could be true if we wanted, but false is fine
            baseUrl: host
          });
        }
      } catch (e) {
        console.error('Error processing checkout session:', e);
        return new NextResponse('Internal Error', { status: 500 });
      }
    }
  }

  return new NextResponse('OK', { status: 200 });
}
