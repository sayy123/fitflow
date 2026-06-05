'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const PLAN_LIMITS: Record<string, number> = {
  starter: 3,
  studio: 10,
  pro: 25,
  premium: 999, // Illimité
};

async function getCoachLimitStatus(orgId: string) {
  const org = await prisma.organizations.findUnique({
    where: { id: orgId },
  });

  if (!org) return { isLimitReached: false, limit: 99, plan: 'unknown', currentTotal: 0 };

  const ownerMembership = await prisma.org_members.findFirst({
    where: { organization_id: orgId, role: 'owner' }
  });

  const userProfile = ownerMembership && ownerMembership.user_id
    ? await prisma.user_profiles.findUnique({ where: { user_id: ownerMembership.user_id } })
    : null;

  const plan = userProfile?.plan || 'starter';

  const coachCount = await prisma.org_members.count({
    where: {
      organization_id: orgId,
      role: "coach",
    },
  });

  let invitationCount = 0;
  try {
      invitationCount = await prisma.org_invitations.count({
        where: {
          organization_id: orgId,
          role: "coach",
        },
      });
  } catch (e) {
      console.warn("Could not count invitations");
  }

  const limit = PLAN_LIMITS[plan] || 3;
  return {
    isLimitReached: coachCount + invitationCount >= limit,
    limit,
    plan: plan,
    currentTotal: coachCount + invitationCount
  };
}

export async function createVirtualCoachAction(orgId: string, name: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const member = await prisma.org_members.findFirst({
      where: { user_id: user.id, organization_id: orgId, role: "owner" },
    });
    if (!member) return { error: "Permission refusée (vous n'êtes pas propriétaire)" };

    const status = await getCoachLimitStatus(orgId);

    if (status.isLimitReached) {
      return {
        error: `Limite atteinte : ${status.limit} coachs max pour le plan ${status.plan}. (Actuels: ${status.currentTotal})`,
      };
    }

    await prisma.org_members.create({
      data: {
        organization_id: orgId,
        display_name: name,
        role: "coach",
      },
    });

    try {
        revalidatePath('/dashboard/coaches');
    } catch (e) {
        // Ignore revalidation errors during actions
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Create virtual coach error:", error);
    return {
      error: `Erreur : ${error.message || 'Problème technique lors de la création'}`,
    };
  }
}

export async function inviteCoachAction(orgId: string, email: string, name?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const member = await prisma.org_members.findFirst({
      where: { user_id: user.id, organization_id: orgId, role: 'owner' }
    })
    if (!member) return { error: 'Permission refusée' }

    const status = await getCoachLimitStatus(orgId);
    if (status.isLimitReached) {
      return {
        error: `Limite atteinte : ${status.limit} coachs max pour le plan ${status.plan}.`,
      };
    }

    const targetEmail = email.toLowerCase().trim()
    
    // 1. Vérifier si l'utilisateur existe déjà dans Supabase Auth
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();
    const { data: { users } } = await adminSupabase.auth.admin.listUsers();
    const existingAuthUser = users.find(u => u.email?.toLowerCase() === targetEmail);

    if (existingAuthUser) {
      // S'il existe déjà, on l'ajoute directement
      await prisma.org_members.upsert({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: existingAuthUser.id,
          }
        },
        update: { role: "coach", display_name: name || targetEmail.split("@")[0] },
        create: {
          organization_id: orgId,
          user_id: existingAuthUser.id,
          role: "coach",
          display_name: name || targetEmail.split("@")[0],
        }
      });
      const { sendWelcomeEmail } = await import("@/lib/emails/send");
      const studio = await prisma.organizations.findUnique({ where: { id: orgId } });
      await sendWelcomeEmail(name || targetEmail.split("@")[0], studio?.name || "votre studio", targetEmail);
    } else {
      // S'il n'existe pas, on crée une invitation en attente
      await prisma.org_invitations.create({
        data: {
          organization_id: orgId,
          email: targetEmail,
          role: "coach"
        }
      });
      // Optionnel: Envoyer un mail disant "Vous avez été invité, créez votre compte ici"
    }

    try { revalidatePath("/dashboard/coaches"); } catch (e) {}
    return { success: true }
  } catch (error: any) {
    console.error('Invite coach error:', error)
    return { error: `Erreur : ${error.message || 'Problème technique lors de l\'invitation'}` }
  }
}

export async function deleteCoachAction(orgId: string, memberId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const owner = await prisma.org_members.findFirst({
      where: { user_id: user.id, organization_id: orgId, role: 'owner' }
    })
    if (!owner) return { error: 'Permission refusée' }

    await prisma.org_members.delete({
      where: { id: memberId, organization_id: orgId }
    })
    try { revalidatePath('/dashboard/coaches'); } catch (e) {}
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la suppression' }
  }
}

export async function cancelInvitationAction(orgId: string, invitationId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Non authentifié' }
      
        const owner = await prisma.org_members.findFirst({
          where: { user_id: user.id, organization_id: orgId, role: 'owner' }
        })
        if (!owner) return { error: 'Permission refusée' }
      
        await prisma.org_invitations.delete({
          where: { id: invitationId, organization_id: orgId }
        })
        try { revalidatePath('/dashboard/coaches'); } catch (e) {}
        return { success: true }
    } catch (error) {
      return { error: 'Erreur lors de l\'annulation' }
    }
}

export async function respondToInvitationAction(invitationId: string, accept: boolean) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Non authentifié' }

        const invitation = await prisma.org_invitations.findUnique({
            where: { id: invitationId },
            include: { organizations: true }
        })

        if (!invitation || invitation.email !== user.email) {
            return { error: 'Invitation introuvable' }
        }

        if (accept) {
            const status = await getCoachLimitStatus(invitation.organization_id);
            if (status.isLimitReached) {
                return {
                    error: `Limite de coachs atteinte (${status.limit} maximum).`,
                };
            }

            await prisma.org_members.create({
                data: {
                    organization_id: invitation.organization_id,
                    user_id: user.id,
                    role: invitation.role,
                    display_name: user.user_metadata?.full_name || invitation.email.split('@')[0]
                }
            })
        }

        await prisma.org_invitations.delete({
            where: { id: invitationId }
        })

        try { revalidatePath('/dashboard'); } catch (e) {}
        return { success: true }
    } catch (error: any) {
        console.error('Respond invitation error:', error)
        return { error: `Erreur : ${error.message || 'inconnue'}` }
    }
}
