import Link from "next/link";

export default function PrivacyPage() {
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
            Politique de confidentialité
          </h1>
          <p className="text-muted-foreground text-lg">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="space-y-12 prose prose-slate max-w-none">
          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">1. Collecte des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous collectons les informations que vous nous fournissez directement, telles que votre nom, adresse e-mail, informations de paiement et les données relatives à la gestion de votre studio (plannings, clients, etc.) nécessaires au fonctionnement du service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">2. Utilisation des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les données collectées sont utilisées exclusivement pour fournir, maintenir et améliorer nos services, traiter vos transactions, et communiquer avec vous concernant votre compte ou nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">3. Protection des données (RGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, d'effacement, et de portabilité de vos données. Fitloww agit en tant que sous-traitant pour les données de vos propres clients.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">4. Partage des informations</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous ne vendons, n'échangeons ni ne transférons vos informations personnelles identifiables à des tiers sans votre consentement, à l'exception des tiers de confiance qui nous aident à exploiter notre site web ou à mener nos affaires (ex: Stripe pour les paiements).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">5. Sécurité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous mettons en œuvre diverses mesures de sécurité pour préserver la sécurité de vos informations personnelles. Le cryptage de pointe (SSL/TLS) est utilisé pour protéger les informations sensibles transmises en ligne.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-medium text-foreground mb-4">6. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos sites utilisent des cookies essentiels pour maintenir votre session de connexion et des cookies analytiques anonymisés pour comprendre l'utilisation de la plateforme. Vous pouvez configurer votre navigateur pour refuser les cookies.
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
