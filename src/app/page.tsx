"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Play,
  Star,
  Users,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Lazy load heavy interactive sections
const FeaturesSection = dynamic(
  () => import("./_components/features-section").then((mod) => mod.FeaturesSection),
  { ssr: true } // Keep SSR for SEO, but delay hydration
);

const FaqSection = dynamic(
  () => import("./_components/faq-section").then((mod) => mod.FaqSection),
  { ssr: true }
);

const CtaSection = dynamic(
  () => import("./_components/cta-section").then((mod) => mod.CtaSection),
  { ssr: true }
);

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  // Handle navbar blur on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-200 font-sans overflow-hidden">
      {/* Navigation */}
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
          scrolled
            ? "bg-white/80 backdrop-blur-xl border-zinc-200/50 shadow-sm"
            : "bg-transparent border-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-lg tracking-tight flex items-center gap-2.5">
            <div className="size-7 bg-gradient-to-tr from-zinc-900 to-zinc-800 rounded-lg flex items-center justify-center shadow-sm shadow-zinc-900/20 ring-1 ring-zinc-900/5">
              <Activity className="size-4 text-white" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">
              Fitloww
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Connexion
            </Link>
            <Link href="/register">
              <Button className="bg-zinc-900 text-white rounded-full px-5 h-9 text-sm font-semibold hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/10 ring-1 ring-inset ring-zinc-900/10 hover:ring-zinc-900/20 hover:scale-105">
                Commencer
              </Button>
            </Link>
          </div>
          
          {/* Mobile Nav Button */}
          <div className="md:hidden flex items-center gap-3">
             <Link href="/login" className="text-xs font-bold text-zinc-900 px-3 py-2">
                Connexion
             </Link>
             <Link href="/register">
              <Button className="bg-zinc-900 text-white rounded-full px-4 h-8 text-[10px] font-bold hover:bg-zinc-800 transition-all">
                S'inscrire
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-zinc-200/50 via-zinc-100/20 to-transparent blur-3xl -z-10 rounded-full" />

          <div className="text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-zinc-800 text-xs font-semibold mb-8 ring-1 ring-zinc-200/80 shadow-sm hover:shadow-md transition-shadow cursor-default hover:-translate-y-0.5 duration-300">
              <span className="flex size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              La nouvelle norme pour les studios
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-zinc-900 mb-8 leading-[1.05]">
              Gérez votre studio.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-400">
                Sans aucune friction.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Fitloww est l'écosystème élégant conçu pour les studios de fitness
              boutique. Centralisez vos plannings, vos coachs et vos membres
              dans une interface d'une clarté absolue.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register?role=manager">
                <Button className="w-full sm:w-auto bg-zinc-900 text-white rounded-full px-8 h-14 text-base font-semibold hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 flex items-center gap-2 group ring-1 ring-inset ring-white/10">
                  Créer mon studio{" "}
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/register?role=member">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 h-14 text-base font-semibold border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm group"
                >
                  <Play className="size-4 mr-2 fill-zinc-400 group-hover:fill-zinc-600 transition-colors" />{" "}
                  Je suis un membre
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image Showcase with Parallax-like floating */}
          <div className="mt-28 relative mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            <div className="absolute -inset-4 bg-gradient-to-tr from-zinc-200/50 to-white/50 opacity-60 blur-2xl -z-10 rounded-[3rem]" />
            <div className="rounded-[2.5rem] p-2 bg-white/60 backdrop-blur-2xl border border-zinc-200/60 shadow-2xl ring-1 ring-zinc-900/5 hover:shadow-3xl transition-shadow duration-700 group">
              <div className="rounded-[2rem] overflow-hidden relative aspect-[16/9] md:aspect-[21/9] bg-zinc-100">
                <img
                  src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=2500&auto=format&fit=crop"
                  alt="Studio de fitness moderne"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[15s] ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/20 via-transparent to-transparent mix-blend-multiply" />
              </div>
            </div>
          </div>
        </section>

        {/* How it works (Replaces Marquee) */}
        <section className="py-24 border-y border-zinc-200/50 bg-white/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
                De l'inscription à la première séance en 3 étapes.
              </h2>
              <p className="text-zinc-500 text-lg font-medium">
                Un processus pensé pour être immédiat. Aucun paramétrage
                technique complexe n'est requis.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-zinc-200" />

              {[
                {
                  step: "01",
                  title: "Créez votre espace",
                  desc: "Renseignez le nom de votre studio. Votre dashboard administrateur est généré instantanément, prêt à l'emploi.",
                },
                {
                  step: "02",
                  title: "Générez votre planning",
                  desc: "Ajoutez vos cours de Yoga, Pilates ou HIIT. Définissez les horaires, les capacités et assignez vos coachs.",
                },
                {
                  step: "03",
                  title: "Invitez vos membres",
                  desc: "Partagez votre lien. Vos clients créent leur compte en 10 secondes et réservent leur place en un clic.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="relative flex flex-col items-center text-center group"
                >
                  <div className="size-24 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-2xl font-bold text-zinc-900 mb-6 relative z-10 group-hover:scale-110 group-hover:border-zinc-300 transition-all duration-300">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-zinc-500 font-medium leading-relaxed max-w-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real Product Value (Replaces Testimonials) */}
        <section className="py-24 bg-zinc-900 text-white px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-40 -mt-40 size-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-40 -mb-40 size-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                L'indépendance technologique.
              </h2>
              <p className="text-zinc-400 text-xl font-medium">
                Nous ne sommes pas une marketplace. Fitloww est votre outil,
                conçu pour mettre en valeur votre marque, pas la nôtre.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Marque Blanche",
                  desc: "Vos clients restent vos clients. L'interface met en avant votre nom de studio et vos couleurs.",
                  icon: Star,
                },
                {
                  title: "Contrôle des Données",
                  desc: "Vous êtes l'unique propriétaire de votre base de données clients. Exportez-la quand vous le souhaitez.",
                  icon: Users,
                },
                {
                  title: "Autonomie Totale",
                  desc: "Pas de validation de cours par des modérateurs. Vous publiez, vos clients réservent instantanément.",
                  icon: Activity,
                },
                {
                  title: "Sécurité Supabase",
                  desc: "Vos données sont sécurisées par l'infrastructure Supabase, garantissant performance et fiabilité.",
                  icon: ShieldCheck,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 p-8 rounded-[2rem] transition-colors duration-300"
                >
                  <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                    <item.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FeaturesSection />
        <FaqSection />
        <CtaSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2.5 font-bold text-xl text-zinc-900 tracking-tight">
              <div className="size-6 bg-zinc-900 rounded-md flex items-center justify-center">
                <Activity className="size-3 text-white" />
              </div>
              Fitloww
            </div>
            <p className="text-zinc-500 text-sm font-medium">
              L'outil de gestion ultime pour les studios de fitness.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-semibold text-zinc-500">
            <Link href="#features" className="hover:text-zinc-900 transition-colors">
              Fonctionnalités
            </Link>
            <Link href="/pricing" className="hover:text-zinc-900 transition-colors">
              Tarifs
            </Link>
            <Link href="/contact" className="hover:text-zinc-900 transition-colors">
              Contact
            </Link>
            <Link href="/legal" className="hover:text-zinc-900 transition-colors">
              Légal
            </Link>
          </div>
          <p className="text-sm font-medium text-zinc-400">
            © 2026 Fitloww. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
