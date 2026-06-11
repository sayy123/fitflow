import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { SettingsClient } from './client'
import { cookies } from 'next/headers'

export default async function SettingsPage() {
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

  const staffMemberships = memberships.filter((m) => ["owner", "admin", "coach"].includes(m.role));
  let currentMember = staffMemberships[0] || memberships[0];

  if (activeOrgId && staffMemberships.length > 0) {
    const activeStaffMembership = staffMemberships.find(m => m.organization_id === activeOrgId);
    if (activeStaffMembership) {
      currentMember = activeStaffMembership;
    }
  }

  if (!currentMember) {
    redirect('/dashboard')
  }

  return <SettingsClient 
    organization={{
      id: currentMember.organizations.id,
      name: currentMember.organizations.name,
      address: currentMember.organizations.address,
      phone: currentMember.organizations.phone,
      plan: currentMember.organizations.plan,
      stripe_account_id: currentMember.organizations.stripe_account_id,
      stripe_charges_enabled: currentMember.organizations.stripe_charges_enabled,
      payment_link: currentMember.organizations.payment_link,
    }} 
    user={{
      email: user.email || '',
      user_metadata: user.user_metadata
    }}
    role={currentMember.role}
  />
}
