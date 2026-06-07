'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function joinStudioAutomaticallyAction(organizationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Non authentifié' }
  }

  try {
    // 1. Vérifier la limite de membres pour le plan Starter (40 max)
    const org = await prisma.organizations.findUnique({
      where: { id: organizationId }
    })

    if (!org) return { error: 'Studio introuvable' }

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

    // 2. Créer l'entrée dans studio_members pour le suivi interne (si n'existe pas)
    await prisma.studio_members.upsert({
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

    // 3. S'assurer que l'utilisateur est aussi dans org_members pour voir le dashboard
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

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Auto-join error:', error)
    return { error: 'Erreur lors de l\'adhésion au studio' }
  }
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
