'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmationEmail } from '@/lib/emails/send'

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

      if (existing) return { error: 'Vous avez déjà réservé ce cours' }

      // Vérifier capacité
      const cls = await prisma.classes.findUnique({
        where: { id: classId },
        include: { organizations: true }
      })

      if (!cls) return { error: 'Cours introuvable' }

      // Créer la réservation
      await prisma.bookings.create({
        data: {
          class_id: classId,
          studio_member_id: member.id,
          organization_id: organizationId,
          status: 'confirmed', // On pourrait aussi gérer la liste d'attente ici
        }
      })

      // Envoyer email de confirmation
      await sendBookingConfirmationEmail({
        email: currentUser.email,
        fullName: currentUser.user_metadata?.full_name || fullName,
        className: cls.title,
        startsAt: cls.starts_at,
        studioName: cls.organizations.name,
        isNewUser: false
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

    // 1. Créer le membre du studio (si n'existe pas déjà)
    let member = await prisma.studio_members.findUnique({
      where: {
        organization_id_email: {
          organization_id: organizationId,
          email: email.toLowerCase().trim()
        }
      }
    })

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

    if (existing) return { error: 'Vous avez déjà réservé ce cours avec cet email' }

    // 3. Créer la réservation
    await prisma.bookings.create({
      data: {
        class_id: classId,
        studio_member_id: member.id,
        organization_id: organizationId,
        status: 'confirmed',
      }
    })

    // 4. Envoyer email de confirmation immédiat
    await sendBookingConfirmationEmail({
      email: email.toLowerCase().trim(),
      fullName: fullName,
      className: cls.title,
      startsAt: cls.starts_at,
      studioName: cls.organizations.name,
      isNewUser: true // On lui indique qu'il pourra se connecter plus tard
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
    include: { classes: true }
  })

  if (!booking) throw new Error('Booking not found')

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: booking.organization_id }
  })
  
  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  await prisma.bookings.delete({
    where: { id: bookingId }
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

    await prisma.bookings.delete({
      where: { id: bookingId }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Self cancel error:', error)
    return { error: 'Erreur lors de l\'annulation' }
  }
}

