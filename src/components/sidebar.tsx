"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Squares2X2Icon as LayoutDashboard,
  CalendarIcon as Calendar,
  UsersIcon as Users,
  Cog6ToothIcon as Settings,
  ArrowRightOnRectangleIcon as LogOut,
  UserIcon as User,
  BoltIcon as Zap,
  BuildingOffice2Icon as Building2,
  PlusCircleIcon as PlusCircle,
  QuestionMarkCircleIcon as HelpCircle,
  Bars3Icon as Menu,
  XMarkIcon as X,
} from "@heroicons/react/24/outline";
import { signOutAction } from "@/app/actions/auth";

interface SidebarProps {
  organizationName: string;
  role: string;
  user: {
    user_metadata?: {
      full_name?: string;
    };
  };
  avatarUrl?: string | null;
  trialEndsAt?: Date | string | null;
  subscriptionStatus?: string | null;
  plan?: string | null;
}

export function Sidebar({
  organizationName,
  role,
  user,
  avatarUrl,
  trialEndsAt,
  subscriptionStatus,
  plan,
}: SidebarProps) {
  const pathname = usePathname();
  const [inviteLink, setInviteLink] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleJoin = () => {
    if (inviteLink.trim().includes("http")) {
      window.location.href = inviteLink.trim();
    }
  };

  const isOwner = role === "owner";
  const isTrialing = subscriptionStatus === "trialing";
  
  const msLeft = trialEndsAt ? new Date(trialEndsAt).getTime() - new Date().getTime() : 0;
  const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((msLeft / (1000 * 60 * 60)) % 24));

  const navItems = [
    { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
    { name: "Planning", href: "/dashboard/classes", icon: Calendar },
    { name: "Nous contacter", href: "/contact", icon: HelpCircle },
  ];

  const isStaff = ["owner", "admin"].includes(role);
  const staffItems = [
    { name: "Coachs", href: "/dashboard/coaches", icon: Users },
    { name: "Membres", href: "/dashboard/members", icon: Users },
  ];

  if (isOwner && plan === 'premium') {
    staffItems.push({ name: "Mes Salles", href: "/dashboard/studios", icon: Building2 });
  }

  if (isStaff) {
    staffItems.push({ name: "Abonnements", href: "/dashboard/passes", icon: Zap });
  }

  staffItems.push({ name: "Paramètres", href: "/dashboard/settings", icon: Settings });

  const showOrgName = ["owner", "admin", "coach"].includes(role);

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsOpen(true)}
          className="size-10 bg-background border border-border rounded-lg flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <Menu className="size-5 text-foreground/80" />
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-[70] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "bg-background border-r border-border flex flex-col h-[100dvh] sticky top-0 transition-all duration-300 z-[80]",
        "fixed lg:sticky",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 w-64",
        "lg:flex"
      )}>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 size-8 bg-secondary rounded-lg flex items-center justify-center"
        >
          <X className="size-4 text-muted-foreground" />
        </button>

        <div className="p-6 pb-2">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo_pulse_outline_favicon.png" alt="Fitloww" className="h-8 w-8" />
            <span className="font-heading font-semibold text-xl tracking-tight text-foreground">Fitloww</span>
          </div>
          {showOrgName ? (
            <div className="space-y-3">
              <h1 className="text-sm font-medium text-foreground tracking-tight leading-none">
                {organizationName}
              </h1>
              {isOwner && (
                <Link href="/dashboard/billing" className="inline-block">
                  <div className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest border transition-colors",
                    plan === 'premium' 
                      ? "bg-foreground text-background border-foreground hover:bg-foreground/90" 
                      : "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground/30"
                  )}>
                    {isTrialing 
                      ? 'Essai' 
                      : plan === 'premium' 
                        ? 'Premium' 
                        : plan === 'none'
                          ? 'Expiré'
                          : 'Starter'}
                  </div>
                </Link>
              )}
            </div>
          ) : null}
        </div>

        {isOwner && isTrialing && (
          <div className="px-5 mt-4 mb-2">
            <div className="bg-foreground rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="size-3.5 text-background" />
                <p className="text-[10px] font-semibold text-background uppercase tracking-widest">Essai gratuit</p>
              </div>
              <p className="text-xs text-background/80 leading-tight mb-4">
                Il vous reste <span className="text-background font-medium">
                  {daysLeft > 0 ? `${daysLeft} jours` : `${hoursLeft} heures`}
                </span>.
              </p>
              <Link href="/dashboard/billing">
                <button className="w-full h-8 rounded-lg bg-background text-foreground text-xs font-medium hover:bg-secondary transition-colors">
                  S'abonner
                </button>
              </Link>
            </div>
          </div>
        )}

        <nav className="px-4 py-6 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground/80",
                  )}
                />
                {item.name}
              </Link>
            );
          })}

          {isStaff && (
            <div className="pt-8 space-y-1">
              <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">
                Administration
              </p>
              {staffItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground/80",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          {(role !== "owner" || !organizationName) && (
            <div className="pt-8 px-3 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                Rejoindre un studio
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Lien d'invitation..."
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={handleJoin}
                  disabled={!inviteLink.trim().includes("http")}
                  className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:hover:bg-secondary"
                >
                  <PlusCircle className="size-3.5" />
                  Rejoindre
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 space-y-2 border-t border-border">
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="size-8 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate leading-tight">
                {user.user_metadata?.full_name || "Utilisateur"}
              </p>
              <p className="text-xs font-medium text-muted-foreground capitalize truncate mt-0.5">
                {role}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors group"
            >
              <LogOut className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground/80" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
