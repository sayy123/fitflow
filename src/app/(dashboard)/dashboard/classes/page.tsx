import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ClassesClient from "./client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cookies } from "next/headers";

export default async function ClassesPage(props: {
  searchParams: Promise<{ coachId?: string; orgId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const searchParams = await props.searchParams;
  const coachId = searchParams.coachId;
  const orgIdFromParams = searchParams.orgId;

  const memberships = await prisma.org_members.findMany({
    where: { user_id: user.id },
    include: { organizations: true },
  });

  if (memberships.length === 0) redirect("/dashboard");

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;

  // Trouver l'organisation de travail prioritaire (Owner > Staff > Member)
  const staffMemberships = memberships.filter((m) =>
    ["owner", "admin", "coach"].includes(m.role),
  );
  
  let currentMember = orgIdFromParams
    ? memberships.find((m) => m.organization_id === orgIdFromParams) || memberships[0]
    : staffMemberships[0] || memberships[0];

  if (!orgIdFromParams && activeOrgId && staffMemberships.length > 0) {
    const activeStaffMembership = staffMemberships.find(m => m.organization_id === activeOrgId);
    if (activeStaffMembership) {
      currentMember = activeStaffMembership;
    }
  }

  // 1. Pour les OWNERS et ADMINS : Vue de gestion complète par défaut
  if (["owner", "admin"].includes(currentMember.role)) {
    const effectiveCoachId = coachId || currentMember.id;

    const organization = currentMember.organizations;
    const isPremium = organization.plan === "premium";
    const roomLimit = isPremium ? 3 : 1;

    // Récupérer toutes les classes pour compter les lieux uniques
    const allOrgClasses = await prisma.classes.findMany({
      where: { organization_id: currentMember.organization_id },
      select: { location: true },
    });

    const uniqueLocations = Array.from(
      new Set(allOrgClasses.map((c) => c.location).filter(Boolean)),
    );
    const isRoomLimitReached = uniqueLocations.length >= roomLimit;

    const coaches = await prisma.org_members.findMany({
      where: {
        organization_id: currentMember.organization_id,
        role: { in: ["owner", "admin", "coach"] },
      },
    });

    const classes = await prisma.classes.findMany({
      where: {
        organization_id: currentMember.organization_id,
        OR: [
          { is_cancelled: false },
          { is_cancelled: null }
        ]
      },
      include: { 
        org_members: true,
        organizations: true
      },
      orderBy: { starts_at: "asc" },
    });

    return (
      <div className="space-y-6">
        {coaches.length > 1 && coachId && coachId !== currentMember.id && (
          <Link
            href="/dashboard/classes"
            className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
          >
            ← Retour à mon planning
          </Link>
        )}
        <ClassesClient
          initialClasses={classes}
          coaches={coaches}
          organizations={memberships.map(m => m.organizations)}
          userRole={currentMember.role}
          studioName={currentMember.organizations.name}
          studioSlug={currentMember.organizations.slug}
          currentMemberId={currentMember.id}
        />
      </div>
    );
  }

  // 2. Pour les CLIENTS et COACHS : Afficher la liste des studios (organizations)
  // On récupère les studios avec les infos du proprio pour afficher sa photo
  const myOrgIds = memberships.map((m) => m.organization_id);
  const myOrganizationsWithOwners = await prisma.organizations.findMany({
    where: { id: { in: myOrgIds } },
    include: {
      org_members: {
        where: { role: "owner" },
        take: 1,
      },
    },
  });

  if (orgIdFromParams) {
    const org = myOrganizationsWithOwners.find((o) => o.id === orgIdFromParams);
    const membershipHere = memberships.find(
      (m) => m.organization_id === orgIdFromParams,
    );

    if (org && membershipHere) {
      // Pour un client ou coach, on affiche TOUS les cours du studio
      const classes = await prisma.classes.findMany({
        where: { organization_id: orgIdFromParams, is_cancelled: false },
        include: { org_members: true },
        orderBy: { starts_at: "asc" },
      });

      const coaches = await prisma.org_members.findMany({
        where: {
          organization_id: orgIdFromParams,
          role: { in: ["owner", "admin", "coach"] },
        },
      });

      return (
        <div className="space-y-6">
          <Link
            href="/dashboard/classes"
            className="text-sm font-medium text-primary hover:underline"
          >
            &larr; Retour à mes studios
          </Link>
          <ClassesClient
            initialClasses={classes}
            coaches={coaches}
            organizations={[org]}
            userRole={membershipHere.role} // Pass the actual role ('coach' or 'member')
            studioName={org.name}
            studioSlug={org.slug}
            currentMemberId={membershipHere.id}
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground tracking-tight">
          Mes Studios
        </h2>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Sélectionnez un studio pour voir son planning et réserver.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {myOrganizationsWithOwners.map((org) => {
          const owner = org.org_members[0];
          return (
            <Card
              key={org.id}
              className="border border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-all group"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className="size-12 rounded-full bg-primary/5 border border-primary/10 overflow-hidden flex items-center justify-center text-xl font-bold text-primary shadow-sm shrink-0">
                  {owner?.avatar_url ? (
                    <img
                      src={owner.avatar_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    org.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg font-semibold text-card-foreground leading-tight truncate">
                    {org.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                    {org.address || ""}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={`/dashboard/classes?orgId=${org.id}`}>
                  <Button
                    className="w-full rounded-lg font-medium text-sm h-10 transition-colors"
                    style={{
                      backgroundColor: org.color_primary || undefined,
                      color: org.color_primary ? "#fff" : undefined,
                    }}
                  >
                    Voir le planning
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
