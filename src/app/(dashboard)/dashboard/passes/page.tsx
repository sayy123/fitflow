import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PassesClient } from "./client";
import { cookies } from "next/headers";

export default async function PassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await prisma.org_members.findMany({
    where: { user_id: user.id },
    include: { organizations: true },
  });

  const staffMemberships = memberships.filter((m) =>
    ["owner"].includes(m.role)
  );

  if (staffMemberships.length === 0) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("active_org_id")?.value;

  let member = staffMemberships[0];

  if (activeOrgId) {
    const activeStaffMembership = staffMemberships.find(
      (m) => m.organization_id === activeOrgId
    );
    if (activeStaffMembership) {
      member = activeStaffMembership;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-card-foreground tracking-tight">
          Offres Clients
        </h2>
        <p className="text-sm font-medium text-muted-foreground">
          Gérez vos abonnements et offres pour vos membres.
        </p>
      </div>
      <PassesClient organization={member.organizations} />
    </div>
  );
}
