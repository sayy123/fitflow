import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DevTools } from "@/components/dev-tools";
import { Sidebar } from "@/components/sidebar";
import { TrialBlockedWrapper } from "./trial-blocked-wrapper";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await prisma.org_members.findMany({
    where: { user_id: user.id },
    include: { organizations: true },
  });

  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id }
  });

  if (memberships.length === 0) {
    return (
      <div className="flex min-h-screen bg-zinc-50/30 text-zinc-900 font-sans selection:bg-zinc-200">
        <Sidebar
          organizationName=""
          role="member"
          user={user}
          avatarUrl={null}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full">
            {children}
          </main>
          <div className="fixed bottom-4 left-4 z-50">
            <DevTools />
          </div>
        </div>
      </div>
    );
  }

  const staffMemberships = memberships.filter((m) =>
    ["owner", "admin", "coach"].includes(m.role),
  );
  
  const cookieStore = await cookies();
  let activeOrgId = cookieStore.get('active_org_id')?.value;

  // Si pas de cookie, on en utilise un par défaut pour l'affichage
  if (!activeOrgId && staffMemberships.length > 0) {
    activeOrgId = staffMemberships[0].organization_id;
  }

  let member = staffMemberships[0];

  if (activeOrgId) {
    const activeStaffMembership = staffMemberships.find(m => m.organization_id === activeOrgId);
    if (activeStaffMembership) {
      member = activeStaffMembership;
    }
  }

  member = member || memberships[0];

  // Logic: Only restrict owners if trial expired
  const isOwner = member.role === "owner";
  
  const now = new Date();
  const trialEnd = userProfile?.trial_ends_at ? new Date(userProfile.trial_ends_at) : null;
  const isTrialExpired = trialEnd ? now > trialEnd : false;
  const isTrialing = userProfile?.subscription_status === "trialing";

  return (
    <div className="flex min-h-screen bg-zinc-50/30 text-zinc-900 font-sans selection:bg-zinc-200">
      <Sidebar
        organizationName={member.organizations.name}
        role={member.role}
        user={user}
        avatarUrl={member.avatar_url}
        trialEndsAt={userProfile?.trial_ends_at}
        subscriptionStatus={userProfile?.subscription_status}
        plan={userProfile?.plan}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full relative">
          <TrialBlockedWrapper
            isOwner={isOwner}
            isTrialExpired={isTrialExpired}
            isTrialing={isTrialing}
            trialEndsAt={userProfile?.trial_ends_at || null}
          >
            {children}
          </TrialBlockedWrapper>
        </main>
        <div className="fixed bottom-4 left-4 z-50">
          <DevTools />
        </div>
      </div>
    </div>
  );
}
