import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cookies } from "next/headers";
import { Users, Calendar, Banknote, TrendingUp } from "lucide-react";
import ExportCSVButton from "./export-csv-button";

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

  // Subscriptions payées ce mois-ci
  const monthlySubscriptions = await prisma.member_subscriptions.findMany({
    where: {
      organization_id: orgId,
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    include: {
      studio_members: true
    }
  });

  // Réservations payées ce mois-ci
  const paidBookings = await prisma.bookings.findMany({
    where: {
      organization_id: orgId,
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      payment_status: 'paid'
    },
    include: {
      studio_members: true,
      classes: true
    }
  });

  const transactions = [];

  for (const sub of monthlySubscriptions) {
    if (sub.price_paid && Number(sub.price_paid) > 0) {
      transactions.push({
        id: sub.id,
        date: sub.created_at?.toISOString() || new Date().toISOString(),
        member: sub.studio_members.full_name,
        email: sub.studio_members.email,
        description: `Pass ${sub.type === 'monthly' ? 'Mensuel' : 'Annuel'}`,
        amount: Number(sub.price_paid),
        type: 'subscription'
      });
    }
  }

  for (const b of paidBookings) {
    if (b.classes.price && b.classes.price > 0) {
      transactions.push({
        id: b.id,
        date: b.created_at?.toISOString() || new Date().toISOString(),
        member: b.studio_members.full_name,
        email: b.studio_members.email,
        description: `Séance à l'unité: ${b.classes.title}`,
        amount: Number(b.classes.price),
        type: 'booking'
      });
    }
  }

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthlyRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);
  const monthName = startOfMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Rapport Mensuel</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Aperçu de vos performances pour le mois en cours (Premium)
          </p>
        </div>
        <ExportCSVButton transactions={transactions} monthName={monthName} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus Totaux</CardTitle>
            <Banknote className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{monthlyRevenue.toFixed(2)} €</div>
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
          <CardTitle className="text-lg font-semibold text-foreground">Historique des transactions de {monthName}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Membre</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {new Date(t.date).toLocaleDateString('fr-FR')} à {new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{t.member}</span>
                          <span className="text-xs text-muted-foreground">{t.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        +{t.amount.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucune transaction enregistrée ce mois-ci.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
