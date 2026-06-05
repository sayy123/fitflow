import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return new Response('Token manquant', { status: 400 })
  }

  try {
    // 1. Trouver la réservation en attente
    const pending = await prisma.pending_bookings.findUnique({
      where: { token },
      include: { 
        organizations: true,
        classes: true
      }
    })

    if (!pending) {
      return new Response('Lien invalide ou expiré', { status: 404 })
    }

    if (new Date() > pending.expires_at) {
      await prisma.pending_bookings.delete({ where: { id: pending.id } })
      return new Response('Ce lien a expiré', { status: 410 })
    }

    const supabase = await createClient()

    // 2. Créer le compte Supabase si un mot de passe était fourni
    // Note: Dans un flux réel, on utiliserait signUp de Supabase avec confirmation d'email.
    // Ici, pour simplifier et répondre à la demande d'inscription automatique :
    let userId: string | null = null

    if (pending.password_hash) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: pending.email,
        password: pending.password_hash,
        options: {
          data: {
            full_name: pending.full_name,
          }
        }
      })

      if (authError && !authError.message.includes('already registered')) {
        console.error('Verify booking auth error:', authError)
      } else {
        userId = authData.user?.id || null
      }
    }

    // 3. Finaliser la réservation
    await prisma.$transaction(async (tx) => {
      // Créer/Récupérer le membre du studio
      let member = await tx.studio_members.findUnique({
        where: { 
          organization_id_email: { 
            organization_id: pending.organization_id, 
            email: pending.email 
          } 
        }
      })

      if (!member) {
        member = await tx.studio_members.create({
          data: {
            organization_id: pending.organization_id,
            email: pending.email,
            full_name: pending.full_name,
          }
        })
      }

      // Créer la réservation réelle
      await tx.bookings.create({
        data: {
          class_id: pending.class_id,
          studio_member_id: member.id,
          organization_id: pending.organization_id,
          status: 'confirmed',
        }
      })

      // Créer l'entrée org_members si on a un userId
      if (userId) {
        await tx.org_members.upsert({
          where: {
            organization_id_user_id: {
              organization_id: pending.organization_id,
              user_id: userId
            }
          },
          update: { display_name: pending.full_name },
          create: {
            organization_id: pending.organization_id,
            user_id: userId,
            role: 'member',
            display_name: pending.full_name,
          }
        })
      }

      // Supprimer la réservation en attente
      await tx.pending_bookings.delete({
        where: { id: pending.id }
      })
    })

    // 4. Rediriger vers une page de succès ou le dashboard
    redirect(`/login?message=${encodeURIComponent('Votre réservation est confirmée ! Vous pouvez maintenant vous connecter.')}`)

  } catch (error) {
    console.error('Verification error:', error)
    return new Response('Une erreur est survenue lors de la validation', { status: 500 })
  }
}
