"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Activity,
  Calendar,
  Users,
  ChevronDown,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle navbar shadow on scroll
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
      title: "Planning intelligent",
      desc: "Gérez vos séances en toute simplicité. Vos coachs et membres sont notifiés en temps réel.",
      icon: Calendar,
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 1,
      title: "Paiements automatisés",
      desc: "Abonnements, carnets de séances ou à la carte. Encaissez vos clients sans friction.",
      icon: CreditCard,
      image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Expérience premium",
      desc: "Offrez à vos clients une réservation fluide sur mobile. Fini les messages WhatsApp.",
      icon: Smartphone,
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  const faqs = [
    {
      q: "Combien de temps faut-il pour configurer Fitloww ?",
      a: "Moins de 5 minutes. Notre assistant d'intégration vous guide pas à pas. Vous pouvez créer votre studio, ajouter vos coachs et publier votre premier cours immédiatement.",
    },
    {
      q: "Mes clients doivent-ils télécharger une application ?",
      a: "Non, Fitloww est une Web App progressive (PWA). Vos membres y accèdent via un simple lien, avec une interface parfaitement optimisée pour mobile.",
    },
    {
      q: "Puis-je gérer plusieurs studios avec un seul compte ?",
      a: "Absolument. Vous pouvez basculer d'un studio à l'autre en un clic depuis votre espace administrateur.",
    },
    {
      q: "Fitloww prend-il une commission sur les réservations ?",
      a: "Non, nous ne prenons aucune commission sur vos ventes. Vous gardez 100% de vos revenus (hors frais standards Stripe).",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* Navigation */}
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-white",
          scrolled ? "shadow-sm border-b border-slate-100 py-3" : "py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2.5">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="size-5 text-white" />
            </div>
            <span className="text-slate-900">
              Fitloww
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-[15px] font-medium text-slate-600 hover:text-primary transition-colors">
              Fonctionnalités
            </Link>
            <Link href="/pricing" className="text-[15px] font-medium text-slate-600 hover:text-primary transition-colors">
              Tarifs
            </Link>
            <Link href="/contact" className="text-[15px] font-medium text-slate-600 hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-[15px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Connexion
            </Link>
            <Link href="/register">
              <Button className="bg-primary text-white rounded-full px-6 h-10 text-[15px] font-medium hover:bg-primary/90 hover:scale-105 transition-all shadow-sm">
                Essayer gratuitement
              </Button>
            </Link>
          </div>
          
          {/* Mobile Nav Toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="size-6 text-slate-900" /> : <Menu className="size-6 text-slate-900" />}
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto lg:pt-48 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-700 text-sm font-medium mb-8 border border-slate-200">
              <span className="flex size-2 rounded-full bg-primary animate-pulse" />
              La nouvelle norme pour les studios boutique
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Gérez votre studio avec <br className="hidden md:block" />
              <span className="text-primary">une élégance absolue.</span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Le logiciel de réservation conçu pour le Yoga, Pilates et fitness. Centralisez plannings, paiements et clients dans une interface lumineuse et incroyablement simple.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register?role=manager">
                <Button className="w-full sm:w-auto bg-primary text-white rounded-full px-8 h-14 text-lg font-medium hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center gap-2 group">
                  Créer mon studio{" "}
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/register?role=member">
                <Button variant="outline" className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-medium border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  Espace membre
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Aucune carte bancaire requise. Configuration en 5 minutes.</p>
          </div>

          {/* Hero Image Showcase */}
          <div className="mt-20 relative mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            <div className="rounded-[24px] p-3 bg-white border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]">
              <div className="rounded-[16px] overflow-hidden relative aspect-[16/9] bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=2500&auto=format&fit=crop"
                  alt="Studio de fitness moderne"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                Démarrez en 3 étapes simples.
              </h2>
              <p className="text-slate-600 text-lg">
                Fini les logiciels complexes et surchargés. Fitloww va à l'essentiel.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-[2px] bg-slate-200" />

              {[
                {
                  step: "1",
                  title: "Créez votre espace",
                  desc: "Configurez votre studio et vos tarifs instantanément.",
                },
                {
                  step: "2",
                  title: "Générez votre planning",
                  desc: "Ajoutez vos cours et assignez vos professeurs.",
                },
                {
                  step: "3",
                  title: "Invitez vos membres",
                  desc: "Partagez votre lien. Vos clients réservent en un clic.",
                },
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center text-center group">
                  <div className="size-16 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center text-xl font-bold text-slate-900 mb-6 relative z-10 group-hover:border-primary group-hover:text-primary transition-all duration-300">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed max-w-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Features Showcase */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
              Pensé pour vous faire gagner du temps.
            </h2>
            <p className="text-slate-600 text-xl">
              Automatisez vos réservations et encaissements pour vous concentrer sur vos cours.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            {/* Left: Interactive List */}
            <div className="w-full lg:w-5/12 flex flex-col p-6 md:p-10">
              {interactiveFeatures.map((feat, index) => {
                const isActive = activeFeature === index;
                const Icon = feat.icon;
                return (
                  <button
                    key={feat.id}
                    onClick={() => setActiveFeature(index)}
                    className={cn(
                      "text-left p-6 rounded-2xl transition-all duration-300 relative group",
                      isActive ? "bg-slate-50" : "hover:bg-slate-50/50"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-primary rounded-r-full" />
                    )}
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "size-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300",
                          isActive ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className={cn("text-lg font-bold mb-1", isActive ? "text-slate-900" : "text-slate-700")}>
                          {feat.title}
                        </h3>
                        <p className={cn("text-sm leading-relaxed", isActive ? "text-slate-600" : "text-slate-500")}>
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Dynamic Image */}
            <div className="w-full lg:w-7/12 h-[400px] lg:h-[600px] relative">
              {interactiveFeatures.map((feat, index) => (
                <div
                  key={feat.id}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-in-out",
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

        {/* Benefits */}
        <section className="py-24 bg-primary text-white px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Reprenez le contrôle de votre activité.
              </h2>
              <p className="text-white/80 text-lg">
                Fitloww n'est pas une marketplace. Vos clients vous appartiennent.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "Marque Blanche",
                  desc: "L'interface met en avant votre nom de studio et vos couleurs.",
                  icon: Activity,
                },
                {
                  title: "0 Commission",
                  desc: "Nous ne prenons aucun pourcentage sur vos ventes.",
                  icon: CreditCard,
                },
                {
                  title: "Données privées",
                  desc: "Vous êtes l'unique propriétaire de votre base clients.",
                  icon: ShieldCheck,
                },
                {
                  title: "Sécurisé",
                  desc: "Infrastructure robuste garantissant performance et fiabilité.",
                  icon: CheckCircle2,
                },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 p-8 rounded-[20px] backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors">
                  <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                    <item.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">
                    {item.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={cn(
                    "border border-slate-200 rounded-xl overflow-hidden transition-all duration-300",
                    isOpen ? "bg-white shadow-sm" : "bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-6 flex justify-between items-center focus:outline-none"
                  >
                    <span className="font-semibold text-slate-900">
                      {faq.q}
                    </span>
                    <div className={cn("transition-transform duration-300", isOpen ? "rotate-180" : "")}>
                      <ChevronDown className="size-5 text-slate-500" />
                    </div>
                  </button>
                  <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden">
                      <p className="p-6 pt-0 text-slate-600 leading-relaxed text-sm">
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
        <section className="pb-24 px-6">
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-[24px] p-12 md:p-20 text-center relative shadow-xl overflow-hidden">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white leading-tight">
              Prêt à moderniser votre studio ?
            </h2>
            <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
              Créez votre compte gratuitement. Configuration en 5 minutes. Aucune carte de crédit requise.
            </p>
            <div className="flex justify-center">
              <Link href="/register?role=manager">
                <Button className="bg-primary text-white rounded-full px-10 h-14 text-lg font-medium hover:bg-primary/90 hover:scale-[1.02] transition-all shadow-lg">
                  Essayer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-900 tracking-tight">
              <div className="size-6 bg-primary rounded-md flex items-center justify-center">
                <Activity className="size-3 text-white" />
              </div>
              Fitloww
            </div>
            <p className="text-slate-500 text-sm">
              L'outil de gestion pensé pour le bien-être.
            </p>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <Link href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">Tarifs</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-slate-400">
            © 2026 Fitloww. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
