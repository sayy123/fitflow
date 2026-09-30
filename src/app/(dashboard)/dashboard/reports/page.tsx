import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cookies } from "next/headers";
import { Users, Calendar, Banknote, TrendingUp } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("active_org_id")?.value;

  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id }
  });

  if (userProfile?.plan !== "premium") {
    redirect("/dashboard");
  }

  const staffMemberships = await prisma.org_members.findMany({
    where: { 
      user_id: user.id,
      role: { in: ["owner", "admin"] }
    },
    include: { organizations: true }
  });

  if (staffMemberships.length === 0) redirect("/dashboard");

  let currentMember = staffMemberships[0];
  if (activeOrgId) {
    const active = staffMemberships.find(m => m.organization_id === activeOrgId);
    if (active) currentMember = active;
  }

  const orgId = currentMember.organization_id;

  // Calcul du mois courant
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Nouvelles inscriptions ce mois-ci
  const newMembersCount = await prisma.studio_members.count({
    where: {
      organization_id: orgId,
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  // Total des réservations ce mois-ci
  const monthlyBookingsCount = await prisma.bookings.count({
    where: {
      classes: {
        organization_id: orgId
      },
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      status: "confirmed"
    }
  });

  // Abonnements actifs
  const activeSubscriptionsCount = await prisma.member_subscriptions.count({
    where: {
      organization_id: orgId,
      is_active: true,
      expires_at: { gt: now }
    }
  });

  // Revenus générés ce mois-ci (si applicable via member_subscriptions)
  const monthlySubscriptions = await prisma.member_subscriptions.findMany({
    where: {
      organization_id: orgId,
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    select: { price_paid: true }
  });

  const monthlyRevenue = monthlySubscriptions.reduce((acc, sub) => {
    return acc + (sub.price_paid ? Number(sub.price_paid) : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Rapport Mensuel</h1>
        <p className="text-sm font-medium text-muted-foreground">
          Aperçu de vos performances pour le mois en cours (Premium)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus (Abonnements)</CardTitle>
            <Banknote className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{monthlyRevenue} €</div>
            <p className="text-xs text-muted-foreground mt-1">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Réservations</CardTitle>
            <Calendar className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{monthlyBookingsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Séances confirmées</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nouveaux Membres</CardTitle>
            <Users className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">+{newMembersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Inscrits ce mois-ci</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abonnements Actifs</CardTitle>
            <TrendingUp className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeSubscriptionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total en cours</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Détails des revenus d'abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlySubscriptions.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Vous avez enregistré {monthlySubscriptions.length} paiements d'abonnement ce mois-ci.</p>
              {/* On pourrait ajouter un tableau ici dans le futur */}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucun paiement d'abonnement enregistré ce mois-ci.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
