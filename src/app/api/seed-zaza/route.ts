import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.$queryRaw`SELECT * FROM auth.users WHERE email = 'zaza@gmail.com'`
    const userList = users as any[];
    if (!userList || userList.length === 0) {
      return NextResponse.json({ error: 'zaza@gmail.com not found' }, { status: 404 });
    }
    const userId = userList[0].id;

    const orgMember = await prisma.org_members.findFirst({
      where: { user_id: userId, role: 'owner' },
      include: { organizations: true }
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found for zaza' }, { status: 404 });
    }

    const orgId = orgMember.organization_id;
    const coachId = orgMember.id;

    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0); 
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); 
    baseDate.setDate(diff);

    const classesToCreate = [
      { title: "Yoga Vinyasa", dayOffset: 0, hour: 9, duration: 60, color: "#4f46e5" },
      { title: "Pilates Reformer", dayOffset: 0, hour: 12, duration: 45, color: "#e11d48" },
      { title: "HIIT Cardio", dayOffset: 0, hour: 18, duration: 45, color: "#ea580c" },
      { title: "Yoga Doux", dayOffset: 1, hour: 10, duration: 60, color: "#4f46e5" },
      { title: "Cross-Training", dayOffset: 1, hour: 18, duration: 60, color: "#ea580c" },
      { title: "Pilates Mat", dayOffset: 1, hour: 19, duration: 45, color: "#e11d48" },
      { title: "Yoga Ashtanga", dayOffset: 2, hour: 8, duration: 90, color: "#4f46e5" },
      { title: "Stretching", dayOffset: 2, hour: 12, duration: 30, color: "#059669" },
      { title: "Bootcamp", dayOffset: 2, hour: 19, duration: 60, color: "#ea580c" },
      { title: "Pilates Reformer", dayOffset: 3, hour: 9, duration: 45, color: "#e11d48" },
      { title: "Yoga Vinyasa", dayOffset: 3, hour: 18, duration: 60, color: "#4f46e5" },
      { title: "HIIT Intense", dayOffset: 4, hour: 12, duration: 45, color: "#ea580c" },
      { title: "Yoga Détente", dayOffset: 4, hour: 18, duration: 60, color: "#059669" },
      { title: "Masterclass Yoga", dayOffset: 5, hour: 10, duration: 120, color: "#4f46e5" },
      { title: "Pilates Avancé", dayOffset: 5, hour: 14, duration: 60, color: "#e11d48" },
      { title: "Méditation", dayOffset: 6, hour: 18, duration: 60, color: "#059669" },
    ];

    let count = 0;
    for (const c of classesToCreate) {
      const classDate = new Date(baseDate);
      classDate.setDate(classDate.getDate() + c.dayOffset);
      classDate.setHours(c.hour, 0, 0, 0);

      await prisma.classes.create({
        data: {
          organization_id: orgId,
          coach_id: coachId,
          title: c.title,
          description: "Cours généré pour la démonstration.",
          starts_at: classDate,
          duration_min: c.duration,
          capacity: 15,
          color: c.color,
          price: 20
        }
      });
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
