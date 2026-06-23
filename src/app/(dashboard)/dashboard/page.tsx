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
} from "@/app/actions/coaches";
import { memberSelfCancelBookingAction } from "@/app/actions/bookings";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import {
  BellRing,
  Calendar,
  Clock,
  MapPin,
  Zap,
  LogOut,
  Users,
  Ticket,
  CalendarDays,
} from "lucide-react";
import { cookies } from "next/headers";

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
  organizations: { name: string; slug: string; color_primary?: string | null; payment_link?: string | null; };
  classes: {
    id: string;
    title: string;
    starts_at: Date | string;
    price?: number | null;
    bookings: {
      id: string;
      studio_members: { avatar_url?: string | null; full_name: string };
    }[];
  };
}

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

  if (memberships.length === 0 && invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-card-foreground tracking-tight">Bienvenue sur Fitloww</h2>
          <p className="text-muted-foreground text-base max-w-sm mx-auto font-medium">Comment souhaitez-vous utiliser la plateforme ?</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Card className="border-2 border-dashed border-border hover:border-primary transition-colors group cursor-pointer overflow-hidden rounded-[2rem]">
            <CardContent className="p-8">
              <div className="h-full flex flex-col items-center text-center space-y-4">
                <div className="size-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Zap className="size-6 text-foreground/80 group-hover:text-primary-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-card-foreground">Créer mon studio</h3>
                  <p className="text-sm text-muted-foreground">Gérez votre planning et vos membres en quelques minutes.</p>
                </div>
                <Link href="/create-studio" className="w-full">
                  <Button className="w-full bg-primary text-primary-foreground rounded-xl h-11">C&apos;est parti</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <InviteJoiner />
        </div>
        <form action={signOutAction}>
          <button type="submit" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-2">
            <LogOut className="size-3" /> Se déconnecter
          </button>
        </form>
      </div>
    );
  }

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const staffMemberships = memberships.filter((m) => ["owner", "admin", "coach"].includes(m.role));
  
  let member = orgId
    ? memberships.find((m) => m.organization_id === orgId) || memberships[0]
    : staffMemberships[0] || memberships[0];

  if (!orgId && activeOrgId && staffMemberships.length > 0) {
    const activeStaffMembership = staffMemberships.find(m => m.organization_id === activeOrgId);
    if (activeStaffMembership) member = activeStaffMembership;
  }

  if (!member) return null;

  // INITIALISATION DES DONNÉES
  let dashboardData: {
    myBookings: DashboardBooking[];
    coachedClasses?: DashboardClass[];
    activeMembersCount?: number;
    classesThisWeekCount?: number;
    totalBookingsCount?: number;
    upcomingStaffClasses?: DashboardClass[];
  } = { myBookings: [] };

  // 1. TOUJOURS RÉCUPÉRER LES RÉSERVATIONS PERSONNELLES (POUR TOUS)
  dashboardData.myBookings = await prisma.bookings.findMany({
    where: {
      studio_members: { email: userEmail },
      status: { in: ['confirmed', 'pending_payment'] },
      classes: { starts_at: { gte: new Date() } },
    },
    include: {
      classes: {
        include: {
          bookings: {
            where: { status: "confirmed" },
            include: { studio_members: true },
          },
        },
      },
      organizations: true,
    },
    orderBy: { classes: { starts_at: "asc" } },
  });

  // 2. DONNÉES SPÉCIFIQUES STAFF OU MEMBRE
  if (["member", "coach"].includes(member?.role)) {
    if (member?.role === "coach") {
      dashboardData.coachedClasses = await prisma.classes.findMany({
        where: { coach_id: member.id, starts_at: { gte: new Date() }, is_cancelled: false },
        include: {
          organizations: true,
          bookings: { where: { status: "confirmed" }, include: { studio_members: true } },
        },
        orderBy: { starts_at: "asc" },
      });
    }
  } else if (member) {
    if (!member.organizations.onboarding_completed) redirect("/onboarding");
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [activeMembersCount, classesThisWeekCount, totalBookingsCount, upcomingStaffClasses] = await Promise.all([
      prisma.studio_members.count({ where: { organization_id: member.organization_id } }),
      prisma.classes.count({ where: { organization_id: member.organization_id, starts_at: { gte: weekStart, lte: weekEnd }, is_cancelled: false } }),
      prisma.bookings.count({ where: { organization_id: member.organization_id, status: "confirmed" } }),
      prisma.classes.findMany({
        where: { organization_id: member.organization_id, starts_at: { gte: now }, is_cancelled: false },
        include: {
          org_members: true,
          organizations: true,
          bookings: { where: { status: "confirmed" }, include: { studio_members: true } },
        },
        orderBy: { starts_at: "asc" },
        take: 5,
      }),
    ]);

    dashboardData = { ...dashboardData, activeMembersCount, classesThisWeekCount, totalBookingsCount, upcomingStaffClasses };
  }

  return (
    <div className="space-y-10">
      {/* SECTION INVITATIONS */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
            <BellRing className="size-4 text-primary" /> Invitations en attente ({invitations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map((inv) => (
              <Card key={inv.id} className="border border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-primary/80 uppercase tracking-wider">Nouvelle invitation</p>
                    <h4 className="text-lg font-bold text-card-foreground">{inv.organizations.name}</h4>
                    <p className="text-sm text-muted-foreground">Vous êtes invité(e) en tant que <span className="font-semibold text-foreground/90 capitalize">{inv.role}</span>.</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <form action={async () => { "use server"; await respondToInvitationAction(inv.id, true); }}>
                      <Button type="submit" className="w-full h-9 px-4 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Accepter</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SECTION MES PROCHAINES SÉANCES (VISIBLE PAR TOUS) */}
      {dashboardData.myBookings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Zap className="size-4 text-emerald-500 fill-emerald-500" /> Mes prochaines séances
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.myBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                <div className="h-1 w-full" style={{ backgroundColor: booking.organizations?.color_primary || "#4f46e5" }} />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{booking.organizations?.name}</p>
                      <h4 className="text-lg font-bold text-card-foreground leading-tight">{booking.classes?.title}</h4>
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", booking.status === "confirmed" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200")}>
                      {booking.status === "confirmed" ? "Confirmé" : "En attente"}
                    </span>
                  </div>
                  <div className="space-y-3 py-4 border-y border-border/50 text-sm font-medium text-foreground/80">
                    <div className="flex items-center gap-3"><Calendar className="size-4 text-muted-foreground" /> {new Date(booking.classes?.starts_at || "").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
                    <div className="flex items-center gap-3"><Clock className="size-4 text-muted-foreground" /> {new Date(booking.classes?.starts_at || "").toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    {booking.status === 'pending_payment' && booking.organizations.payment_link && (
                      <a href={booking.organizations.payment_link} target="_blank" rel="noopener noreferrer" className="flex-1 h-9 flex items-center justify-center rounded-lg font-bold text-[10px] uppercase tracking-widest bg-emerald-600 text-primary-foreground hover:bg-emerald-700 transition-colors text-center px-2 leading-tight">
                        Payer {booking.classes.price ? `${booking.classes.price}€` : ''} (si non fait)
                      </a>
                    )}
                    <div className="flex-1 flex gap-2">
                      <Link href={`/${booking.organizations?.slug}/book/${booking.classes?.id}`} className="flex-1 h-9 flex items-center justify-center rounded-lg font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        Détails
                      </Link>
                      <div className="flex-1">
                        <CancelBookingButton bookingId={booking.id} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SECTION DASHBOARD SPÉCIFIQUE */}
      {["member", "coach"].includes(member?.role) ? (
        <div className="space-y-8">
          {member?.role === "coach" && (dashboardData.coachedClasses?.length || 0) > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">Mes séances à coacher</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.coachedClasses?.map((cls) => (
                  <Card key={cls.id} className="overflow-hidden border border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="h-1 w-full bg-orange-400" />
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-orange-500/80 uppercase tracking-wider">{cls.organizations?.name}</p>
                          <h4 className="text-lg font-bold text-card-foreground leading-tight">{cls.title}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">Coach</span>
                      </div>
                      <Link href={`/dashboard/classes/${cls.id}`} className="mt-6 w-full h-9 flex items-center justify-center rounded-lg font-bold text-[10px] uppercase tracking-widest border border-border text-foreground/90 hover:bg-muted hover:text-foreground transition-colors">Gérer ma séance</Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {dashboardData.myBookings.length === 0 && (
            <div className="space-y-4 text-center py-20 bg-background/50 rounded-[2rem] border border-dashed border-border">
               <Calendar className="size-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-lg font-bold text-card-foreground">Aucune séance réservée</h3>
               <p className="text-muted-foreground max-w-xs mx-auto mb-6">Vos futures réservations apparaîtront ici dès que vous aurez choisi un cours.</p>
               {member?.organizations?.slug && (
                 <Link href={`/${member.organizations.slug}`}>
                   <Button className="bg-primary text-primary-foreground font-bold rounded-xl h-11 px-8 uppercase tracking-widest text-xs">Réserver un cours</Button>
                 </Link>
               )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-zinc-200">
              <div className="p-4 sm:p-8 flex flex-col items-center sm:items-start text-center sm:text-left">
                <p className="text-[11px] sm:text-sm font-medium text-zinc-500 flex items-center gap-2 mb-1.5 sm:mb-3">
                  <Users className="hidden sm:block w-4 h-4 text-zinc-400" />
                  <span className="hidden sm:inline">Membres actifs</span>
                  <span className="sm:hidden">Membres</span>
                </p>
                <h4 className="text-2xl sm:text-4xl font-semibold text-zinc-900 tracking-tight leading-none">{dashboardData.activeMembersCount || 0}</h4>
              </div>
              
              <div className="p-4 sm:p-8 flex flex-col items-center sm:items-start text-center sm:text-left">
                <p className="text-[11px] sm:text-sm font-medium text-zinc-500 flex items-center gap-2 mb-1.5 sm:mb-3">
                  <CalendarDays className="hidden sm:block w-4 h-4 text-zinc-400" />
                  <span className="hidden sm:inline">Cours de la semaine</span>
                  <span className="sm:hidden">Cours</span>
                </p>
                <h4 className="text-2xl sm:text-4xl font-semibold text-zinc-900 tracking-tight leading-none">{dashboardData.classesThisWeekCount || 0}</h4>
              </div>

              <div className="p-4 sm:p-8 flex flex-col items-center sm:items-start text-center sm:text-left">
                <p className="text-[11px] sm:text-sm font-medium text-zinc-500 flex items-center gap-2 mb-1.5 sm:mb-3">
                  <Ticket className="hidden sm:block w-4 h-4 text-zinc-400" />
                  <span className="hidden sm:inline">Réservations</span>
                  <span className="sm:hidden">Réserv.</span>
                </p>
                <h4 className="text-2xl sm:text-4xl font-semibold text-zinc-900 tracking-tight leading-none">{dashboardData.totalBookingsCount || 0}</h4>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between mb-5 sm:mb-6 px-1">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">Prochaines séances</h3>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 sm:mt-1">Aperçu de vos cours à venir.</p>
              </div>
              <Link href="/dashboard/classes" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors shrink-0 mb-0.5 sm:mb-0 ml-2">
                <span className="hidden sm:inline">Gérer le</span> planning <span aria-hidden="true" className="ml-1">&rarr;</span>
              </Link>
            </div>
            
            <div className="flex flex-col gap-3">
              {(dashboardData.upcomingStaffClasses?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white border border-zinc-200 border-dashed rounded-2xl">
                  <CalendarDays className="w-8 h-8 text-zinc-300 mb-3" />
                  <p className="text-sm font-medium text-zinc-500">Aucune séance prévue prochainement.</p>
                </div>
              ) : (
                dashboardData.upcomingStaffClasses?.map((cls) => (
                  <div key={cls.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-5">
                      <div className="flex flex-col justify-center items-center w-14 h-14 rounded-xl bg-zinc-50 border border-zinc-100 shrink-0 text-center">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(cls.starts_at).toLocaleDateString("fr-FR", { month: "short" }).replace('.', '')}</span>
                        <span className="text-lg font-bold text-zinc-900 leading-none mt-0.5">{new Date(cls.starts_at).getDate()}</span>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors">{cls.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {new Date(cls.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {cls.location && (
                            <>
                              <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-300"></span>
                              <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500">
                                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                                {cls.location}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 shrink-0">
                      <Link href={`/dashboard/classes/${cls.id}`} className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
                        Gérer la séance
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
