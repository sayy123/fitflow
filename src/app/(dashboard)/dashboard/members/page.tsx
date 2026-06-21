import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DeleteMemberButton } from "./delete-member-button";
import { MemberStatusBadge } from "@/components/member-status-badge";

import { cookies } from "next/headers";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const memberships = await prisma.org_members.findMany({
    where: { user_id: user.id },
    include: { organizations: true },
  });

  if (memberships.length === 0) redirect("/dashboard");

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;

  const staffMemberships = memberships.filter((m) => ["owner", "admin", "coach"].includes(m.role));
  let currentMember = staffMemberships[0];

  if (activeOrgId) {
    const activeStaffMembership = staffMemberships.find(m => m.organization_id === activeOrgId);
    if (activeStaffMembership) {
      currentMember = activeStaffMembership;
    }
  }

  if (!currentMember) redirect("/dashboard");

  const ownerMembership = await prisma.org_members.findFirst({
    where: { organization_id: currentMember.organization_id, role: 'owner' }
  });
  
  const userProfile = ownerMembership 
    ? await prisma.user_profiles.findUnique({ where: { user_id: ownerMembership.user_id || '' } })
    : null;

  const isPremium = userProfile?.plan === "premium";
  const memberLimit = isPremium ? Infinity : 40;

  const studioMembers = await prisma.studio_members.findMany({
    where: { organization_id: currentMember.organization_id },
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
  });

  const isLimitReached = studioMembers.length >= memberLimit;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Membres
          </h1>
        </div>
        {isLimitReached && !isPremium && (
          <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 shadow-sm w-full sm:w-auto">
            <span className="text-sm font-semibold text-orange-700">
              Limite atteinte
            </span>
            <Link href="/dashboard/billing" className="ml-auto sm:ml-0">
              <Button
                size="sm"
                className="h-7 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold uppercase tracking-wider"
              >
                Passer en Premium
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-card-foreground tracking-tight">
              Liste des clients ({studioMembers.length})
            </CardTitle>
            <div className="w-full md:w-64">
              <Input
                placeholder="Rechercher..."
                className="rounded-lg border-border h-10 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Séances</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inscrit le</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studioMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12 font-medium">Aucun membre.</TableCell>
                    </TableRow>
                  ) : (
                    studioMembers.map((m) => (
                      <TableRow key={m.id} className="border-border/50 hover:bg-background/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0 shadow-sm font-semibold text-xs text-foreground/80 uppercase">
                              {m.full_name.charAt(0)}
                            </div>
                            <span className="font-semibold text-card-foreground text-sm">{m.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium text-sm">{m.email}</TableCell>
                        <TableCell>
                          <MemberStatusBadge memberId={m.id} isActive={m.is_active} initialHasSubscription={m.has_active_subscription} />
                        </TableCell>
                        <TableCell className="font-semibold text-card-foreground text-center text-sm">{m._count.bookings}</TableCell>
                        <TableCell className="text-muted-foreground font-medium text-xs">{new Date(m.created_at!).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          <Link href={`/dashboard/members/${m.id}`}>
                            <Button variant="ghost" size="sm" className="rounded-lg h-8 font-medium text-sm text-foreground/80 hover:bg-muted transition-colors">Détails</Button>
                          </Link>
                          <DeleteMemberButton memberId={m.id} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex flex-col divide-y divide-border/50">
              {studioMembers.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm italic">Aucun membre.</div>
              ) : (
                studioMembers.map((m) => (
                  <div key={m.id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0 shadow-sm font-semibold text-sm text-foreground/80 uppercase">
                          {m.full_name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-card-foreground">{m.full_name}</span>
                          <span className="text-xs text-muted-foreground">{m.email}</span>
                        </div>
                      </div>
                      <MemberStatusBadge memberId={m.id} isActive={m.is_active} initialHasSubscription={m.has_active_subscription} />
                    </div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="text-muted-foreground font-medium">Inscrit le {new Date(m.created_at!).toLocaleDateString("fr-FR")}</span>
                        <span className="text-muted-foreground font-medium">Séances: <span className="font-bold text-foreground">{m._count.bookings}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/members/${m.id}`}>
                          <Button variant="outline" size="sm" className="h-8 px-3 font-medium text-xs text-foreground hover:bg-muted transition-colors">
                            Détails
                          </Button>
                        </Link>
                        <DeleteMemberButton memberId={m.id} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
