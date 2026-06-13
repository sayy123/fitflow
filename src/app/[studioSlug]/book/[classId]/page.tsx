import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BookingClient from './client'

import { createClient } from '@/lib/supabase/server'

export default async function BookingPage({ params }: { params: Promise<{ studioSlug: string, classId: string }> }) {
  const { studioSlug, classId } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const org = await prisma.organizations.findUnique({
    where: { slug: studioSlug }
  })

  if (!org) notFound()

  const cls = await prisma.classes.findUnique({
    where: { id: classId, organization_id: org.id },
    include: { 
      org_members: true,
      bookings: { 
        include: {
          studio_members: true
        }
      }
    }
  })

  if (!cls) notFound()

  let hasSubscription = false;
  if (user && user.email) {
    const member = await prisma.studio_members.findUnique({
      where: {
        organization_id_email: {
          organization_id: org.id,
          email: user.email.toLowerCase().trim()
        }
      }
    });
    hasSubscription = member?.has_active_subscription || false;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <BookingClient 
        org={org} 
        cls={{
          ...cls,
          org_members: cls.org_members ? {
            ...cls.org_members,
            display_name: cls.org_members.display_name || ''
          } : null
        }} 
        currentUser={user ? {
          ...user,
          email: user.email || ''
        } : null} 
        hasSubscription={hasSubscription}
      />
    </div>
  )
}
