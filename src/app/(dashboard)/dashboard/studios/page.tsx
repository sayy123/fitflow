import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StudiosClient from "./client";
import { cookies } from "next/headers";

export default async function StudiosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all memberships where user is owner
  const ownedMemberships = await prisma.org_members.findMany({
    where: {
      user_id: user.id,
      role: "owner",
    },
    include: {
      organizations: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });

  if (ownedMemberships.length === 0) {
    redirect("/dashboard");
  }

  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id }
  });

  const hasPremium = userProfile?.plan === "premium" && userProfile?.subscription_status === "active";

  const studios = ownedMemberships.map((m) => ({
    id: m.organizations.id,
    name: m.organizations.name,
    plan: userProfile?.plan || "starter",
    address: m.organizations.address,
    subscription_status: userProfile?.subscription_status || "trialing",
  }));

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("active_org_id")?.value || studios[0].id;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <StudiosClient
        studios={studios}
        isPremium={hasPremium}
        activeStudioId={activeOrgId}
      />
    </div>
  );
}
