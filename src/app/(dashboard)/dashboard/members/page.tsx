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
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
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

      <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900 tracking-tight">
              Liste des clients ({studioMembers.length})
            </CardTitle>
            <div className="w-full md:w-64">
              <Input
                placeholder="Rechercher..."
                className="rounded-lg border-gray-200 h-10 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            {/* Mobile Scroll Hint */}
            <div className="md:hidden flex items-center justify-center gap-2 mb-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100 animate-pulse">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Faites glisser pour voir plus →</span>
            </div>
            
            <div className="overflow-x-auto touch-pan-x pb-4 scrollbar-hide">
              <div className="min-w-[800px] md:min-w-0">
                <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nom
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  Séances
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Inscrit le
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studioMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-12 font-medium"
                  >
                    Aucun membre.
                  </TableCell>
                </TableRow>
              ) : (
                studioMembers.map((m) => (
                  <TableRow
                    key={m.id}
                    className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm font-semibold text-xs text-gray-600 uppercase">
                          {m.full_name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">
                          {m.full_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 font-medium text-sm">
                      {m.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${m.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        {m.is_active ? "Actif" : "Inactif"}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 text-center text-sm">
                      {m._count.bookings}
                    </TableCell>
                    <TableCell className="text-gray-500 font-medium text-xs">
                      {new Date(m.created_at!).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Link href={`/dashboard/members/${m.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg h-8 font-medium text-sm text-zinc-600 hover:bg-zinc-100 transition-colors"
                        >
                          Détails
                        </Button>
                      </Link>
                      <DeleteMemberButton memberId={m.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
