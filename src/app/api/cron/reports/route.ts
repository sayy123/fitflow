import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMonthlyReportEmail } from '@/lib/emails/send';

// Forcer le rendu dynamique pour ne pas mettre en cache cette route
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Optionnel : Sécuriser la route cron avec un secret
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Non autorisé', { status: 401 });
  }

  try {
    // 1. Récupérer tous les utilisateurs Premium
    const premiumProfiles = await prisma.user_profiles.findMany({
      where: {
        plan: 'premium',
      },
      include: {
        users: true,
      }
    });

    if (premiumProfiles.length === 0) {
      return NextResponse.json({ message: 'Aucun utilisateur premium à qui envoyer un rapport.' });
    }

    // 2. Définir le mois précédent
    const now = new Date();
    // On prend le mois précédent car le rapport mensuel est généralement envoyé le 1er du mois
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const monthName = startOfLastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    let sentCount = 0;

    // 3. Pour chaque utilisateur, rassembler les stats de ses organisations
    for (const profile of premiumProfiles) {
      const staffMemberships = await prisma.org_members.findMany({
        where: {
          user_id: profile.user_id,
          role: { in: ['owner', 'admin'] },
        },
        include: { organizations: true },
      });

      if (staffMemberships.length === 0) continue;

      let totalNewMembers = 0;
      let totalBookings = 0;
      let totalActiveSubscriptions = 0;
      let totalRevenue = 0;

      for (const membership of staffMemberships) {
        const orgId = membership.organization_id;

        // Nouvelles inscriptions le mois dernier
        const newMembersCount = await prisma.studio_members.count({
          where: {
            organization_id: orgId,
            created_at: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
        });
        totalNewMembers += newMembersCount;

        // Total des réservations le mois dernier
        const monthlyBookingsCount = await prisma.bookings.count({
          where: {
            classes: {
              organization_id: orgId,
            },
            created_at: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
            status: 'confirmed',
          },
        });
        totalBookings += monthlyBookingsCount;

        // Abonnements actifs actuellement (ou on pourrait prendre ceux qui étaient actifs à la fin du mois, 
        // mais pour simplifier on prend ceux actuellement actifs, ou créés avant la fin du mois)
        const activeSubscriptionsCount = await prisma.member_subscriptions.count({
          where: {
            organization_id: orgId,
            is_active: true,
            expires_at: { gt: startOfLastMonth },
          },
        });
        totalActiveSubscriptions += activeSubscriptionsCount;

        // Revenus générés le mois dernier
        const monthlySubscriptions = await prisma.member_subscriptions.findMany({
          where: {
            organization_id: orgId,
            created_at: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
          select: { price_paid: true },
        });

        const orgRevenue = monthlySubscriptions.reduce((acc, sub) => {
          return acc + (sub.price_paid ? Number(sub.price_paid) : 0);
        }, 0);
        
        totalRevenue += orgRevenue;
      }

      // Envoi de l'email
      try {
        if (profile.users?.email) {
          const fullName = staffMemberships[0]?.display_name || profile.users.email.split('@')[0];
          await sendMonthlyReportEmail({
            email: profile.users.email,
            fullName,
            monthName,
            stats: {
              revenue: totalRevenue,
              bookings: totalBookings,
              newMembers: totalNewMembers,
              activeSubscriptions: totalActiveSubscriptions,
            },
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`Erreur lors de l'envoi du rapport pour l'utilisateur ${profile.user_id}:`, error);
      }
    }

    return NextResponse.json({ message: `Rapports mensuels envoyés avec succès (${sentCount})` });
  } catch (error) {
    console.error('Erreur globale cron reports:', error);
    return new NextResponse('Erreur interne', { status: 500 });
  }
}
