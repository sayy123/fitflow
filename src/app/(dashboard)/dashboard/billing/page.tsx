import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BillingButton } from "./billing-button";
import { cookies } from "next/headers";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await prisma.org_members.findMany({
    where: {
      user_id: user.id,
      role: "owner",
    },
    include: { organizations: true },
  });

  if (memberships.length === 0) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;

  let membership = memberships[0];

  if (activeOrgId) {
    const activeMembership = memberships.find(m => m.organization_id === activeOrgId);
    if (activeMembership) {
      membership = activeMembership;
    }
  }

  if (!membership) {
    redirect("/dashboard");
  }

  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: user.id }
  });

  const plan = userProfile?.plan || "starter";
  const subscription_status = userProfile?.subscription_status || "trialing";

  const isTrialExpired =
    userProfile?.trial_ends_at && new Date() > new Date(userProfile.trial_ends_at);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 text-zinc-900">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-bold uppercase tracking-widest mb-4 ring-1 ring-zinc-200">
          Gestion de l'abonnement
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          {isTrialExpired
            ? "Votre essai gratuit a expiré"
            : "Propulsez votre studio"}
        </h1>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
          {isTrialExpired
            ? "Votre période d'essai de 14 jours est terminée. Choisissez un forfait pour continuer."
            : "Vous êtes actuellement en période d'essai gratuit. Profitez-en pour configurer votre studio."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-8">
        {/* Starter Plan */}
        <Card className="border border-zinc-200 bg-white rounded-3xl shadow-sm flex flex-col hover:border-zinc-300 transition-colors">
          <CardHeader className="pb-8">
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
                Starter
              </CardTitle>
              {plan === "starter" &&
                subscription_status === "active" && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-100">
                    Actuel
                  </span>
                )}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold">19€</span>
              <span className="text-zinc-500 font-medium">/ mois</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 flex-1">
            <div className="space-y-4">
              {[
                "1 salle gérée",
                "Jusqu'à 3 coachs",
                "Jusqu'à 40 membres actifs",
                "Planning & réservations illimités",
                "Emails automatiques",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  <span className="text-zinc-600 font-medium text-sm">{f}</span>
                </div>
              ))}
            </div>
            
            <BillingButton
              plan="starter"
              className="w-full h-12 rounded-xl font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              isCurrentPlan={plan === "starter" && subscription_status === "active"}
              disabled={plan === "premium"}
            >
              {plan === "starter" && subscription_status === "active"
                ? "Gérer mon abonnement"
                : plan === "premium" 
                  ? "Indisponible en Premium"
                  : "Activer Starter"}
            </BillingButton>

            {plan === "premium" && (
              <p className="text-[10px] text-zinc-400 text-center font-medium">
                Le passage au plan Starter n'est pas disponible pour les membres Premium.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="border border-zinc-900 bg-zinc-900 rounded-3xl shadow-xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 z-20">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
              Populaire
            </div>
          </div>
          <CardHeader className="pb-8 relative z-10 text-white">
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Premium
              </CardTitle>
              {plan === "premium" &&
                subscription_status === "active" && (
                  <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
                    Actuel
                  </span>
                )}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold">39€</span>
              <span className="text-zinc-500 font-medium text-zinc-400">
                / mois
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 flex-1 relative z-10">
            <div className="space-y-4 text-zinc-300">
              {[
                "Jusqu'à 3 salles gérées",
                "Membres illimités",
                "Coachs illimités",
                "Page brandée",
                "Rapports mensuels",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-emerald-400" />
                  <span className="font-medium text-sm">{f}</span>
                </div>
              ))}
            </div>
            
            <BillingButton
              plan="premium"
              className="w-full h-12 rounded-xl font-bold bg-white text-zinc-900 hover:bg-zinc-100"
              isCurrentPlan={plan === "premium" && subscription_status === "active"}
            >
              {plan === "premium" && subscription_status === "active"
                ? "Gérer mon abonnement"
                : "Activer Premium"}
            </BillingButton>
          </CardContent>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors duration-700" />
        </Card>
      </div>

      <div className="bg-zinc-100/50 rounded-2xl p-6 text-center border border-zinc-200/50">
        <p className="text-sm font-medium text-zinc-500 italic">
          Sécurisé par Stripe. Vous serez redirigé vers leur plateforme de paiement.
        </p>
      </div>

      {!isTrialExpired && (
        <div className="text-center pt-4">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors flex items-center justify-center gap-1 group"
          >
            Continuer l'essai gratuit pour le moment{" "}
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
