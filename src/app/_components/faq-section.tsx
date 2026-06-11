"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      a: "Non, nous ne prenons aucune commission sur vos ventes. Vous gardez 100% de vos revenus (hors frais standards de votre processeur de paiement comme Stripe).",
    },
  ];

  return (
    <section className="py-24 px-6 max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
          Questions fréquentes
        </h2>
        <p className="text-zinc-500 font-medium">
          Tout ce que vous devez savoir avant de vous lancer.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border border-zinc-200 rounded-2xl overflow-hidden bg-white transition-all hover:border-zinc-300"
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left"
            >
              <span className="font-bold text-zinc-900 pr-4">
                {faq.q}
              </span>
              <ChevronDown
                className={cn(
                  "size-5 text-zinc-400 transition-transform duration-300 shrink-0",
                  openFaq === i && "rotate-180",
                )}
              />
            </button>
            <div
              className={cn(
                "px-6 overflow-hidden transition-all duration-300 ease-in-out",
                openFaq === i ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <p className="text-zinc-500 font-medium leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}