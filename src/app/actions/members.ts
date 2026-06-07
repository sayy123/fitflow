'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
