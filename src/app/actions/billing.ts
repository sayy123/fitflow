"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { stripe } from "@/lib/stripe";

export async function subscribeAction(plan: "starter" | "premium") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const membership = await prisma.org_members.findFirst({
    where: {
      user_id: user.id,
      role: "owner",
    },
  });

  if (!membership)
    return { error: "Seul le propriétaire peut gérer l'abonnement" };

  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id },
  });

  if (!userProfile) return { error: "Profil utilisateur non trouvé" };

  // Bloquer le downgrade de Premium vers Starter
  if (userProfile.plan === "premium" && plan === "starter") {
    return { error: "Vous ne pouvez pas repasser au plan Starter une fois en Premium. Contactez le support pour toute demande spécifique." };
  }

  // Obtenir le Price ID de Stripe selon le plan
  const priceId = plan === "starter" 
    ? process.env.STRIPE_STARTER_PRICE_ID 
    : process.env.STRIPE_PREMIUM_PRICE_ID;

  if (!priceId) {
    return { error: "Configuration de paiement manquante (Price ID)" };
  }

  try {
    // Créer ou récupérer le client Stripe
    let customerId = userProfile.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      
      await prisma.user_profiles.update({
        where: { user_id: user.id },
        data: { stripe_customer_id: customerId },
      });
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan,
        },
      },
    });

    if (!session.url) {
      console.error("Stripe Session URL is missing");
      return { error: "Impossible de générer la session de paiement" };
    }

    console.log(`[subscribeAction] Redirecting user to: ${session.url}`);
    return { url: session.url };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "inconnue";
    console.error("Stripe Checkout Error:", message);
    return { error: `Erreur Stripe : ${message}` };
  }
}
