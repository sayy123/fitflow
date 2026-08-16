import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 bg-background/95 backdrop-blur-sm z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="font-heading font-semibold text-2xl tracking-tight flex items-center gap-3">
              <img src="/logo_redesign_v2.png" alt="Fitloww" className="h-8 w-8" />
              Fitloww
            </div>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6 max-w-3xl mx-auto">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-6">
            Conditions d'utilisation
          </h1>
          <p className="text-muted-foreground text-lg">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="space-y-12 prose prose-slate max-w-none">
          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">1. Acceptation des conditions</h2>
            <p className="text-muted-foreground leading-relaxed">
              En accédant et en utilisant la plateforme Fitloww, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">2. Description du service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Fitloww fournit une solution logicielle en tant que service (SaaS) permettant aux gérants de studios de fitness, yoga et pilates de gérer leurs plannings, réservations et paiements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">3. Utilisation du compte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vous êtes responsable du maintien de la confidentialité de votre compte et de votre mot de passe, ainsi que de la restriction de l'accès à votre ordinateur ou appareil mobile. Vous acceptez la responsabilité de toutes les activités qui se produisent sous votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">4. Paiements et abonnements</h2>
            <p className="text-muted-foreground leading-relaxed">
              Certains services de Fitloww sont soumis à des frais d'abonnement. Tous les frais sont facturés à l'avance et ne sont pas remboursables, sauf disposition contraire requise par la loi. Fitloww se réserve le droit de modifier ses tarifs à tout moment avec un préavis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">5. Limitation de responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dans la mesure maximale permise par la loi applicable, Fitloww ne sera pas responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, ou de toute perte de profits ou de revenus.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">6. Modifications des conditions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer ces conditions à tout moment. Si une révision est importante, nous essaierons de fournir un préavis d'au moins 30 jours avant que les nouvelles conditions ne prennent effet.
            </p>
          </section>
        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="border-t border-border py-12 px-6 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-heading font-semibold text-xl text-foreground">
            Fitloww
          </div>
          <p className="text-sm font-light text-muted-foreground">
            © {new Date().getFullYear()} Fitloww. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
