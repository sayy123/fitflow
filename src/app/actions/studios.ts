'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setActiveStudioAction(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_org_id', orgId, { 
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function createFirstStudioAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const name = formData.get('name') as string
  if (!name || name.length < 2) return { error: 'Nom trop court' }

  const ownedMemberships = await prisma.org_members.findMany({
    where: { user_id: user.id, role: 'owner' }
  })

  if (ownedMemberships.length > 0) {
    return { error: 'Vous possédez déjà un studio.' }
  }

  let actualName = name;
  let isBetaBypass = false;
  if (name.trim().toUpperCase().endsWith(' BETA') || name.trim().toUpperCase() === 'BETA') {
    actualName = name.replace(/ BETA$/i, '').trim();
    if (actualName === '') actualName = 'Studio';
    isBetaBypass = true;
  }

  const slug = actualName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
  
  const isTestUser = user.email?.toLowerCase().endsWith('@test.com');
  const targetPlan = isTestUser ? 'premium' : 'starter';
  const targetStatus = isTestUser ? 'active' : (isBetaBypass ? 'active' : 'pending_payment');

  try {
    const newOrg = await prisma.$transaction(async (tx) => {
      // 1. Ensure user profile exists
      await tx.user_profiles.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          plan: targetPlan,
          subscription_status: targetStatus,
        }
      });

      const org = await tx.organizations.create({
        data: {
          name: actualName,
          slug,
          onboarding_completed: true
        }
      })

      await tx.org_members.create({
        data: {
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner'
        }
      })
      
      return org
    })

    const cookieStore = await cookies()
    cookieStore.set('active_org_id', newOrg.id, { path: '/' })
    revalidatePath('/', 'layout')
    
    // If BETA bypass or test user, no need for Mollie
    if (isBetaBypass || isTestUser) {
      return { success: true };
    }

    // Create Mollie customer and checkout session for Mandate (Trial)
    const { mollie } = await import('@/lib/mollie');
    const { headers } = await import('next/headers');
    
    const userProfile = await prisma.user_profiles.findUnique({ where: { user_id: user.id } });
    let customerId = userProfile?.mollie_customer_id;
    
    if (!customerId) {
      const customer = await mollie.customers.create({ name: user.user_metadata?.full_name || "Owner", email: user.email });
      customerId = customer.id;
      await prisma.user_profiles.update({
        where: { user_id: user.id },
        data: { mollie_customer_id: customerId }
      });
    }

    const host = (await headers()).get("host");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");

    const session = await mollie.payments.create({
      amount: { currency: "EUR", value: "0.00" }, // 0€ for trial mandate setup
      description: `Essai gratuit de 14 jours Fitflow`,
      redirectUrl: `${siteUrl}/dashboard?success=true`,
      webhookUrl: `${siteUrl}/api/webhooks/mollie`,
      sequenceType: "first" as any,
      customerId: customerId,
      metadata: { 
        userId: user.id, 
        isSubscription: true,
        isTrialSetup: true, 
        plan: 'starter',
        trialDays: 14
      }
    });

    const checkoutUrl = (session as any).getCheckoutUrl();
    if (checkoutUrl) {
      return { url: checkoutUrl }; // We will redirect from the client wrapper
    }

    return { success: true }
  } catch (error) {
    console.error('Create first studio error:', error)
    return { error: 'Erreur lors de la création du studio ou de la session de paiement' }
  }
}

export async function createStudioAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const name = formData.get('name') as string
  if (!name || name.length < 2) return { error: 'Nom trop court' }

  // 1. Check user profile for subscription plan
  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id }
  })

  const hasPremium = userProfile?.plan === 'premium' && ["active", "canceling"].includes(userProfile?.subscription_status ?? "")
  
  if (!hasPremium) {
    return { error: 'Vous devez avoir un abonnement Premium actif pour créer des studios supplémentaires.' }
  }

  const ownedMemberships = await prisma.org_members.findMany({
    where: { user_id: user.id, role: 'owner' },
    include: { organizations: true }
  })

  if (ownedMemberships.length >= 3) {
    return { error: 'Limite atteinte. Le plan Premium permet de gérer un maximum de 3 studios.' }
  }

  // Trouver un studio existant avec Mollie configuré pour copier les identifiants
  const orgWithMollie = ownedMemberships.find(m => m.organizations?.mollie_account_id !== null)?.organizations;

  // 2. Create the new studio
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
  
  try {
    const newOrg = await prisma.$transaction(async (tx) => {
      const org = await tx.organizations.create({
        data: {
          name,
          slug,
          onboarding_completed: true,
          ...(orgWithMollie ? {
            mollie_account_id: orgWithMollie.mollie_account_id,
            mollie_access_token: orgWithMollie.mollie_access_token,
            mollie_refresh_token: orgWithMollie.mollie_refresh_token,
            mollie_charges_enabled: orgWithMollie.mollie_charges_enabled,
            mollie_account_status: orgWithMollie.mollie_account_status,
          } : {})
        }
      })

      await tx.org_members.create({
        data: {
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          display_name: user.user_metadata?.full_name || 'Owner'
        }
      })
      
      return org
    })

    const cookieStore = await cookies()
    cookieStore.set('active_org_id', newOrg.id, { path: '/' })
    revalidatePath('/dashboard', 'layout')
    
    return { success: true }
  } catch (error) {
    console.error('Create studio error:', error)
    return { error: 'Erreur lors de la création du studio' }
  }
}
