"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface TrialBlockedWrapperProps {
  children: React.ReactNode;
  isOwner: boolean;
  isTrialExpired: boolean;
  isTrialing: boolean;
  isSubscriptionInactive: boolean;
  trialEndsAt: Date | string | null;
}

export function TrialBlockedWrapper({
  children,
  isOwner,
  isTrialExpired: initialIsTrialExpired,
  isTrialing,
  isSubscriptionInactive,
  trialEndsAt,
}: TrialBlockedWrapperProps) {
  const pathname = usePathname();
  const [isExpired, setIsExpired] = useState(initialIsTrialExpired);

  // Auto-expire in real-time
  useEffect(() => {
    if (!trialEndsAt || !isTrialing || isExpired) return;

    const endTime = new Date(trialEndsAt).getTime();
    
    const checkExpiration = () => {
      const now = new Date().getTime();
      if (now >= endTime) {
        setIsExpired(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkExpiration()) return;

    // Check every 30 seconds for safety
    const interval = setInterval(checkExpiration, 30000);
    
    // Set a precise timeout for the exact moment of expiration
    const timeUntilEnd = endTime - new Date().getTime();
    let timeout: NodeJS.Timeout;
    
    if (timeUntilEnd > 0 && timeUntilEnd < 2147483647) { // Max setTimeout delay
      timeout = setTimeout(() => {
        setIsExpired(true);
      }, timeUntilEnd);
    }

    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [trialEndsAt, isTrialing, isExpired]);

  const isBillingPage = pathname === "/dashboard/billing";

  // Block access if trial expired OR subscription is inactive (canceled, past_due, etc.)
  // Except for the billing page so they can resubscribe
  const isBlockedByTrial = isTrialing && isExpired;
  const isBlockedBySubscription = !isTrialing && isSubscriptionInactive;
  
  const showBlockedScreen = isOwner && (isBlockedByTrial || isBlockedBySubscription) && !isBillingPage;

  if (showBlockedScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-card/80 backdrop-blur-xl flex items-center justify-center p-6 ml-0 md:ml-64">
        <div className="max-w-xl w-full bg-card rounded-[3rem] p-12 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] border border-border/50 text-center relative overflow-hidden group animate-in fade-in zoom-in duration-700">
          {/* Subtle background flair */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-zinc-900/10 to-transparent" />
          
          <div className="relative z-10 space-y-8">
            <div className="size-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <LogOut className="size-8 text-primary-foreground rotate-180" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                {isBlockedByTrial ? "Votre période d'essai est terminée." : "Votre abonnement a expiré."}
              </h2>
              <p className="text-muted-foreground font-medium text-lg max-w-sm mx-auto leading-relaxed">
                {isBlockedByTrial 
                  ? "Votre période d'essai de 14 jours s'est achevée. Pour continuer à faire grandir votre communauté, activez votre accès complet."
                  : "Votre abonnement n'est plus actif. Pour continuer à gérer votre studio et accéder à vos données, veuillez régulariser votre situation."}
              </p>
            </div>

            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 text-left p-4 rounded-2xl bg-background border border-border/50">
                <div className="size-10 rounded-xl bg-card shadow-sm flex items-center justify-center shrink-0">
                  <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Données préservées</p>
                  <p className="text-xs text-muted-foreground font-medium">Vos plannings et membres sont en sécurité.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-4">
              <Button 
                asChild
                className="w-full bg-primary text-primary-foreground rounded-full h-16 text-lg font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/10"
              >
                <Link href="/dashboard/billing">
                  {isBlockedByTrial ? "Choisir mon forfait" : "Réactiver mon abonnement"}
                </Link>
              </Button>
              
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-muted-foreground font-medium italic">
                  Besoin d'aide ou d'un délai ?
                </p>
                <Link href="/contact" className="text-xs font-bold text-foreground hover:underline">
                  Contactez l'équipe Fitloww
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
