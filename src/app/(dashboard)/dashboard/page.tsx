import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InviteJoiner } from "@/components/invite-joiner";
import { signOutAction } from "@/app/actions/auth";
import { createFirstStudioAction } from "@/app/actions/studios";
import {
  respondToInvitationAction,
  createVirtualCoachAction,
  inviteCoachAction,
  deleteCoachAction,
  cancelInvitationAction,
} from "@/app/actions/coaches";
import { memberSelfCancelBookingAction } from "@/app/actions/bookings";
import {
  CheckCircle2,
  XCircle,
  BellRing,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Zap,
  Building2,
  Users,
  LogOut,
} from "lucide-react";

interface DashboardClass {
  id: string;
  title: string;
  organizations?: { name: string; color_primary?: string | null };
  bookings?: {
    id: string;
    studio_members: { avatar_url?: string | null; full_name: string };
  }[];
  starts_at: Date | string;
  location?: string | null;
  org_members?: {
    avatar_url?: string | null;
    display_name: string | null;
  } | null;
}

interface DashboardBooking {
  id: string;
  status: string;
  organizations: { name: string; slug: string; color_primary?: string | null };
  classes: {
    id: string;
    title: string;
    starts_at: Date | string;
    bookings: {
      id: string;
      studio_members: { avatar_url?: string | null; full_name: string };
    }[];
  };
}

import { cookies } from "next/headers";

export default async function DashboardPage(props: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const searchParams = await props.searchParams;
  const orgId = searchParams.orgId;

  const userEmail = user.email?.toLowerCase().trim();

  const [memberships, invitations] = await Promise.all([
    prisma.org_members.findMany({
      where: { user_id: user.id },
      include: { organizations: true },
    }),
    prisma.org_invitations.findMany({
      where: { email: userEmail, status: "pending" },
      include: { organizations: true },
    }),
  ]);

  // SI AUCUNE RELATION (ni membre, ni invité)
  if (memberships.length === 0 && invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Bienvenue sur Fitflow</h2>
          <p className="text-gray-500 text-base max-w-sm mx-auto font-medium">
            Comment souhaitez-vous utiliser la plateforme ?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-6">
          {/* Create Studio Option */}
          <Card className="border-zinc-200 bg-white rounded-[2.5rem] shadow-xl overflow-hidden hover:border-zinc-300 transition-all flex flex-col group">
            <CardHeader className="text-center pb-2 pt-10 px-8">
              <div className="size-16 rounded-3xl bg-zinc-900 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-zinc-900/20 group-hover:scale-110 transition-transform duration-500">
                <Building2 className="size-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-zinc-900">
                Créer un studio
              </CardTitle>
              <p className="text-sm text-zinc-500 font-medium mt-2">
                Je suis gérant et je veux paramétrer mon propre espace.
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end p-8 pt-4">
              <form action={async (formData) => { "use server"; await createFirstStudioAction(formData); }} className="space-y-4">
                <input
                  id="name"
                  name="name"
                  placeholder="Nom de votre studio"
                  required
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-zinc-50/50 hover:bg-zinc-50 outline-none font-medium"
                />
                <Button type="submit" className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-all shadow-xl active:scale-[0.98]">
                  Démarrer mon essai gratuit
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Join Studio Option */}
          <Card className="border-zinc-200 bg-white rounded-[2.5rem] shadow-xl overflow-hidden hover:border-zinc-300 transition-all flex flex-col group">
            <CardHeader className="text-center pb-2 pt-10 px-8">
              <div className="size-16 rounded-3xl bg-zinc-50 border border-zinc-100 mx-auto flex items-center justify-center mb-6 shadow-sm group-hover:bg-zinc-100 transition-colors duration-500">
                <Users className="size-8 text-zinc-400" />
              </div>
              <CardTitle className="text-xl font-bold text-zinc-900">
                Rejoindre un studio
              </CardTitle>
              <p className="text-sm text-zinc-500 font-medium mt-2">
                J&apos;ai reçu un lien d&apos;invitation d&apos;un gérant.
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end p-8 pt-4">
              <InviteJoiner />
            </CardContent>
          </Card>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            <LogOut className="size-3" />
            Se déconnecter
          </button>
        </form>
      </div>
    );
  }

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;

  // Priorité au rôle Staff (owner, admin, coach) s'il existe
  const staffMemberships = memberships.filter((m) =>
    ["owner", "admin", "coach"].includes(m.role),
  );
  
  let member = orgId
    ? memberships.find((m) => m.organization_id === orgId) || memberships[0]
    : staffMemberships[0] || memberships[0];

  if (!orgId && activeOrgId && staffMemberships.length > 0) {
    const activeStaffMembership = staffMemberships.find(m => m.organization_id === activeOrgId);
    if (activeStaffMembership) {
      member = activeStaffMembership;
    }
  }

  if (!member) return null; // should not happen based on earlier checks

  // Données pour le dashboard (conditionnel selon le rôle)
  let dashboardData: {
    myBookings?: DashboardBooking[];
    coachedClasses?: DashboardClass[];
    activeMembersCount?: number;
    classesThisWeekCount?: number;
    totalBookingsCount?: number;
    upcomingStaffClasses?: DashboardClass[];
  } = {};

  if (["member", "coach"].includes(member?.role)) {
    const [myBookings, coachedClasses] = await Promise.all([
      prisma.bookings.findMany({
        where: {
          studio_members: { email: userEmail },
          classes: { starts_at: { gte: new Date() } },
        },
        include: {
          classes: {
            include: {
              bookings: {
                include: { studio_members: true },
              },
            },
          },
          organizations: true,
        },
        orderBy: { classes: { starts_at: "asc" } },
      }),
      member?.role === "coach"
        ? prisma.classes.findMany({
            where: {
              coach_id: member.id,
              starts_at: { gte: new Date() },
              is_cancelled: false,
            },
            include: {
              organizations: true,
              bookings: {
                include: { studio_members: true },
              },
            },
            orderBy: { starts_at: "asc" },
          })
        : Promise.resolve([]),
    ]);
    dashboardData = { myBookings, coachedClasses };
  } else if (member) {
    // Dashboard pour le staff (owner, admin, coach)
    if (!member.organizations.onboarding_completed) {
      redirect("/onboarding");
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [
      activeMembersCount,
      classesThisWeekCount,
      totalBookingsCount,
      upcomingStaffClasses,
    ] = await Promise.all([
      prisma.studio_members.count({
        where: { organization_id: member.organization_id, is_active: true },
      }),
      prisma.classes.count({
        where: {
          organization_id: member.organization_id,
          starts_at: { gte: weekStart, lte: weekEnd },
          is_cancelled: false,
        },
      }),
      prisma.bookings.count({
        where: { organization_id: member.organization_id },
      }),
      prisma.classes.findMany({
        where: {
          organization_id: member.organization_id,
          ...(member.role === "coach" ? { coach_id: member.id } : {}),
          starts_at: { gte: now },
        },
        include: { org_members: true },
        orderBy: { starts_at: "asc" },
        take: 5,
      }),
    ]);
    dashboardData = {
      activeMembersCount,
      classesThisWeekCount,
      totalBookingsCount,
      upcomingStaffClasses,
    };
  }

  const isOwner = member?.role === "owner";
  const org = member?.organizations;
  const isTrialing = org?.subscription_status === "trialing";
  const trialEndsAt = org?.trial_ends_at;

  const getTimeRemaining = (endTime: Date) => {
    const total = endTime.getTime() - new Date().getTime();
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    return { days, hours, total };
  };

  const trialInfo = trialEndsAt ? getTimeRemaining(new Date(trialEndsAt)) : null;

  return (
    <div className="space-y-10">
      {/* 1. SECTION INVITATIONS */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BellRing className="size-4 text-primary" />
            Invitations en attente ({invitations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map((inv) => (
              <Card
                key={inv.id}
                className="border border-gray-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-primary/80 uppercase tracking-wider">
                        Nouvelle invitation
                      </p>
                      <h4 className="text-lg font-bold text-gray-900">
                        {inv.organizations.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Vous êtes invité(e) en tant que{" "}
                        <span className="font-semibold text-gray-700 capitalize">
                          {inv.role}
                        </span>
                        .
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <form
                        action={async () => {
                          "use server";
                          await respondToInvitationAction(inv.id, true);
                        }}
                      >
                        <Button
                          type="submit"
                          className="w-full h-9 px-4 rounded-lg font-medium text-sm bg-primary text-white hover:bg-primary/90 transition-colors"
                        >
                          Accepter
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await respondToInvitationAction(inv.id, false);
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          className="w-full h-9 px-4 rounded-lg font-medium text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Refuser
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 2. SECTION CONTENU PRINCIPAL (selon rôle) */}
      {["member", "coach"].includes(member?.role) ? (
        <div className="space-y-8">
          {/* Coaching section for coaches */}
          {member?.role === "coach" &&
            (dashboardData.coachedClasses?.length || 0) > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  Mes séances à coacher
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.coachedClasses?.map((cls) => (
                    <Card
                      key={cls.id}
                      className="overflow-hidden border border-gray-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="h-1 w-full bg-orange-400" />
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-orange-500/80 uppercase tracking-wider">
                              {cls.organizations?.name}
                            </p>
                            <h4 className="text-lg font-bold text-gray-900 leading-tight">
                              {cls.title}
                            </h4>
                          </div>
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                            Coach
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-500">
                              Participants ({cls.bookings?.length || 0})
                            </p>
                          </div>
                          <div className="flex -space-x-2 overflow-hidden">
                            {cls.bookings?.slice(0, 6).map((b) => (
                              <div
                                key={b.id}
                                className="size-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shrink-0 font-semibold text-xs text-gray-600 uppercase"
                              >
                                {b.studio_members?.avatar_url ? (
                                  <img
                                    src={b.studio_members?.avatar_url}
                                    alt=""
                                    className="size-full rounded-full object-cover"
                                  />
                                ) : (
                                  b.studio_members?.full_name.charAt(0)
                                )}
                              </div>
                            ))}
                            {(cls.bookings?.length || 0) > 6 && (
                              <div className="size-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center font-medium text-xs text-gray-500">
                                +{(cls.bookings?.length || 0) - 6}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <Link
                            href={`/dashboard/classes/${cls.id}`}
                            className="w-full h-9 flex items-center justify-center rounded-lg font-medium text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Gérer ma séance
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Mes prochaines séances
            </h3>

            {(dashboardData.myBookings?.length || 0) === 0 ? (
              <Card className="border border-gray-100 bg-gray-50/50 rounded-2xl shadow-sm">
                <CardContent className="py-16 text-center text-gray-500">
                  <p className="text-base font-medium">
                    Aucune réservation pour le moment.
                  </p>
                  <p className="text-sm mt-1">
                    Vos futures séances s'afficheront ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.myBookings?.map((booking) => (
                  <Card
                    key={booking.id}
                    className="overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl"
                  >
                    <div
                      className="h-1 w-full"
                      style={{
                        backgroundColor:
                          booking.organizations?.color_primary || "#4f46e5",
                      }}
                    />
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {booking.organizations?.name}
                          </p>
                          <h4 className="text-lg font-bold text-gray-900 leading-tight">
                            {booking.classes?.title}
                          </h4>
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-semibold border",
                            booking.status === "confirmed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200",
                          )}
                        >
                          {booking.status === "confirmed"
                            ? "Confirmé"
                            : "Attente"}
                        </span>
                      </div>

                      <div className="space-y-3 py-4 border-y border-gray-100">
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                          <Calendar className="size-4 text-gray-400" />
                          {new Date(
                            booking.classes?.starts_at || "",
                          ).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                          <Clock className="size-4 text-gray-400" />
                          {new Date(
                            booking.classes?.starts_at || "",
                          ).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">
                            Participants
                          </span>
                          <div className="flex -space-x-2 overflow-hidden">
                            {booking.classes?.bookings?.slice(0, 5).map((b) => (
                              <div
                                key={b.id}
                                className="size-7 rounded-full border-2 border-white bg-gray-100 shadow-sm flex items-center justify-center shrink-0 font-medium text-[10px] text-gray-600 uppercase"
                              >
                                {b.studio_members?.avatar_url ? (
                                  <img
                                    src={b.studio_members?.avatar_url}
                                    alt=""
                                    className="size-full rounded-full object-cover"
                                  />
                                ) : (
                                  b.studio_members?.full_name.charAt(0)
                                )}
                              </div>
                            ))}
                            {(booking.classes?.bookings?.length || 0) > 5 && (
                              <div className="size-7 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center font-medium text-[10px] text-gray-500">
                                +{(booking.classes?.bookings?.length || 0) - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 flex gap-3">
                        <Link
                          href={`/${booking.organizations?.slug}/book/${booking.classes?.id}`}
                          className="flex-1 h-9 flex items-center justify-center rounded-lg font-medium text-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                        >
                          Détails
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await memberSelfCancelBookingAction(booking.id);
                          }}
                        >
                          <Button
                            type="submit"
                            variant="outline"
                            className="h-9 px-4 rounded-lg font-medium text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            Annuler
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : member ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: "Membres actifs",
                value: dashboardData.activeMembersCount,
                icon: "👥",
                color: "text-blue-600 bg-blue-50",
              },
              {
                label: "Cours cette semaine",
                value: dashboardData.classesThisWeekCount,
                icon: "🗓️",
                color: "text-purple-600 bg-purple-50",
              },
              {
                label: "Réservations totales",
                value: dashboardData.totalBookingsCount,
                icon: "🎟️",
                color: "text-orange-600 bg-orange-50",
              },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="border border-gray-200 bg-white rounded-2xl shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "size-12 rounded-xl flex items-center justify-center text-xl shrink-0",
                        stat.color,
                      )}
                    >
                      {stat.icon}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-gray-500 mb-1">
                        {stat.label}
                      </CardTitle>
                      <div className="text-3xl font-bold text-gray-900 leading-none">
                        {stat.value}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {["owner", "admin"].includes(member.role)
                  ? "Prochaines séances du studio"
                  : "Mes prochaines séances"}
              </h3>
              <Link href="/dashboard/classes">
                <Button
                  variant="link"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Voir tout le planning &rarr;
                </Button>
              </Link>
            </div>

            {(dashboardData.upcomingStaffClasses?.length || 0) === 0 ? (
              <Card className="border border-gray-100 bg-gray-50/50 rounded-2xl shadow-sm">
                <CardContent className="py-12 text-center text-gray-500 text-sm">
                  Aucun cours prévu prochainement.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {dashboardData.upcomingStaffClasses?.map((cls) => (
                  <Card
                    key={cls.id}
                    className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                              {new Date(cls.starts_at).toLocaleDateString(
                                "fr-FR",
                                { month: "short" },
                              )}
                            </span>
                            <span className="text-lg font-bold text-gray-900 leading-none">
                              {new Date(cls.starts_at).getDate()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-semibold text-gray-900">
                              {cls.title}
                            </h4>
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                {new Date(cls.starts_at).toLocaleTimeString(
                                  "fr-FR",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              {cls.org_members && (
                                <span className="flex items-center gap-1.5">
                                  <div className="size-4 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                    {cls.org_members.avatar_url ? (
                                      <img
                                        src={cls.org_members.avatar_url}
                                        alt=""
                                        className="size-full object-cover"
                                      />
                                    ) : (
                                      <span className="flex items-center justify-center size-full text-[8px] text-gray-500">
                                        {cls.org_members.display_name?.charAt(
                                          0,
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {cls.org_members?.display_name}
                                </span>
                              )}
                              {cls.location && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="size-3.5" />
                                  {cls.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/classes/${cls.id}`}
                          className="w-full sm:w-auto h-9 px-4 flex items-center justify-center rounded-lg font-medium text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Gérer le cours
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : memberships.length === 0 && invitations.length > 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
          <BellRing className="size-12 text-primary animate-pulse" />
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-gray-900">
              Vous avez des invitations !
            </h2>
            <p className="text-sm text-gray-500">
              Acceptez une invitation ci-dessus pour accéder à votre dashboard.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
