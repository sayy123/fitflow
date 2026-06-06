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
    <aside className="w-64 bg-zinc-50/50 border-r border-zinc-200/50 flex flex-col h-screen sticky top-0 backdrop-blur-xl">
      <div className="p-8 pb-4">
        {showOrgName ? (
          <div className="space-y-3">
            <h1 className="text-lg font-semibold text-zinc-900 tracking-tight leading-none">
              {organizationName}
            </h1>
            {isOwner && (
              <Link href="/dashboard/billing" className="inline-block group/badge">
                <div className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all group-hover/badge:scale-105 active:group-hover/badge:scale-95",
                  plan === 'premium' 
                    ? "bg-zinc-900 text-white border-zinc-800 shadow-sm group-hover/badge:bg-zinc-800" 
                    : "bg-white text-zinc-600 border-zinc-200 group-hover/badge:border-zinc-300"
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
        <p className="text-[11px] font-medium text-zinc-500 mt-1.5 uppercase tracking-wider">
          Fitflow
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
            <p className="text-[11px] text-zinc-400 leading-tight mb-2">
              Il vous reste <span className="text-white font-bold">
                {daysLeft > 0 ? `${daysLeft} jours` : `${hoursLeft} heures`}
              </span> pour tester Fitflow.
            </p>
            <Link href="/dashboard/billing">
              <button className="w-full h-7 rounded-lg bg-white text-zinc-900 text-[10px] font-bold hover:bg-zinc-100 transition-colors">
                S'abonner
              </button>
            </Link>
          </div>
        </div>
      )}

      <nav className="px-4 py-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors group",
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900",
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  isActive
                    ? "text-white"
                    : "text-zinc-400 group-hover:text-zinc-600",
                )}
              />
              {item.name}
            </Link>
          );
        })}

        {isStaff && (
          <div className="pt-8 space-y-1">
            <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Administration
            </p>
            {staffItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors group",
                    isActive
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      isActive
                        ? "text-white"
                        : "text-zinc-400 group-hover:text-zinc-600",
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Only show Join Studio for regular members or empty state */}
        {(role === "member" || !organizationName) && (
          <div className="pt-8 px-3 space-y-3">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
              Rejoindre un studio
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Lien d'invitation..."
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                className="w-full h-8 px-3 rounded-lg border border-zinc-200 bg-white text-[11px] font-medium focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
              />
              <button
                onClick={handleJoin}
                disabled={!inviteLink.trim().includes("http")}
                className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-zinc-100 text-zinc-600 text-[11px] font-bold hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-zinc-100 disabled:hover:text-zinc-600"
              >
                <PlusCircle className="size-3.5" />
                Rejoindre
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 space-y-2">
        <div className="px-3 py-2 flex items-center gap-3">
          <div className="size-8 rounded-full bg-white border border-zinc-200/50 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="size-full object-cover"
              />
            ) : (
              <User className="size-4 text-zinc-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-zinc-900 truncate leading-tight">
              {user.user_metadata?.full_name || "Utilisateur"}
            </p>
            <p className="text-[11px] font-medium text-zinc-500 capitalize truncate mt-0.5">
              {role}
            </p>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 transition-colors group"
          >
            <LogOut className="size-4 text-zinc-400 group-hover:text-zinc-600" />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
