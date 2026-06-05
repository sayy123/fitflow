'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
