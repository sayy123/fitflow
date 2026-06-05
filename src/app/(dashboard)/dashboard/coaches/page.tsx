import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { CoachesClient } from './client'
import { cookies } from 'next/headers'

export default async function CoachesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const memberships = await prisma.org_members.findMany({
    where: { user_id: user.id },
    include: { organizations: true }
  })

  if (memberships.length === 0) redirect('/dashboard')

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;

  const ownerMemberships = memberships.filter((m) => m.role === "owner");
  let currentMember = ownerMemberships[0];

  if (activeOrgId) {
    const activeOwnerMembership = ownerMemberships.find(m => m.organization_id === activeOrgId);
    if (activeOwnerMembership) {
      currentMember = activeOwnerMembership;
    }
  }

  if (!currentMember) {
    redirect('/dashboard')
  }

  const ownerMembership = await prisma.org_members.findFirst({
    where: { organization_id: currentMember.organization_id, role: 'owner' }
  });
  
  const userProfile = ownerMembership 
    ? await prisma.user_profiles.findUnique({ where: { user_id: ownerMembership.user_id || '' } })
    : null;

  const plan = userProfile?.plan || 'starter';

  const team = await prisma.org_members.findMany({
    where: { organization_id: currentMember.organization_id },
    orderBy: { created_at: 'asc' }
  })

  const invitations = prisma.org_invitations 
    ? await prisma.org_invitations.findMany({
        where: { organization_id: currentMember.organization_id },
        orderBy: { created_at: 'desc' }
      })
    : []

  return (
    <CoachesClient 
      organizationId={currentMember.organization_id}
      team={team}
      invitations={invitations}
      plan={plan}
    />
  )
}
