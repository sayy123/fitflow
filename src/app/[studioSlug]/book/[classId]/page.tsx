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
        where: {
          status: {
            not: 'cancelled'
          },
          studio_members: {
            is_active: true
          }
        },
        include: {
          studio_members: true
        }
      }
    }
  })

  if (!cls) notFound()

  let hasSubscription = false;
  let isRemovedFromClass = false;
  let isInactiveMember = false;

  if (user && user.email) {
    const member = await prisma.studio_members.findUnique({
      where: {
        organization_id_email: {
          organization_id: org.id,
          email: user.email.toLowerCase().trim()
        }
      }
    });
    
    if (member) {
      hasSubscription = member.has_active_subscription || false;
      isInactiveMember = member.is_active === false;

      if (!isInactiveMember) {
        const cancelledBooking = await prisma.bookings.findUnique({
          where: {
            class_id_studio_member_id: {
              class_id: classId,
              studio_member_id: member.id
            }
          }
        });
        if (cancelledBooking?.status === 'cancelled' && cancelledBooking?.cancel_reason === 'removed_by_owner') {
          isRemovedFromClass = true;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BookingClient 
        org={{
          ...org,
          member_monthly_price: org.member_monthly_price,
          member_yearly_price: org.member_yearly_price
        }} 
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
        isRemovedFromClass={isRemovedFromClass}
        isInactiveMember={isInactiveMember}
      />
    </div>
  )
}
