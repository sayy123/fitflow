'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmationEmail } from '@/lib/emails/send'
import { headers } from 'next/headers'

const bookingSchema = z.object({
  classId: z.preprocess((val) => val ?? undefined, z.string().uuid()),
  organizationId: z.preprocess((val) => val ?? undefined, z.string().uuid()),
  fullName: z.preprocess((val) => val ?? '', z.string().min(2, "Le nom est trop court")),
  email: z.preprocess((val) => val ?? '', z.string().email("Email invalide")),
  password: z.preprocess((val) => val ?? '', z.string().min(8, "Le mot de passe doit faire 8 caractères").optional().or(z.literal(''))),
})

export async function createBookingAction(formData: FormData) {
  const parsed = bookingSchema.safeParse({
    classId: formData.get('classId'),
    organizationId: formData.get('organizationId'),
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { error: `Données invalides : ${issue.message} (${issue.path.join('.')})` }
  }

  const { classId, organizationId, fullName, email, password } = parsed.data

  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    // Si l'utilisateur est déjà connecté, on peut créer la réservation directement
    if (currentUser) {
      if (!currentUser.email) return { error: "L'utilisateur n'a pas d'email associé" }

      let member = await prisma.studio_members.findUnique({
        where: {
          organization_id_email: {
            organization_id: organizationId,
            email: currentUser.email
          }
        }
      })

      if (member && member.is_active === false) {
        return { error: "Vous n'êtes plus autorisé à réserver dans ce studio." }
      }

      if (!member) {
        // Vérifier la limite de membres pour le plan Starter (40 max)
        const org = await prisma.organizations.findUnique({
          where: { id: organizationId }
        })

        if (org?.plan === 'starter') {
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

        member = await prisma.studio_members.create({
          data: {
            organization_id: organizationId,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || fullName,
          }
        })
      }

      // S'assurer que l'utilisateur est aussi dans org_members pour voir le dashboard
      await prisma.org_members.upsert({
        where: {
          organization_id_user_id: {
            organization_id: organizationId,
            user_id: currentUser.id
          }
        },
        update: {},
        create: {
          organization_id: organizationId,
          user_id: currentUser.id,
          role: 'member',
          display_name: currentUser.user_metadata?.full_name || fullName,
        }
      })

      // Vérifier si déjà réservé
      const existing = await prisma.bookings.findUnique({
        where: {
          class_id_studio_member_id: {
            class_id: classId,
            studio_member_id: member.id
          }
        }
      })

      if (existing && existing.status !== 'cancelled') return { error: 'Vous avez déjà réservé ce cours' }
      if (existing && existing.status === 'cancelled' && existing.cancel_reason === 'removed_by_owner') {
        return { error: 'Vous avez été retiré de ce cours par le gérant et ne pouvez plus le rejoindre.' }
      }

      // Vérifier capacité
      const cls = await prisma.classes.findUnique({
        where: { id: classId },
        include: { organizations: true }
      })

      if (!cls) return { error: 'Cours introuvable' }
      if (cls.is_cancelled) return { error: 'Ce cours est annulé' }
      if (new Date(cls.starts_at) < new Date()) return { error: 'Ce cours est déjà terminé' }

      const bookingsCount = await prisma.bookings.count({
        where: { class_id: classId, status: { not: 'cancelled' } }
      })
      if (bookingsCount >= cls.capacity) return { error: 'Ce cours est complet' }

      // Créer la réservation
      const isStripeActive = cls.organizations.stripe_account_id && (cls.organizations.stripe_charges_enabled || cls.organizations.stripe_account_status === 'pending_verification');
      const isPaid = cls.price && cls.price > 0 && !member.has_active_subscription;
      const canPayOnline = cls.organizations.payment_link || isStripeActive;
      
      let booking;
      if (!(isPaid && canPayOnline)) {
        if (existing && existing.status === 'cancelled') {
          booking = await prisma.bookings.update({
            where: { id: existing.id },
            data: {
              status: isPaid ? 'pending_payment' : 'confirmed',
              payment_status: isPaid ? 'unpaid' : 'free',
              cancelled_at: null
            }
          })
        } else {
          booking = await prisma.bookings.create({
            data: {
              class_id: classId,
              studio_member_id: member.id,
              organization_id: organizationId,
              status: isPaid ? 'pending_payment' : 'confirmed',
              payment_status: isPaid ? 'unpaid' : 'free',
            }
          })
        }
      }

      const host = (await headers()).get('host')
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
                description: `Séance chez ${cls.organizations.name}`,
              },
              unit_amount: Math.round(cls.price! * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${siteUrl}/${cls.organizations.slug}/book/${classId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}/${cls.organizations.slug}/book/${classId}?canceled=true`,
          customer_email: currentUser.email,
          allow_promotion_codes: true,
          metadata: {
            classId: classId,
            memberId: member.id,
            organizationId: organizationId,
          }
        }, {
          stripeAccount: cls.organizations.stripe_account_id!,
        });

        return { url: session.url };
      }

      if (isPaid && cls.organizations.payment_link) {
        return { url: cls.organizations.payment_link };
      }

      // Envoyer email de confirmation uniquement si gratuit
      await sendBookingConfirmationEmail({
        email: currentUser.email,
        fullName: currentUser.user_metadata?.full_name || fullName,
        className: cls.title,
        startsAt: cls.starts_at,
        studioName: cls.organizations.name,
        isNewUser: false,
        baseUrl: siteUrl
      })

      revalidatePath(`/${cls.organizations.slug}/book/${classId}`, 'page')
      return { success: true, status: 'confirmed' }
    }

    // Si l'utilisateur n'est pas connecté, on crée le membre et la réservation DIRECTEMENT
    const cls = await prisma.classes.findUnique({
      where: { id: classId },
      include: { organizations: true }
    })

    if (!cls) return { error: 'Cours introuvable' }
    if (cls.is_cancelled) return { error: 'Ce cours est annulé' }
    if (new Date(cls.starts_at) < new Date()) return { error: 'Ce cours est déjà terminé' }

    const bookingsCount = await prisma.bookings.count({
      where: { class_id: classId, status: { not: 'cancelled' } }
    })
    if (bookingsCount >= cls.capacity) return { error: 'Ce cours est complet' }

    let member = await prisma.studio_members.findUnique({
      where: {
        organization_id_email: {
          organization_id: organizationId,
          email: email.toLowerCase().trim()
        }
      }
    })

    if (member && member.is_active === false) {
      return { error: "Vous n'êtes plus autorisé à réserver dans ce studio." }
    }

    if (!member) {
      // 0. Vérifier la limite de membres pour le plan Starter (40 max)
      const org = await prisma.organizations.findUnique({
        where: { id: organizationId }
      })
      const ownerMembership = await prisma.org_members.findFirst({
        where: { organization_id: organizationId, role: 'owner' }
      })
      const userProfile = ownerMembership && ownerMembership.user_id
        ? await prisma.user_profiles.findUnique({ where: { user_id: ownerMembership.user_id } })
        : null;

      if (userProfile?.plan === 'starter' || !userProfile) {
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

      // 1. Créer le compte Supabase Auth s'il y a un mot de passe
      if (password && password.length >= 8) {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const adminSupabase = createAdminClient();
        
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password: password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (authError && !authError.message.includes("already registered")) {
          console.error("Booking auth creation error:", authError);
        } else if (authData.user) {
          // L'utilisateur est créé sur Supabase, on le lie au studio
          await prisma.org_members.upsert({
            where: {
              organization_id_user_id: {
                organization_id: organizationId,
                user_id: authData.user.id
              }
            },
            update: { display_name: fullName },
            create: {
              organization_id: organizationId,
              user_id: authData.user.id,
              role: "member",
              display_name: fullName
            }
          });
        }
      }

      // 2. Créer l'entrée dans studio_members pour le suivi interne
      member = await prisma.studio_members.create({
        data: {
          organization_id: organizationId,
          email: email.toLowerCase().trim(),
          full_name: fullName,
        }
      })
    }

    // 2. Vérifier si déjà réservé
    const existing = await prisma.bookings.findUnique({
      where: {
        class_id_studio_member_id: {
          class_id: classId,
          studio_member_id: member.id
        }
      }
    })

    if (existing && existing.status !== 'cancelled') return { error: 'Vous avez déjà réservé ce cours avec cet email' }
    if (existing && existing.status === 'cancelled' && existing.cancel_reason === 'removed_by_owner') {
      return { error: 'Vous avez été retiré de ce cours par le gérant et ne pouvez plus le rejoindre.' }
    }

    // 3. Créer la réservation
    const isStripeActive = cls.organizations.stripe_account_id && (cls.organizations.stripe_charges_enabled || cls.organizations.stripe_account_status === 'pending_verification');
    const isPaid = cls.price && cls.price > 0 && !member.has_active_subscription;
    const canPayOnline = cls.organizations.payment_link || isStripeActive;

    let booking;
    if (!(isPaid && canPayOnline)) {
      if (existing && existing.status === 'cancelled') {
        booking = await prisma.bookings.update({
          where: { id: existing.id },
          data: {
            status: isPaid ? 'pending_payment' : 'confirmed',
            payment_status: isPaid ? 'unpaid' : 'free',
            cancelled_at: null
          }
        })
      } else {
        booking = await prisma.bookings.create({
          data: {
            class_id: classId,
            studio_member_id: member.id,
            organization_id: organizationId,
            status: isPaid ? 'pending_payment' : 'confirmed',
            payment_status: isPaid ? 'unpaid' : 'free',
          }
        })
      }
    }

    const host = (await headers()).get('host')
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
              description: `Séance chez ${cls.organizations.name}`,
            },
            unit_amount: Math.round(cls.price! * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${siteUrl}/${cls.organizations.slug}/book/${classId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/${cls.organizations.slug}/book/${classId}?canceled=true`,
        customer_email: email.toLowerCase().trim(),
        allow_promotion_codes: true,
        metadata: {
          classId: classId,
          memberId: member.id,
          organizationId: organizationId,
        }
      }, {
        stripeAccount: cls.organizations.stripe_account_id!,
      });

      return { url: session.url };
    }

    if (isPaid && cls.organizations.payment_link) {
      return { url: cls.organizations.payment_link };
    }

    // 4. Envoyer email de confirmation immédiat uniquement si gratuit
    await sendBookingConfirmationEmail({
      email: email.toLowerCase().trim(),
      fullName: fullName,
      className: cls.title,
      startsAt: cls.starts_at,
      studioName: cls.organizations.name,
      isNewUser: true, // On lui indique qu'il pourra se connecter plus tard
      baseUrl: siteUrl
    })

    revalidatePath(`/${cls.organizations.slug}/book/${classId}`, 'page')
    return { success: true, status: 'confirmed' }

  } catch (error: unknown) {
    console.error('Booking error:', error)
    return { error: 'Une erreur est survenue : ' + (error instanceof Error ? error.message : 'Erreur inconnue') }
  }
}

export async function deleteBookingAction(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { 
      classes: { include: { organizations: true } },
      studio_members: true
    }
  })

  if (!booking) throw new Error('Booking not found')

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: booking.organization_id }
  })
  
  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      status: 'cancelled',
      cancel_reason: 'removed_by_owner',
      cancelled_at: new Date()
    }
  })

  const { sendClassCancelledEmail } = await import('@/lib/emails/send')
  await sendClassCancelledEmail({
    email: booking.studio_members.email,
    fullName: booking.studio_members.full_name,
    className: booking.classes.title,
    startsAt: booking.classes.starts_at,
    studioName: booking.classes.organizations.name,
  })

  revalidatePath(`/dashboard/classes/${booking.class_id}`)
  return { success: true }
}

export async function memberSelfCancelBookingAction(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { 
        studio_members: true,
        classes: true 
      }
    })

    if (!booking) return { error: 'Réservation introuvable' }

    // Vérifier que c'est bien la réservation de l'utilisateur (via email)
    if (booking.studio_members.email.toLowerCase() !== user.email?.toLowerCase()) {
      return { error: 'Action non autorisée' }
    }

    // Vérifier si le cours n'est pas déjà passé
    if (new Date(booking.classes.starts_at) < new Date()) {
      return { error: 'Impossible d\'annuler une séance passée' }
    }

    await prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        cancel_reason: 'cancelled_by_member',
        cancelled_at: new Date()
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Self cancel error:', error)
    return { error: 'Erreur lors de l\'annulation' }
  }
}

export async function confirmBookingPaymentAction(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { 
      classes: { include: { organizations: true } },
      studio_members: true
    }
  })

  if (!booking) throw new Error('Booking not found')

  const member = await prisma.org_members.findFirst({
    where: { 
      user_id: user.id, 
      organization_id: booking.organization_id,
      role: { in: ['owner', 'admin', 'coach'] }
    }
  })

  if (!member) throw new Error('Forbidden')

  await prisma.bookings.update({
    where: { id: bookingId },
    data: { 
      status: 'confirmed',
      payment_status: 'paid' 
    }
  })

  const { sendBookingConfirmationEmail } = await import('@/lib/emails/send')
  await sendBookingConfirmationEmail({
    email: booking.studio_members.email,
    fullName: booking.studio_members.full_name,
    className: booking.classes.title,
    startsAt: booking.classes.starts_at,
    studioName: booking.classes.organizations.name,
    isNewUser: false,
  })

  revalidatePath(`/dashboard/classes/${booking.class_id}`)
  return { success: true }
}


export async function verifyStripeSessionAction(sessionId: string, accountId?: string | null) {
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2026-05-27.dahlia' });
    const session = await stripe.checkout.sessions.retrieve(
      sessionId,
      undefined,
      accountId ? { stripeAccount: accountId } : undefined
    );

    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
      if (session.metadata?.type === 'studio_pass') {
        const { orgId, memberId, passType } = session.metadata;
        const durationMonths = passType === 'monthly' ? 1 : 12;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

        await prisma.member_subscriptions.create({
          data: {
            organization_id: orgId,
            studio_member_id: memberId,
            type: passType,
            expires_at: expiresAt,
            is_active: true,
            price_paid: session.amount_total ? session.amount_total / 100 : 0,
            stripe_payment_id: session.payment_intent as string | undefined,
          }
        });

        await prisma.studio_members.update({
          where: { id: memberId },
          data: { has_active_subscription: true }
        });

        return { success: true, verified: true, isPass: true };
      }

      if (session.metadata?.classId && session.metadata?.memberId) {
        const { classId, memberId, organizationId } = session.metadata;

        let booking = await prisma.bookings.findUnique({
        where: {
          class_id_studio_member_id: {
            class_id: classId,
            studio_member_id: memberId
          }
        },
        include: {
          classes: { include: { organizations: true } },
          studio_members: true
        }
      });

      if (!booking) {
        booking = await prisma.bookings.create({
          data: {
            class_id: classId,
            studio_member_id: memberId,
            organization_id: organizationId!,
            status: 'confirmed',
            payment_status: 'paid',
          },
          include: {
            classes: { include: { organizations: true } },
            studio_members: true
          }
        });

        const { sendBookingConfirmationEmail } = await import('@/lib/emails/send');
        const { headers } = await import('next/headers');
        const host = (await headers()).get('host');
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : 'http://localhost:3000');
        
        await sendBookingConfirmationEmail({
          email: booking.studio_members.email,
          fullName: booking.studio_members.full_name,
          className: booking.classes.title,
          startsAt: booking.classes.starts_at,
          studioName: booking.classes.organizations.name,
          isNewUser: false,
          baseUrl: siteUrl
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath(`/${booking.classes.organizations.slug}/book/${classId}`, 'page');
        return { success: true, verified: true };
      } else if (booking.status === 'cancelled') {
        booking = await prisma.bookings.update({
          where: { id: booking.id },
          data: {
            status: 'confirmed',
            payment_status: 'paid',
            cancelled_at: null
          },
          include: {
            classes: { include: { organizations: true } },
            studio_members: true
          }
        });
        
        const { sendBookingConfirmationEmail } = await import('@/lib/emails/send');
        const { headers } = await import('next/headers');
        const host = (await headers()).get('host');
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : 'http://localhost:3000');
        
        await sendBookingConfirmationEmail({
          email: booking.studio_members.email,
          fullName: booking.studio_members.full_name,
          className: booking.classes.title,
          startsAt: booking.classes.starts_at,
          studioName: booking.classes.organizations.name,
          isNewUser: false,
          baseUrl: siteUrl
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath(`/${booking.classes.organizations.slug}/book/${classId}`, 'page');
        return { success: true, verified: true };
      }
      
      return { success: true, verified: false, message: 'Already confirmed' };
      }
    }
  } catch (e) {
    console.error('Session verify error:', e);
  }
  return { success: false };
}
