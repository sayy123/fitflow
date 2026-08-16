import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckIcon, MinusIcon } from "@heroicons/react/24/outline";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 bg-background/95 backdrop-blur-sm z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="font-heading font-semibold text-2xl tracking-tight flex items-center gap-3">
              <img src="/logo_pulse_outline_favicon.png" alt="Fitloww" className="h-8 w-8" />
              Fitloww
            </div>
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/pricing"
              className="text-sm font-medium text-foreground transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Connexion
            </Link>
            <Link href="/register?role=manager">
              <Button className="bg-foreground text-background rounded-lg px-6 h-10 text-sm font-medium hover:bg-foreground/90 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                Démarrer
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider mb-8">
            14 jours d'essai gratuit
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-medium tracking-tight text-foreground mb-6 leading-[1.1]">
            Des tarifs simples.<br />
            Sans surprise.
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Testez la plateforme gratuitement. Vous ne payez que si l'outil devient indispensable.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-background rounded-xl p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border flex flex-col relative">
            <div className="mb-8">
              <h3 className="text-2xl font-heading font-medium text-foreground mb-2">Starter</h3>
              <p className="text-muted-foreground text-sm font-light">Pour les indépendants et petits espaces qui se structurent.</p>
            </div>
            
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-heading font-medium tracking-tight text-foreground">19€</span>
              <span className="text-muted-foreground text-sm">/ mois</span>
            </div>

            <Link href="/register?role=manager&plan=starter" className="mb-10 w-full">
              <Button variant="outline" className="w-full rounded-lg h-12 text-sm font-medium border-border text-foreground hover:bg-secondary transition-colors">
                Commencer l'essai
              </Button>
            </Link>

            <div className="space-y-4 flex-1 border-t border-border pt-8">
              <p className="text-xs font-medium text-foreground uppercase tracking-widest mb-6">Inclus :</p>
              {[
                "1 salle gérée",
                "Jusqu'à 3 coachs",
                "Jusqu'à 40 membres actifs",
                "Réservations illimitées",
                "Emails automatiques"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <CheckIcon className="size-4 text-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
              
              <div className="pt-4 space-y-4 mt-4 opacity-40">
                {[
                  "Multi-salles",
                  "Membres illimités",
                  "Rapports avancés"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <MinusIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-foreground text-background rounded-xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col relative">
            <div className="absolute top-8 right-8">
              <div className="inline-flex items-center px-3 py-1 rounded-md bg-background/10 text-background text-[10px] font-semibold uppercase tracking-widest border border-background/20">
                Populaire
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-heading font-medium text-background mb-2">Premium</h3>
              <p className="text-background/70 text-sm font-light">L'outil sans limites pour les studios établis en croissance.</p>
            </div>
            
            <div className="mb-8 flex items-baseline gap-2 relative z-10">
              <span className="text-5xl font-heading font-medium tracking-tight text-background">39€</span>
              <span className="text-background/70 text-sm">/ mois</span>
            </div>

            <Link href="/register?role=manager&plan=premium" className="mb-10 w-full relative z-10">
              <Button className="w-full bg-background text-foreground rounded-lg h-12 text-sm font-medium hover:bg-secondary hover:text-foreground transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                S'abonner
              </Button>
            </Link>

            <div className="space-y-4 flex-1 relative z-10 border-t border-background/20 pt-8">
              <p className="text-xs font-medium text-background/90 uppercase tracking-widest mb-6">Tout du Starter, plus :</p>
              {[
                "Jusqu'à 3 salles gérées",
                "Membres illimités",
                "Coachs illimités",
                "Page de réservation sur-mesure",
                "Rapports mensuels"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <CheckIcon className="size-4 text-background shrink-0 mt-0.5" />
                  <span className="text-background/80 text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-32 max-w-3xl mx-auto text-center border-t border-border pt-24">
          <h2 className="text-3xl font-heading font-medium tracking-tight text-foreground mb-6">
            Besoin d'une offre sur-mesure ?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 font-light max-w-xl mx-auto">
            Contactez notre équipe si vous gérez une franchise ou plus de 3 studios pour discuter de vos besoins spécifiques.
          </p>
          <Link href="/contact">
            <Button variant="outline" className="rounded-lg px-8 h-12 text-sm font-medium border-border text-foreground hover:bg-secondary transition-colors">
              Nous contacter
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-3 font-heading font-semibold text-2xl text-foreground tracking-tight">
              <img src="/logo_pulse_outline_favicon.png" alt="Fitloww" className="h-8 w-8" />
              Fitloww
            </div>
            <p className="text-muted-foreground text-sm font-light">Le système d'exploitation des studios modernes.</p>
          </div>
          <div className="flex gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Conditions (TOS)</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          </div>
          <p className="text-sm font-light text-muted-foreground">
            © 2026 Fitloww. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
