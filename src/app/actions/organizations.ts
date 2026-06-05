'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateOrganizationAction(orgId: string, data: { name?: string, address?: string, phone?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier permissions (seulement owner pour l'instant)
  const member = await prisma.org_members.findFirst({
    where: { 
      user_id: user.id, 
      organization_id: orgId, 
      role: 'owner' 
    }
  })

  if (!member) {
    return { error: 'Permission refusée' }
  }

  try {
    await prisma.organizations.update({
      where: { id: orgId },
      data: { 
        name: data.name,
        address: data.address,
        phone: data.phone
      }
    })
    
    revalidatePath('/dashboard', 'layout')
    
    return { success: true }
  } catch (error) {
    console.error('Update org error:', error)
    return { error: 'Erreur lors de la mise à jour des informations' }
  }
}

export async function inviteCoachToOrgAction(orgId: string, email: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier permissions (seulement owner)
  const member = await prisma.org_members.findFirst({
    where: { 
      user_id: user.id, 
      organization_id: orgId, 
      role: 'owner' 
    }
  })

  if (!member) {
    return { error: 'Permission refusée' }
  }

  try {
    // Vérifier si déjà membre
    const existing = await prisma.org_members.findFirst({
      where: { 
        organization_id: orgId, 
        users: { email: email.toLowerCase().trim() } 
      }
    })
    if (existing) return { error: "Cet utilisateur est déjà membre de votre studio" }

    // 1. Vérifier si l'utilisateur existe déjà dans Supabase
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();
    const { data: { users } } = await adminSupabase.auth.admin.listUsers();
    const existingAuthUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (existingAuthUser) {
      await prisma.org_members.upsert({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: existingAuthUser.id,
          }
        },
        update: { role: "coach", display_name: name },
        create: {
          organization_id: orgId,
          user_id: existingAuthUser.id,
          role: "coach",
          display_name: name,
        }
      });
    } else {
      // 2. Créer une invitation en attente
      await prisma.org_invitations.create({
        data: {
          organization_id: orgId,
          email: email.toLowerCase().trim(),
          role: "coach"
        }
      });
    }

    // 3. Envoyer un email d'invitation simple
    const { sendWelcomeEmail } = await import("@/lib/emails/send");
    const studio = await prisma.organizations.findUnique({ where: { id: orgId } });
    await sendWelcomeEmail(name, studio?.name || "votre studio", email);

    revalidatePath("/dashboard/coaches");
    return { success: true }
  } catch (error) {
    console.error("Invite coach error:", error)
    return { error: "Erreur lors de l&apos;invitation" }
  }
}

