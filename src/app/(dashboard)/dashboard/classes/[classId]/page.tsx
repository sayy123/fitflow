import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ClassDetailClient from './client'

export default async function ClassDetailPage(props: { params: Promise<{ classId: string }> }) {
  const params = await props.params
  const { classId } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Récupérer le cours d'abord pour connaître son organisation
  const cls = await prisma.classes.findUnique({
    where: { id: classId },
    include: {
      org_members: true,
      organizations: true,
      bookings: {
        include: {
          studio_members: true
        },
        orderBy: {
          created_at: 'asc'
        }
      }
    }
  })

  if (!cls) notFound()

  // 2. Vérifier si l'utilisateur a accès au dashboard de cette organisation
  const userMembership = await prisma.org_members.findFirst({
    where: { 
      user_id: user.id,
      organization_id: cls.organization_id
    }
  })

  // Seul le staff (owner, admin, coach) peut accéder aux détails de gestion
  if (!userMembership || userMembership.role === 'member') {
    redirect('/dashboard')
  }

  const coaches = await prisma.org_members.findMany({
    where: { 
      organization_id: cls.organization_id,
      role: { in: ['owner', 'admin', 'coach'] }
    }
  })

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${cls.organizations.slug}/book/${cls.id}?invite=true`

  return (
    <ClassDetailClient 
      cls={cls} 
      inviteLink={inviteLink} 
      coaches={coaches} 
      userRole={userMembership.role} 
    />
  )
}
