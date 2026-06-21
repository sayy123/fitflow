"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  User,
  Zap,
  Activity,
  Building2,
  PlusCircle,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
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
  
  // Calculate remaining days
  const msLeft = trialEndsAt ? new Date(trialEndsAt).getTime() - new Date().getTime() : 0;
  const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((msLeft / (1000 * 60 * 60)) % 24));

  const navItems = [
    { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
    { name: "Planning", href: "/dashboard/classes", icon: Calendar },
    { name: "Nous contacter", href: "/contact", icon: HelpCircle },
  ];

  const staffItems = [
    { name: "Coachs", href: "/dashboard/coaches", icon: Users },
    { name: "Membres", href: "/dashboard/members", icon: Users },
  ];

  if (isOwner && plan === 'premium') {
    staffItems.push({ name: "Mes Salles", href: "/dashboard/studios", icon: Building2 });
  }

  staffItems.push({ name: "Paramètres", href: "/dashboard/settings", icon: Settings });

  const isStaff = ["owner", "admin"].includes(role);
  const showOrgName = ["owner", "admin", "coach"].includes(role);

  return (
    <>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsOpen(true)}
          className="size-10 bg-card border border-border rounded-xl flex items-center justify-center shadow-sm"
        >
          <Menu className="size-5 text-foreground/80" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-[70] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "bg-background/50 border-r border-border/50 flex flex-col h-screen sticky top-0 backdrop-blur-xl transition-all duration-300 z-[80]",
        "fixed lg:sticky",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 w-64",
        "lg:flex"
      )}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 size-8 bg-muted rounded-lg flex items-center justify-center"
        >
          <X className="size-4 text-muted-foreground" />
        </button>

        <div className="p-8 pb-4">
          {showOrgName ? (
            <div className="space-y-3">
              <h1 className="text-lg font-semibold text-foreground tracking-tight leading-none">
                {organizationName}
              </h1>
              {isOwner && (
                <Link href="/dashboard/billing" className="inline-block group/badge">
                  <div className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all group-hover/badge:scale-105 active:group-hover/badge:scale-95",
                    plan === 'premium' 
                      ? "bg-zinc-900 text-white border-zinc-800 shadow-sm group-hover/badge:bg-zinc-800" 
                      : "bg-card text-foreground/80 border-border group-hover/badge:border-zinc-300"
                  )}>
                    {isTrialing 
                      ? '🎁 Essai' 
                      : plan === 'premium' 
                        ? '✨ Premium' 
                        : '🌱 Starter'}
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <div className="size-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-900/10 mb-2">
              <Activity className="size-5 text-white" />
            </div>
          )}
          <p className="text-[11px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">
            Fitloww
          </p>
        </div>

        {/* Trial Countdown for Owners */}
        {isOwner && isTrialing && (
          <div className="px-6 mb-2">
            <div className="bg-zinc-900 rounded-xl p-3 shadow-sm ring-1 ring-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="size-3 text-emerald-400 fill-emerald-400" />
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">Essai gratuit</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight mb-2">
                Il vous reste <span className="text-white font-bold">
                  {daysLeft > 0 ? `${daysLeft} jours` : `${hoursLeft} heures`}
                </span> pour tester Fitloww.
              </p>
              <Link href="/dashboard/billing">
                <button className="w-full h-7 rounded-lg bg-card text-foreground text-[10px] font-bold hover:bg-muted transition-colors">
                  S'abonner
                </button>
              </Link>
            </div>
          </div>
        )}

        <nav className="px-4 py-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors group",
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-foreground/80 hover:bg-zinc-200/50 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-foreground/80",
                  )}
                />
                {item.name}
              </Link>
            );
          })}

          {isStaff && (
            <div className="pt-8 space-y-1">
              <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
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
                      "flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors group",
                      isActive
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-foreground/80 hover:bg-zinc-200/50 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground/80",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Show Join Studio for everyone except the owner */}
          {(role !== "owner" || !organizationName) && (
            <div className="pt-8 px-3 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Rejoindre un studio
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Lien d'invitation..."
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-border bg-card text-[11px] font-medium focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                />
                <button
                  onClick={handleJoin}
                  disabled={!inviteLink.trim().includes("http")}
                  className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-muted text-foreground/80 text-[11px] font-bold hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-muted disabled:hover:text-foreground/80"
                >
                  <PlusCircle className="size-3.5" />
                  Rejoindre
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 space-y-2 border-t border-border/50">
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="size-8 rounded-full bg-card border border-border/50 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
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
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                {user.user_metadata?.full_name || "Utilisateur"}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground capitalize truncate mt-0.5">
                {role}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg text-muted-foreground hover:bg-zinc-200/50 hover:text-foreground transition-colors group"
            >
              <LogOut className="size-4 text-muted-foreground group-hover:text-foreground/80" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
