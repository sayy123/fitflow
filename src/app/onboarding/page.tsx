import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import OnboardingClient from './client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const member = await prisma.org_members.findFirst({
    where: { user_id: user.id },
    include: { organizations: true }
  })

  if (!member) redirect('/login')

  if (member.organizations.onboarding_completed) {
    redirect('/dashboard')
  }

  return <OnboardingClient organizationId={member.organizations.id} />
}
