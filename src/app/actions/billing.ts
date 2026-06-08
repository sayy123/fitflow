"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

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
    
    // Si on a un customerId, on vérifie s'il existe toujours chez Stripe
    if (customerId) {
      try {
        const existingCustomer = await stripe.customers.retrieve(customerId);
        if ('deleted' in existingCustomer && existingCustomer.deleted) {
          customerId = null;
        }
      } catch (e: any) {
        // Si Stripe renvoie une erreur "No such customer", on reset le customerId
        if (e.code === 'resource_missing') {
          customerId = null;
          // On nettoie la DB pour ne plus avoir cet ID invalide
          await prisma.user_profiles.update({
            where: { user_id: user.id },
            data: { stripe_customer_id: null },
          });
        } else {
          throw e; // Autre erreur Stripe
        }
      }
    }
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
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

    // Détecter l'URL de base dynamiquement
    const host = (await headers()).get("host");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");
    const baseUrl = siteUrl.replace(/\/$/, "");

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
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/billing`,
      allow_promotion_codes: true,
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

export async function createCustomerPortalAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id },
  });

  if (!userProfile?.stripe_customer_id) {
    return { error: "Aucun historique de paiement trouvé." };
  }

  try {
    const host = (await headers()).get("host");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");
    const returnUrl = `${siteUrl.replace(/\/$/, "")}/dashboard/billing`;

    const session = await stripe.billingPortal.sessions.create({
      customer: userProfile.stripe_customer_id,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error: unknown) {
    console.error("Stripe Portal Error:", error);
    return { error: "Erreur lors de l'ouverture du portail de gestion." };
  }
}

export async function createStripeConnectAccountAction(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: orgId, role: "owner" },
    include: { organizations: true }
  });

  if (!member) return { error: "Permission refusée" };

  try {
    let accountId = member.organizations.stripe_account_id;

    // Verify the account still exists in Stripe if we have an ID
    if (accountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId);
        if (existingAccount.deleted) {
          accountId = null;
        }
      } catch (e: any) {
        if (e.code === 'resource_missing' || e.code === 'account_invalid') {
          accountId = null;
          // Clear invalid ID from DB
          await prisma.organizations.update({
            where: { id: orgId },
            data: { stripe_account_id: null, stripe_charges_enabled: false }
          });
        } else {
          throw e;
        }
      }
    }

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email || undefined,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        metadata: {
          orgId: orgId
        }
      });
      accountId = account.id;

      await prisma.organizations.update({
        where: { id: orgId },
        data: { stripe_account_id: accountId }
      });
    }

    const host = (await headers()).get("host");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");
    const refreshUrl = `${siteUrl.replace(/\/$/, "")}/dashboard/settings`;
    const returnUrl = `${siteUrl.replace(/\/$/, "")}/dashboard/settings?stripe_connect_success=true`;

    const account = await stripe.accounts.retrieve(accountId);
    const linkType = account.details_submitted ? 'account_update' : 'account_onboarding';

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: linkType,
    });

    return { url: accountLink.url };
  } catch (error: any) {
    console.error("Stripe Connect Error:", error.message || error);
    return { error: `Erreur lors de la connexion à Stripe: ${error.message || 'Erreur inconnue'}` };
  }
}

export async function createStripeConnectLoginLinkAction(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: orgId, role: "owner" },
    include: { organizations: true }
  });

  if (!member || !member.organizations.stripe_account_id) return { error: "Compte Stripe introuvable" };

  try {
    const loginLink = await stripe.accounts.createLoginLink(member.organizations.stripe_account_id);
    return { url: loginLink.url };
  } catch (error: any) {
    console.error("Stripe Connect Login Error:", error);
    return { error: "Erreur lors de l'accès au tableau de bord Stripe." };
  }
}

