import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle2, Minus, Star } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-200 font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 bg-white/70 backdrop-blur-xl z-50 border-b border-zinc-200/50 supports-[backdrop-filter]:bg-white/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="font-bold text-lg tracking-tight flex items-center gap-2.5">
              <div className="size-7 bg-gradient-to-tr from-zinc-900 to-zinc-800 rounded-lg flex items-center justify-center shadow-sm shadow-zinc-900/20 ring-1 ring-zinc-900/5">
                <Activity className="size-4 text-white" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">Fitloww</span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm font-semibold text-zinc-900 transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Connexion
            </Link>
            <Link href="/register?role=manager">
              <Button className="bg-zinc-900 text-white rounded-full px-5 h-9 text-sm font-semibold hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/10 ring-1 ring-inset ring-zinc-900/10 hover:ring-zinc-900/20">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold mb-6 ring-1 ring-zinc-200/80 shadow-sm cursor-default">
            <span className="text-zinc-500">Starter : 14 jours d'essai gratuit. Sans carte bancaire.</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-zinc-900 mb-6 leading-[1.1]">
            Des tarifs simples.<br />
            Pour des studios ambitieux.
          </h1>
          <p className="text-lg text-zinc-500 font-medium">
            Testez le plan Starter gratuitement pendant 14 jours. Accédez à tous les outils de base pour lancer votre studio sereinement.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-zinc-200/60 flex flex-col relative">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Starter</h3>
              <p className="text-zinc-500 text-sm font-medium">Pour les coachs indépendants et les petits studios qui se lancent.</p>
            </div>
            
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-zinc-900">19€</span>
              <span className="text-zinc-500 font-medium">/ mois</span>
            </div>

            <Link href="/register?role=manager&plan=starter" className="mb-10 w-full">
              <Button variant="outline" className="w-full rounded-full h-14 text-base font-semibold border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                Commencer l'essai gratuit
              </Button>
            </Link>

            <div className="space-y-4 flex-1">
              <p className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4">Ce qui est inclus</p>
              {[
                "1 salle gérée",
                "Jusqu'à 3 coachs",
                "Jusqu'à 40 membres actifs",
                "Planning & réservations illimités",
                "Emails automatiques"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                  <span className="text-zinc-600 font-medium">{feature}</span>
                </div>
              ))}
              
              <div className="pt-4 space-y-4 border-t border-zinc-50 mt-4">
                {[
                  "Plusieurs salles",
                  "Membres illimités",
                  "Rapports avancés"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-30">
                    <Minus className="size-5 text-zinc-400 shrink-0" />
                    <span className="text-zinc-500 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 shadow-xl flex flex-col relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 size-[300px] bg-white/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-white/10 transition-colors duration-700" />
            
            <div className="absolute top-8 right-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
                Populaire
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <p className="text-zinc-400 text-sm font-medium">L'outil complet pour les studios établis en pleine croissance.</p>
            </div>
            
            <div className="mb-8 flex items-baseline gap-2 relative z-10">
              <span className="text-5xl font-bold tracking-tight text-white">39€</span>
              <span className="text-zinc-400 font-medium">/ mois</span>
            </div>

            <Link href="/register?role=manager&plan=premium" className="mb-10 w-full relative z-10">
              <Button className="w-full bg-white text-zinc-900 rounded-full h-14 text-base font-bold hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl ring-1 ring-inset ring-white/10">
                S'abonner maintenant
              </Button>
            </Link>

            <div className="space-y-4 flex-1 relative z-10">
              <p className="text-sm font-bold text-zinc-100 uppercase tracking-widest mb-4">Tout du Starter, plus :</p>
              {[
                "Jusqu'à 3 salles gérées",
                "Membres illimités",
                "Coachs illimités",
                "Page de réservation personnalisée",
                "Rapports mensuels de performance"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                  </div>
                  <span className="text-zinc-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-32 max-w-3xl mx-auto text-center border-t border-zinc-200/60 pt-20">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-6">
            Besoin de plus d'informations ?
          </h2>
          <p className="text-zinc-500 text-lg mb-10 font-medium">
            Contactez notre équipe de vente pour discuter d'une solution sur-mesure si vous gérez une franchise ou plus de 3 studios.
          </p>
          <Button variant="outline" className="rounded-full px-8 h-12 text-sm font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-50">
            Nous contacter
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 py-16 px-6 bg-white mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2.5 font-bold text-xl text-zinc-900 tracking-tight">
              <div className="size-6 bg-zinc-900 rounded-md flex items-center justify-center">
                  <Activity className="size-3 text-white" />
              </div>
              Fitloww
            </div>
            <p className="text-zinc-500 text-sm font-medium">L'outil de gestion ultime pour les studios de fitness.</p>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 transition-colors">Accueil</Link>
            <Link href="/pricing" className="hover:text-zinc-900 transition-colors">Tarifs</Link>
            <Link href="#" className="hover:text-zinc-900 transition-colors">Contact</Link>
          </div>
          <p className="text-sm font-medium text-zinc-400">
            © 2026 Fitloww. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
