'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { cookies } from 'next/headers'

const classSchema = z.object({
  title: z.string().min(2, 'Titre trop court'),
  description: z.string().optional(),
  starts_at: z.string().datetime(),
  duration_min: z.number().int().min(15).max(240),
  capacity: z.number().int().min(1).max(500),
  location: z.string().optional(),
  color: z.string().default('#4f46e5'),
  coach_id: z.string().uuid().optional().nullable(),
  organization_id: z.string().uuid().optional().nullable(),
})

export async function createClassAction(data: z.infer<typeof classSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const cookieStore = await cookies()
  const activeOrgId = data.organization_id || cookieStore.get('active_org_id')?.value

  // Récupérer le membre pour l'organisation cible
  let member = await prisma.org_members.findFirst({
    where: { 
      user_id: user.id,
      organization_id: activeOrgId || undefined 
    },
    include: { organizations: true }
  })

  // FALLBACK: Si on ne trouve rien avec l'activeOrgId, on prend la première adhésion staff du mec
  if (!member) {
    member = await prisma.org_members.findFirst({
      where: { 
        user_id: user.id,
        role: { in: ['owner', 'admin', 'coach'] }
      },
      include: { organizations: true }
    })
  }
  
  console.log(`[createClassAction] Final Member: ${member?.id}, Role: ${member?.role}, Org: ${member?.organizations?.name} (${member?.organization_id})`);

  // Seuls les admins/staff peuvent créer des cours
  if (!member || !['owner', 'admin', 'coach'].includes(member.role)) {
    return { error: 'Permission refusée' }
  }

  // Vérification de la limite de salles (locations)
  const org = member.organizations;
  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id }
  });
  const isPremium = userProfile?.plan === 'premium';
  const roomLimit = isPremium ? 3 : 1;

  if (data.location && data.location.trim() !== '') {
    const allOrgClasses = await prisma.classes.findMany({
      where: { organization_id: org.id },
      select: { location: true }
    });
    
    const uniqueLocations = new Set(allOrgClasses.map(c => c.location?.trim()).filter(Boolean));
    const normalizedLocation = data.location.trim();
    
    // Si c'est une nouvelle salle qui n'existe pas encore
    if (!uniqueLocations.has(normalizedLocation)) {
      if (uniqueLocations.size >= roomLimit) {
        return { 
          error: `Limite de salles atteinte. Le plan ${isPremium ? 'Premium' : 'Starter'} permet de gérer ${roomLimit} salle(s) maximum.` 
        };
      }
    }
  }

  try {
    await prisma.classes.create({
      data: {
        ...data,
        location: data.location?.trim() || null,
        organization_id: member.organization_id,
        coach_id: data.coach_id === undefined ? member.id : data.coach_id,
      }
    })

    revalidatePath('/dashboard/classes')
    return { success: true }
  } catch (error) {
    console.error('Create class error:', error)
    return { error: 'Erreur lors de la création du cours' }
  }
}

export async function updateClassAction(id: string, data: Partial<z.infer<typeof classSchema>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Récupérer le cours pour connaître son organisation
  const cls = await prisma.classes.findUnique({
    where: { id }
  })
  if (!cls) throw new Error('Class not found')

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: cls.organization_id }
  })
  
  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  await prisma.classes.update({
    where: { id },
    data
  })

  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function cancelClassAction(id: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const cls = await prisma.classes.findUnique({
    where: { id }
  })
  if (!cls) throw new Error('Class not found')

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: cls.organization_id }
  })
  
  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  await prisma.classes.update({
    where: { id },
    data: {
      is_cancelled: true,
      cancel_reason: reason
    }
  })

  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function deleteClassAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const cls = await prisma.classes.findUnique({
    where: { id },
    include: {
      organizations: true,
      bookings: {
        include: {
          studio_members: true
        }
      }
    }
  })
  if (!cls) throw new Error('Class not found')

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: cls.organization_id }
  })
  
  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  // Send cancellation emails
  const { sendClassCancelledEmail } = await import('@/lib/emails/send')
  for (const booking of cls.bookings) {
    if (booking.studio_members.email) {
      try {
        await sendClassCancelledEmail({
          email: booking.studio_members.email,
          fullName: booking.studio_members.full_name,
          className: cls.title,
          startsAt: cls.starts_at,
          studioName: cls.organizations.name,
        })
      } catch (err) {
        console.error('Erreur lors de l\'envoi de l\'email d\'annulation :', err)
      }
    }
  }

  await prisma.classes.delete({
    where: { id }
  })

  revalidatePath('/dashboard/classes')
  return { success: true }
}
