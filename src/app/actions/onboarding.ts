'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function completeOnboardingAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = formData.get('orgId') as string

  // Vérifier permissions
  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id, organization_id: orgId, role: 'owner' }
  })

  if (member) {
    await prisma.organizations.update({
      where: { id: orgId },
      data: { onboarding_completed: true }
    })
  }

  redirect('/dashboard')
}
