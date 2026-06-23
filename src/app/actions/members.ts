'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function joinStudioAutomaticallyAction(organizationId: string, classId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Non authentifié' }
  }

  try {
    // 1. Récupérer le studio
    const org = await prisma.organizations.findUnique({
      where: { id: organizationId }
    })

    if (!org) return { error: 'Studio introuvable' }

    // 2. Vérifier la limite de membres pour le plan Starter (40 max)
    if (org.plan === 'starter') {
      const currentCount = await prisma.studio_members.count({
        where: { organization_id: organizationId }
      })

      if (currentCount >= 40) {
        return { 
          error: "Limite de membres atteinte pour ce studio. Le gérant doit passer au plan Premium pour accepter de nouveaux membres.",
          isLimitReached: true 
        }
      }
    }

    // 3. Créer/Récupérer l'entrée dans studio_members
    const member = await prisma.studio_members.upsert({
      where: {
        organization_id_email: {
          organization_id: organizationId,
          email: user.email
        }
      },
      update: {},
      create: {
        organization_id: organizationId,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      }
    })

    // 4. S'assurer que l'utilisateur est aussi dans org_members pour voir le dashboard
    await prisma.org_members.upsert({
      where: {
        organization_id_user_id: {
          organization_id: organizationId,
          user_id: user.id
        }
      },
      update: {},
      create: {
        organization_id: organizationId,
        user_id: user.id,
        role: 'member',
        display_name: user.user_metadata?.full_name || user.email.split('@')[0],
      }
    })

    // 5. SI un classId est fourni, on inscrit l'utilisateur au cours
    let bookingCreated = false;
    if (classId) {
      // Vérifier si déjà réservé
      const existing = await prisma.bookings.findUnique({
        where: {
          class_id_studio_member_id: {
            class_id: classId,
            studio_member_id: member.id
          }
        }
      })

      if (!existing) {
        const cls = await prisma.classes.findUnique({
          where: { id: classId }
        });
        
        if (cls) {
          const isStripeActive = org.stripe_account_id && org.stripe_charges_enabled;
          const isPaid = cls.price && cls.price > 0 && (org.payment_link || isStripeActive) && !member.has_active_subscription;

          let booking;
          if (!(isPaid && isStripeActive)) {
            booking = await prisma.bookings.create({
              data: {
                class_id: classId,
                studio_member_id: member.id,
                organization_id: organizationId,
                status: isPaid ? 'pending_payment' : 'confirmed',
                payment_status: isPaid ? 'unpaid' : 'free',
              }
            })
            bookingCreated = true;
          }

          const { headers } = await import('next/headers');
          const host = (await headers()).get('host');
          const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");

          if (isPaid && isStripeActive) {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2026-05-27.dahlia' });
            
            const session = await stripe.checkout.sessions.create({
              line_items: [{
                price_data: {
                  currency: 'eur',
                  product_data: {
                    name: cls.title,
                    description: `Séance chez ${org.name}`,
                  },
                  unit_amount: Math.round(cls.price! * 100),
                },
                quantity: 1,
              }],
              mode: 'payment',
              success_url: `${siteUrl}/${org.slug}/book/${classId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${siteUrl}/${org.slug}/book/${classId}?canceled=true`,
              customer_email: user.email,
              allow_promotion_codes: true,
              metadata: {
                classId: classId,
                memberId: member.id,
                organizationId: organizationId,
              }
            }, {
              stripeAccount: org.stripe_account_id!,
            });

            return { url: session.url };
          }

          if (isPaid && org.payment_link) {
            return { url: org.payment_link };
          }

          // Envoyer email de confirmation uniquement si gratuit
          const { sendBookingConfirmationEmail } = await import('@/lib/emails/send');
          await sendBookingConfirmationEmail({
            email: user.email,
            fullName: user.user_metadata?.full_name || user.email.split('@')[0],
            className: cls.title,
            startsAt: cls.starts_at,
            studioName: org.name,
            isNewUser: false,
            baseUrl: siteUrl
          });
        }
      } else if (existing.status === 'cancelled') {
        if (existing.cancel_reason === 'removed_by_owner') {
          return { error: 'Vous avez été retiré de ce cours par le gérant et ne pouvez plus le rejoindre.' }
        }
        
        const cls = await prisma.classes.findUnique({
          where: { id: classId }
        });

        if (cls) {
          const isStripeActive = org.stripe_account_id && org.stripe_charges_enabled;
          const isPaid = cls.price && cls.price > 0 && (org.payment_link || isStripeActive) && !member.has_active_subscription;

          let booking;
          if (!(isPaid && isStripeActive)) {
            booking = await prisma.bookings.update({
              where: { id: existing.id },
              data: {
                status: isPaid ? 'pending_payment' : 'confirmed',
                payment_status: isPaid ? 'unpaid' : 'free',
                cancelled_at: null
              }
            });
            bookingCreated = true;
          }

          const { headers } = await import('next/headers');
          const host = (await headers()).get('host');
          const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");

          if (isPaid && isStripeActive) {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2026-05-27.dahlia' });
            
            const session = await stripe.checkout.sessions.create({
              line_items: [{
                price_data: {
                  currency: 'eur',
                  product_data: {
                    name: cls.title,
                    description: `Séance chez ${org.name}`,
                  },
                  unit_amount: Math.round(cls.price! * 100),
                },
                quantity: 1,
              }],
              mode: 'payment',
              success_url: `${siteUrl}/${org.slug}/book/${classId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${siteUrl}/${org.slug}/book/${classId}?canceled=true`,
              customer_email: user.email,
              allow_promotion_codes: true,
              metadata: {
                classId: classId,
                memberId: member.id,
                organizationId: organizationId,
              }
            }, {
              stripeAccount: org.stripe_account_id!,
            });

            return { url: session.url };
          }

          if (isPaid && org.payment_link) {
            return { url: org.payment_link };
          }
        }
      }
    }

    revalidatePath('/dashboard')
    return { success: true, bookingCreated }
  } catch (error: any) {
    console.error('Auto-join error:', error)
    return { error: 'Erreur lors de l\'adhésion au studio' }
  }
}

export async function toggleMemberSubscriptionAction(memberId: string, hasSubscription: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const memberToUpdate = await prisma.studio_members.findUnique({
    where: { id: memberId }
  })

  if (!memberToUpdate) return { error: 'Membre introuvable' }

  const adminMembership = await prisma.org_members.findFirst({
    where: { 
      user_id: user.id, 
      organization_id: memberToUpdate.organization_id,
      role: { in: ['owner', 'admin'] }
    }
  })

  if (!adminMembership) return { error: 'Action non autorisée' }

  await prisma.studio_members.update({
    where: { id: memberId },
    data: { has_active_subscription: hasSubscription }
  })

  revalidatePath(`/dashboard/members/${memberId}`)
  return { success: true }
}

export async function deleteStudioMemberAction(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    // 1. Vérifier que l'utilisateur est un admin/owner de l'organisation
    const memberToDelete = await prisma.studio_members.findUnique({
      where: { id: memberId }
    })

    if (!memberToDelete) return { error: 'Membre introuvable' }

    const adminMembership = await prisma.org_members.findFirst({
      where: { 
        user_id: user.id, 
        organization_id: memberToDelete.organization_id,
        role: { in: ['owner', 'admin'] }
      }
    })

    if (!adminMembership) return { error: 'Action non autorisée' }

    // 2. Supprimer le membre (les bookings seront supprimés par cascade si configuré, sinon manuellement)
    // Par sécurité, on supprime d'abord les bookings manuellement si nécessaire
    await prisma.bookings.deleteMany({
      where: { studio_member_id: memberId }
    })

    await prisma.studio_members.delete({
      where: { id: memberId }
    })

    revalidatePath('/dashboard/members')
    return { success: true }
  } catch (error) {
    console.error('Delete member error:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}
