import prisma from '@/lib/prisma'
import { sendBookingNotificationToManager, sendMemberCancelledEmailToManager } from '@/lib/emails/send'

export async function notifyManagersOfBooking(orgId: string, memberName: string, className: string, startsAt: Date) {
  const managers = await prisma.org_members.findMany({
    where: { organization_id: orgId, role: { in: ['owner', 'admin'] } },
    include: { users: true }
  })
  for (const m of managers) {
    if (m.users?.email) {
      await sendBookingNotificationToManager({
        managerEmail: m.users.email,
        memberName,
        className,
        startsAt
      })
    }
  }
}

export async function notifyManagersOfCancellation(orgId: string, memberName: string, className: string, startsAt: Date) {
  const managers = await prisma.org_members.findMany({
    where: { organization_id: orgId, role: { in: ['owner', 'admin'] } },
    include: { users: true }
  })
  for (const m of managers) {
    if (m.users?.email) {
      await sendMemberCancelledEmailToManager({
        managerEmail: m.users.email,
        memberName,
        className,
        startsAt
      })
    }
  }
}
