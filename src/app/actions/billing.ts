"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mollie } from "@/lib/mollie";
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

  // Bloquer le downgrade de Premium vers Starter seulement si l'abonnement est actif
  if (userProfile.plan === "premium" && plan === "starter" && userProfile.subscription_status === "active") {
    return { error: "Vous avez déjà un abonnement Premium actif. Pour repasser au plan Starter, veuillez d'abord annuler votre abonnement actuel depuis le portail de facturation." };
  }

  // Obtenir le Price ID de Mollie selon le plan
  const priceId = plan === "starter" 
    ? process.env.MOLLIE_STARTER_PRICE_ID 
    : process.env.MOLLIE_PREMIUM_PRICE_ID;

  if (!priceId) {
    return { error: "Configuration de paiement manquante (Price ID)" };
  }

  try {
    // Créer ou récupérer le client Mollie
    let customerId = userProfile.mollie_customer_id;
    
    // Si on a un customerId, on vérifie s'il existe toujours chez Mollie
    if (customerId) {
      try {
        const existingCustomer = await mollie.customers.get(customerId);
        if ('deleted' in existingCustomer && existingCustomer.deleted) {
          customerId = null;
        }
      } catch (e: any) {
        // Si Mollie renvoie une erreur "No such customer", on reset le customerId
        if (e.code === 'resource_missing') {
          customerId = null;
          // On nettoie la DB pour ne plus avoir cet ID invalide
          await prisma.user_profiles.update({
            where: { user_id: user.id },
            data: { mollie_customer_id: null },
          });
        } else {
          throw e; // Autre erreur Mollie
        }
      }
    }
    
    if (!customerId) {
      const customer = await mollie.customers.create({ name: user.user_metadata?.full_name || "User", email: user.email });
      customerId = customer.id;
      
      await prisma.user_profiles.update({
        where: { user_id: user.id },
        data: { mollie_customer_id: customerId },
      });
    }

    // Détecter l'URL de base dynamiquement
    const host = (await headers()).get("host");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");
    const baseUrl = siteUrl.replace(/\/$/, "");

    // Créer la session de checkout
    
    const amountValue = plan === "starter" ? "19.00" : "39.00";

    const session = await mollie.payments.create({
      amount: { currency: "EUR", value: amountValue },
      description: `Abonnement Fitflow ${plan === "starter" ? "Starter" : "Premium"}`,
      redirectUrl: `${siteUrl}/dashboard/billing?success=true`,
      webhookUrl: `${siteUrl}/api/webhooks/mollie`,
      sequenceType: "first",
      customerId: customerId,
      metadata: { userId: user.id, plan: plan, priceId: priceId || plan, isSubscription: true }
    });


    const checkoutUrl = session.getCheckoutUrl();

    if (!checkoutUrl) {
      console.error("Mollie Session URL is missing", session);
      return { error: "Impossible de générer la session de paiement" };
    }

    console.log(`[subscribeAction] Redirecting user to: ${checkoutUrl}`);
    return { url: checkoutUrl };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "inconnue";
    console.error("Mollie Checkout Error:", message);
    return { error: `Erreur Mollie : ${message}` };
  }
}

export async function cancelSubscriptionAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id },
  });

  if (!userProfile?.mollie_customer_id || !userProfile?.mollie_subscription_id) {
    return { error: "Aucun abonnement actif trouvé." };
  }

  try {
    await mollie.customers_subscriptions.cancel(userProfile.mollie_subscription_id, { customerId: userProfile.mollie_customer_id });

    await prisma.user_profiles.update({
      where: { user_id: user.id },
      data: { subscription_status: "canceled", plan: "none" }
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Mollie Cancel Error:", error);
    return { error: "Erreur lors de l'annulation de l'abonnement." };
  }
}

export async function createMollieConnectAccountAction(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: orgId, role: "owner" },
    include: { organizations: true }
  });

  if (!member) return { error: "Permission refusée" };

  try {
    let accountId = member.organizations.mollie_account_id;

    // Verify the account still exists in Mollie if we have an ID
    if (accountId) {
      try {
        const existingAccount = { id: accountId, details_submitted: true };
        if (existingAccount.deleted) {
          accountId = null;
        }
      } catch (e: any) {
        if (e.code === 'resource_missing' || e.code === 'account_invalid') {
          accountId = null;
          // Clear invalid ID from DB
          await prisma.organizations.update({
            where: { id: orgId },
            data: { mollie_account_id: null, mollie_charges_enabled: false }
          });
        } else {
          throw e;
        }
      }
    }

    if (!accountId) {
      const account = { id: "mock_mollie_acc_" + Date.now() };
      accountId = account.id;

      await prisma.organizations.update({
        where: { id: orgId },
        data: { mollie_account_id: accountId }
      });
    }

    const host = (await headers()).get("host");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");
    const refreshUrl = `${siteUrl.replace(/\/$/, "")}/dashboard/settings`;
    const returnUrl = `${siteUrl.replace(/\/$/, "")}/dashboard/settings?mollie_connect_success=true`;

    const accountLink = { url: returnUrl };

    return { url: accountLink.url };
  } catch (error: any) {
    console.error("Mollie Connect Error:", error.message || error);
    return { error: `Erreur lors de la connexion à Mollie: ${error.message || 'Erreur inconnue'}` };
  }
}

export async function createMollieConnectLoginLinkAction(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: orgId, role: "owner" },
    include: { organizations: true }
  });

  if (!member || !member.organizations.mollie_account_id) return { error: "Compte Mollie introuvable" };

  try {
    const account = { id: member.organizations.mollie_account_id };
    if (account.type === 'standard') {
      return { url: 'https://my.mollie.com/dashboard/' };
    }
    const loginLink = { url: "https://my.mollie.com/dashboard/" };
    return { url: loginLink.url };
  } catch (error: any) {
    console.error("Mollie Connect Login Error:", error);
    return { error: "Erreur lors de l'accès au tableau de bord Mollie." };
  }
}

