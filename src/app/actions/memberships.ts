'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { mollie } from '@/lib/mollie'
import { headers } from 'next/headers'

export async function createSubscriptionSessionAction(orgId: string, type: 'monthly' | 'yearly', classIdToReturn?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté pour acheter un abonnement.' }

  const org = await prisma.organizations.findUnique({
    where: { id: orgId }
  })
  if (!org || !org.mollie_account_id) return { error: 'Ce studio ne peut pas recevoir de paiements.' }

  const member = await prisma.studio_members.findUnique({
    where: {
      organization_id_email: {
        organization_id: org.id,
        email: user.email!.toLowerCase().trim()
      }
    }
  })

  let memberId = member?.id;
  
  if (!member) {
    const newMember = await prisma.studio_members.create({
      data: {
        organization_id: org.id,
        email: user.email!.toLowerCase().trim(),
        full_name: user.user_metadata?.full_name || 'Membre'
      }
    });
    memberId = newMember.id;
  }

  const price = type === 'monthly' ? org.member_monthly_price : org.member_yearly_price;
  if (!price) return { error: 'Ce pass n\'est pas disponible.' }

  const host = (await headers()).get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const domain = `${protocol}://${host}`
  
  const successUrl = classIdToReturn 
    ? `${domain}/${org.slug}/book/${classIdToReturn}?success=true&type=pass`
    : `${domain}/dashboard?success=true&type=pass`;
    
  const cancelUrl = classIdToReturn
    ? `${domain}/${org.slug}/book/${classIdToReturn}?canceled=true`
    : `${domain}/dashboard`;

  try {
    let mollieClient;
    const { createMollieClient } = await import('@mollie/api-client');
    
    if (org.mollie_access_token) {
       mollieClient = createMollieClient({ accessToken: org.mollie_access_token as string });
    } else {
       return { error: 'Erreur de configuration : le compte Mollie de ce studio est mal configuré (token manquant).' };
    }
    
    const session = await mollieClient.payments.create({
      amount: { currency: "EUR", value: price.toFixed(2) },
      description: `Pass Illimité ${type === 'monthly' ? '1 Mois' : '1 An'} - ${org.name}`,
      redirectUrl: successUrl,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mollie?orgId=${org.id}`,
      profileId: org.mollie_account_id,
      metadata: {
        type: 'studio_pass',
        passType: type,
        orgId: org.id,
        memberId: memberId!
      },
      testmode: process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') || process.env.NEXT_PUBLIC_APP_URL?.includes('vercel.app') || process.env.NEXT_PUBLIC_MOLLIE_TESTMODE === 'true' ? true : undefined
    });


    return { url: session.getCheckoutUrl() }
  } catch (err: any) {
    console.error(err);
    return { error: err.message || 'Erreur lors de la création de la session Mollie.' }
  }
}
