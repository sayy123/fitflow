import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("[Stripe Webhook] 🔔 New Webhook received");
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ STRIPE_WEBHOOK_SECRET is not defined in environment variables");
    return new NextResponse("Webhook secret missing", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`✅ [Stripe Webhook] Event verified: ${event.type}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [Stripe Webhook] Verification failed: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    // 1. SUCCESSFUL PAYMENT (Checkout)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Processing session ${session.id}`);
      
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      const userId = session?.metadata?.userId;
      const plan = session?.metadata?.plan;

      if (!userId) {
        console.error("❌ [Stripe Webhook] No userId found in session metadata");
        return new NextResponse("User id is required", { status: 400 });
      }

      console.log(`[Stripe Webhook] Upgrading User ${userId} to Plan: ${plan}`);

      // Update User Profile
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

      // Update All Organizations owned by this user
      const ownedMemberships = await prisma.org_members.findMany({
        where: { user_id: userId, role: "owner" }
      });

      for (const membership of ownedMemberships) {
        await prisma.organizations.update({
          where: { id: membership.organization_id },
          data: {
            plan: plan || 'starter',
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            stripe_price_id: subscription.items.data[0].price.id,
            trial_ends_at: null,
          }
        });
        console.log(`[Stripe Webhook] Updated Studio: ${membership.organization_id}`);
      }

      console.log("🎉 [Stripe Webhook] Database update complete");
      revalidatePath("/", "layout");
    }

    // 2. SUBSCRIPTION UPDATED / PAID / PAST DUE
    if (event.type === "invoice.payment_succeeded" || event.type === "customer.subscription.updated") {
      const subscriptionId = event.type === "invoice.payment_succeeded" 
        ? (event.data.object as any).subscription as string
        : (event.data.object as Stripe.Subscription).id;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        console.log(`[Stripe Webhook] Syncing subscription status: ${subscription.status}`);

        await prisma.user_profiles.updateMany({
          where: { stripe_subscription_id: subscription.id },
          data: {
            subscription_status: subscription.status,
            stripe_price_id: subscription.items.data[0].price.id,
          },
        });

        await prisma.organizations.updateMany({
          where: { stripe_subscription_id: subscription.id },
          data: {
            subscription_status: subscription.status,
            stripe_price_id: subscription.items.data[0].price.id,
          }
        });
        
        revalidatePath("/", "layout");
      }
    }

    // 3. SUBSCRIPTION DELETED
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id}`);

      await prisma.user_profiles.updateMany({
        where: { stripe_subscription_id: subscription.id },
        data: {
          subscription_status: subscription.status,
          plan: 'starter' // Optional: revert to starter
        },
      });

      await prisma.organizations.updateMany({
        where: { stripe_subscription_id: subscription.id },
        data: {
          subscription_status: subscription.status,
          plan: 'starter'
        }
      });
      
      revalidatePath("/", "layout");
    }

    // 4. STRIPE CONNECT ACCOUNT UPDATED
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      console.log(`[Stripe Webhook] Connect Account updated: ${account.id}, charges_enabled: ${account.charges_enabled}`);

      await prisma.organizations.updateMany({
        where: { stripe_account_id: account.id },
        data: {
          stripe_charges_enabled: account.charges_enabled,
        }
      });
      
      revalidatePath("/dashboard/settings");
    }

    return new NextResponse("Webhook handled", { status: 200 });
  } catch (err: any) {
    console.error(`❌ [Stripe Webhook] Execution error: ${err.message}`);
    return new NextResponse(`Internal Error: ${err.message}`, { status: 500 });
  }
}
