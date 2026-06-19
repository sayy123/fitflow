import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans p-8 md:p-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-8 -ml-4 text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="size-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Link>
        
        <h1 className="text-4xl font-bold tracking-tight mb-8">Mentions Légales</h1>
        
        <div className="space-y-8 text-zinc-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">1. Présentation du site</h2>
            <p>
              Le site <strong>Fitloww</strong> est une plateforme de gestion pour studios de fitness.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">2. Contact</h2>
            <p>
              Pour toute question, vous pouvez nous contacter à l'adresse suivante : <br />
              <strong>Email :</strong> fitflow887@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">3. Hébergement</h2>
            <p>
              Ce site est hébergé par Vercel Inc., situé au 340 S Lemon Ave #1192 Walnut, CA 91789.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">4. Propriété intellectuelle</h2>
            <p>
              Tous les contenus présents sur le site (textes, images, graphismes, logo, icônes) sont la propriété exclusive de Fitloww ou de leurs auteurs respectifs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">5. Données personnelles et RGPD</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données ("droit à l'oubli").<br/><br/>
              Les données collectées (nom, prénom, email, téléphone) sont strictement utilisées pour la gestion de vos réservations, de vos abonnements et de votre compte sur notre plateforme. Vous pouvez supprimer définitivement votre compte à tout moment depuis les paramètres de sécurité de votre espace personnel.<br/><br/>
              Pour toute demande relative à vos données, vous pouvez nous contacter à : <strong>fitflow887@gmail.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">6. Cookies</h2>
            <p>
              Notre site utilise des cookies strictement nécessaires à son fonctionnement (maintien de votre session, authentification sécurisée). Ces cookies techniques sont exemptés de consentement préalable. Nous n'utilisons aucun cookie publicitaire intrusif.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
