import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  console.log("[Stripe Webhook] Received new request");
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`[Stripe Webhook] Event verified: ${event.type}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Stripe Webhook] Verification failed: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // 1. Nouvel abonnement créé (via Checkout)
  if (event.type === "checkout.session.completed") {
    console.log("[Stripe Webhook] Processing checkout.session.completed");
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const userId = session?.metadata?.userId;
    const plan = session?.metadata?.plan;

    console.log(`[Stripe Webhook] Metadata - UserId: ${userId}, Plan: ${plan}`);

    if (!userId) {
      console.error("[Stripe Webhook] Missing userId in metadata");
      return new NextResponse("User id is required", { status: 400 });
    }

    try {
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
    } catch (dbError: unknown) {
      const message = dbError instanceof Error ? dbError.message : 'Unknown DB error';
      console.error(`[Stripe Webhook] Database update failed: ${message}`);
    }
  }

  // 2. Paiement réussi ou abonnement mis à jour
  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await prisma.user_profiles.update({
      where: {
        stripe_subscription_id: subscription.id,
      },
      data: {
        subscription_status: subscription.status,
        stripe_price_id: subscription.items.data[0].price.id,
      },
    });
  }

  // 3. Abonnement annulé ou expiré
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await prisma.user_profiles.update({
      where: {
        stripe_subscription_id: subscription.id,
      },
      data: {
        subscription_status: subscription.status,
        // On peut garder le plan actuel mais le statut bloquera l'accès
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
