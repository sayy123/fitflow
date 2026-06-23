'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function createSubscriptionSessionAction(orgId: string, type: 'monthly' | 'yearly', classIdToReturn?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté pour acheter un abonnement.' }

  const org = await prisma.organizations.findUnique({
    where: { id: orgId }
  })
  if (!org || !org.stripe_account_id) return { error: 'Ce studio ne peut pas recevoir de paiements.' }

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
    ? `${domain}/${org.slug}/book/${classIdToReturn}?session_id={CHECKOUT_SESSION_ID}&type=pass`
    : `${domain}/dashboard?session_id={CHECKOUT_SESSION_ID}&type=pass`;
    
  const cancelUrl = classIdToReturn
    ? `${domain}/${org.slug}/book/${classIdToReturn}?canceled=true`
    : `${domain}/dashboard`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Pass Illimité ${type === 'monthly' ? '1 Mois' : '1 An'} - ${org.name}`,
              description: `Accès illimité à tous les cours pendant ${type === 'monthly' ? '1 mois' : '1 an'}.`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email!,
      allow_promotion_codes: true,
      metadata: {
        type: 'studio_pass',
        passType: type,
        orgId: org.id,
        memberId: memberId!,
      }
    }, {
      stripeAccount: org.stripe_account_id
    })

    return { url: session.url }
  } catch (err: any) {
    console.error(err);
    return { error: err.message || 'Erreur lors de la création de la session Stripe.' }
  }
}
