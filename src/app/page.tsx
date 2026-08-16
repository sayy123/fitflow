"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  ChartBarIcon,
  CalendarIcon,
  ChevronDownIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const interactiveFeatures = [
    {
      id: 0,
      title: "Planning synchronisé",
      desc: "Supervisez toutes vos séances sur une interface fluide. Vos équipes et membres sont toujours à jour.",
      icon: CalendarIcon,
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 1,
      title: "Transactions invisibles",
      desc: "Abonnements récurrents et paiements à l'acte intégrés directement dans le parcours client.",
      icon: CreditCardIcon,
      image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Expérience mobile native",
      desc: "Une réservation instantanée depuis n'importe quel appareil. Fini les allers-retours par message.",
      icon: DevicePhoneMobileIcon,
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  const faqs = [
    {
      q: "Combien de temps faut-il pour configurer la plateforme ?",
      a: "Quelques minutes suffisent. Vous pouvez structurer votre studio, ajouter vos collaborateurs et ouvrir les réservations le jour même.",
    },
    {
      q: "Mes clients doivent-ils télécharger une application ?",
      a: "Non. Vos membres accèdent à une interface web hautement optimisée pour mobile via un simple lien, sans friction d'installation.",
    },
    {
      q: "Puis-je gérer plusieurs établissements ?",
      a: "Oui. Notre architecture permet la gestion multi-salles depuis un compte administrateur unique.",
    },
    {
      q: "Prenez-vous une commission sur les réservations ?",
      a: "Non. Vous conservez l'intégralité de votre chiffre d'affaires, hors frais inhérents aux prestataires de paiement (ex: Stripe/Mollie).",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-200 bg-background/95 backdrop-blur-sm",
          scrolled ? "border-b border-border py-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]" : "py-6"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="font-heading font-semibold text-2xl tracking-tight flex items-center gap-3">
            <img src="/logo_redesign_v2.png" alt="Fitloww" className="h-8 w-8" />
            Fitloww
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-5">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Connexion
            </Link>
            <Link href="/register">
              <Button className="bg-foreground text-background rounded-lg px-6 h-10 text-sm font-medium hover:bg-foreground/90 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                Démarrer
              </Button>
            </Link>
          </div>
          
          {/* Mobile Nav Toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <XMarkIcon className="size-6 text-foreground" /> : <Bars3Icon className="size-6 text-foreground" />}
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-24 px-6 max-w-7xl mx-auto lg:pt-52 lg:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider mb-8">
              Système de gestion de studio
            </div>

            <h1 className="text-5xl md:text-7xl font-heading font-medium tracking-tight text-foreground mb-8 leading-[1.1]">
              L'infrastructure moderne <br className="hidden md:block" />
              pour votre studio.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Une solution de réservation unifiée pour le fitness, yoga et pilates. Centralisez vos plannings et paiements dans une interface épurée.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register?role=manager">
                <Button className="w-full sm:w-auto bg-primary text-primary-foreground rounded-lg px-8 h-12 text-base font-medium hover:bg-primary/90 transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center gap-2 group">
                  Ouvrir mon espace
                  <ArrowRightIcon className="size-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link href="/register?role=member">
                <Button variant="outline" className="w-full sm:w-auto rounded-lg px-8 h-12 text-base font-medium border-border text-foreground hover:bg-secondary transition-colors">
                  Accès client
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div className="mt-24 relative mx-auto max-w-5xl">
            <div className="rounded-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-border/50 bg-background">
              <img
                src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=2500&auto=format&fit=crop"
                alt="Interface Fitloww"
                className="w-full h-[600px] object-cover"
              />
            </div>
          </div>
        </section>

        {/* How it works (Replaced 3 cards with alternating layout) */}
        <section className="py-24 bg-secondary/50 border-y border-border/50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-20">
              <h2 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground mb-4">
                Une mise en place sans friction.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Oubliez les logiciels complexes. Nous avons réduit le processus à l'essentiel.
              </p>
            </div>

            <div className="space-y-16">
              {[
                {
                  step: "01",
                  title: "Configuration de l'espace",
                  desc: "Définissez les paramètres de votre studio, vos offres tarifaires et connectez votre compte bancaire en quelques clics.",
                },
                {
                  step: "02",
                  title: "Structuration du planning",
                  desc: "Programmez vos séances, assignez vos intervenants et gérez les capacités d'accueil de vos salles.",
                },
                {
                  step: "03",
                  title: "Ouverture des réservations",
                  desc: "Partagez votre portail dédié. Vos clients s'inscrivent et règlent leurs séances en toute autonomie.",
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                  <div className="text-4xl font-heading text-muted-foreground/30 font-light shrink-0 w-16">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-medium text-foreground mb-3">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Features Showcase */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="mb-16 max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-6">
              L'outil qui s'efface devant votre activité.
            </h2>
            <p className="text-muted-foreground text-xl">
              L'automatisation des tâches administratives vous permet de vous concentrer exclusivement sur votre enseignement.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 rounded-xl border border-border shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden bg-background">
            <div className="w-full lg:w-5/12 flex flex-col border-b lg:border-b-0 lg:border-r border-border">
              {interactiveFeatures.map((feat, index) => {
                const isActive = activeFeature === index;
                const Icon = feat.icon;
                return (
                  <button
                    key={feat.id}
                    onClick={() => setActiveFeature(index)}
                    className={cn(
                      "text-left p-8 transition-colors relative",
                      isActive ? "bg-secondary" : "hover:bg-secondary/50"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                    <div className="flex items-start gap-5">
                      <div className={cn(
                        "mt-1",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        <Icon className="size-6" />
                      </div>
                      <div>
                        <h3 className={cn("text-lg font-heading font-medium mb-2", isActive ? "text-foreground" : "text-foreground/80")}>
                          {feat.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="w-full lg:w-7/12 h-[400px] lg:h-auto relative bg-secondary">
              {interactiveFeatures.map((feat, index) => (
                <div
                  key={feat.id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500",
                    activeFeature === index ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  <img
                    src={feat.image}
                    alt={feat.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits (Premium approach) */}
        <section className="py-24 bg-foreground text-background px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-heading font-medium tracking-tight mb-6">
                Propriété exclusive de vos données.
              </h2>
              <p className="text-background/70 text-xl font-light">
                Conservez 100% du contrôle sur votre clientèle. Nous fournissons l'infrastructure, vous gardez l'indépendance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
              {[
                {
                  title: "Marque Blanche",
                  desc: "Votre portail client reflète votre identité visuelle et votre marque.",
                },
                {
                  title: "Zéro Commission",
                  desc: "La plateforme ne prélève aucun pourcentage sur le montant de vos réservations.",
                },
                {
                  title: "Données Souveraines",
                  desc: "Accès exclusif et exportabilité totale de votre base de données clients.",
                },
                {
                  title: "Fiabilité Technique",
                  desc: "Une infrastructure cloud moderne garantissant une disponibilité maximale.",
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col">
                  <div className="h-px w-12 bg-primary/50 mb-6" />
                  <h3 className="text-xl font-heading font-medium mb-3 text-background">
                    {item.title}
                  </h3>
                  <p className="text-background/60 leading-relaxed text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 px-6 max-w-4xl mx-auto border-b border-border/50">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="border-b border-border last:border-0"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left py-6 flex justify-between items-center focus:outline-none group"
                  >
                    <span className="text-lg font-heading font-medium text-foreground group-hover:text-primary transition-colors">
                      {faq.q}
                    </span>
                    <div className={cn("transition-transform duration-300 ml-4", isOpen ? "rotate-180" : "")}>
                      <ChevronDownIcon className="size-5 text-muted-foreground" />
                    </div>
                  </button>
                  <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden">
                      <p className="pb-6 text-muted-foreground text-base leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-heading font-medium tracking-tight text-foreground mb-8">
              Démarrez votre transition.
            </h2>
            <p className="text-muted-foreground text-xl mb-12 max-w-2xl mx-auto">
              Testez l'intégralité des fonctionnalités gratuitement pendant 14 jours.
            </p>
            <div className="flex justify-center">
              <Link href="/register?role=manager">
                <Button className="bg-foreground text-background rounded-lg px-10 h-14 text-lg font-medium hover:bg-foreground/90 transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.1)]">
                  Ouvrir mon compte
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="flex flex-col items-start gap-4 max-w-xs">
            <div className="flex items-center gap-3 font-heading font-semibold text-2xl text-foreground tracking-tight">
              <img src="/logo_redesign_v2.png" alt="Fitloww" className="h-8 w-8" />
              Fitloww
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Le système d'exploitation des studios de fitness, yoga et pilates modernes.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm">
            <div className="flex flex-col gap-4">
              <p className="font-heading font-medium text-foreground">Produit</p>
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Tarifs</Link>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-heading font-medium text-foreground">Société</p>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-heading font-medium text-foreground">Légal</p>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Conditions d'utilisation</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Fitloww. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
