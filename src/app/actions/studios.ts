'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setActiveStudioAction(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_org_id', orgId, { 
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function createFirstStudioAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const name = formData.get('name') as string
  if (!name || name.length < 2) return { error: 'Nom trop court' }

  const ownedMemberships = await prisma.org_members.findMany({
    where: { user_id: user.id, role: 'owner' }
  })

  if (ownedMemberships.length > 0) {
    return { error: 'Vous possédez déjà un studio.' }
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
  
  try {
    const newOrg = await prisma.$transaction(async (tx) => {
      // 1. Ensure user profile exists
      await tx.user_profiles.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          plan: 'starter',
          subscription_status: 'trialing',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      });

      const org = await tx.organizations.create({
        data: {
          name,
          slug,
          onboarding_completed: true
        }
      })

      await tx.org_members.create({
        data: {
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner'
        }
      })
      
      return org
    })

    const cookieStore = await cookies()
    cookieStore.set('active_org_id', newOrg.id, { path: '/' })
    revalidatePath('/', 'layout')
    
    return { success: true }
  } catch (error) {
    console.error('Create first studio error:', error)
    return { error: 'Erreur lors de la création du studio' }
  }
}

export async function createStudioAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const name = formData.get('name') as string
  if (!name || name.length < 2) return { error: 'Nom trop court' }

  // 1. Check user profile for subscription plan
  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id }
  })

  const hasPremium = userProfile?.plan === 'premium' && userProfile?.subscription_status === 'active'
  
  if (!hasPremium) {
    return { error: 'Vous devez avoir un abonnement Premium actif pour créer des studios supplémentaires.' }
  }

  const ownedMemberships = await prisma.org_members.findMany({
    where: { user_id: user.id, role: 'owner' }
  })

  if (ownedMemberships.length >= 3) {
    return { error: 'Limite atteinte. Le plan Premium permet de gérer un maximum de 3 studios.' }
  }

  // 2. Create the new studio
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
  
  try {
    const newOrg = await prisma.$transaction(async (tx) => {
      const org = await tx.organizations.create({
        data: {
          name,
          slug,
          onboarding_completed: true
        }
      })

      await tx.org_members.create({
        data: {
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          display_name: user.user_metadata?.full_name || 'Owner'
        }
      })
      
      return org
    })

    const cookieStore = await cookies()
    cookieStore.set('active_org_id', newOrg.id, { path: '/' })
    revalidatePath('/dashboard', 'layout')
    
    return { success: true }
  } catch (error) {
    console.error('Create studio error:', error)
    return { error: 'Erreur lors de la création du studio' }
  }
}
