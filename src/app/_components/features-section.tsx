"use client";

import { useState } from "react";
import { Calendar, CreditCard, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  const interactiveFeatures = [
    {
      id: 0,
      title: "Planning intelligent",
      desc: "Glissez, déposez et gérez vos séances en temps réel. Vos coachs et membres sont notifiés automatiquement.",
      icon: Calendar,
      image:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 1,
      title: "Paiements sans friction",
      desc: "Abonnements, carnets de séances ou paiement à la carte. Encaissez vos clients directement depuis l'application.",
      icon: CreditCard,
      image:
        "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Expérience Membre Premium",
      desc: "Offrez à vos clients une interface de réservation fluide sur mobile. Finis les appels et les messages WhatsApp.",
      icon: Smartphone,
      image:
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6 leading-tight">
            Une puissance invisible.
            <br />
            Une élégance visible.
          </h2>
          <p className="text-zinc-500 text-xl font-medium leading-relaxed">
            Découvrez comment Fitloww simplifie chaque aspect de la gestion
            de votre studio, de la réservation à l'encaissement.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center bg-white rounded-[3rem] p-4 md:p-8 border border-zinc-200/60 shadow-xl shadow-zinc-900/5">
          <div className="w-full lg:w-1/3 flex flex-col gap-2">
            {interactiveFeatures.map((feat, index) => {
              const isActive = activeFeature === index;
              const Icon = feat.icon;
              return (
                <button
                  key={feat.id}
                  onClick={() => setActiveFeature(index)}
                  className={cn(
                    "text-left p-6 rounded-2xl transition-all duration-300 relative overflow-hidden group",
                    isActive
                      ? "bg-zinc-50 border-zinc-200 shadow-sm"
                      : "hover:bg-zinc-50/50 border-transparent",
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-zinc-900 rounded-r-full" />
                  )}
                  <div
                    className={cn(
                      "size-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300",
                      isActive
                        ? "bg-white shadow-sm text-zinc-900"
                        : "bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-zinc-900",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3
                    className={cn(
                      "text-xl font-bold mb-2 transition-colors",
                      isActive ? "text-zinc-900" : "text-zinc-600",
                    )}
                  >
                    {feat.title}
                  </h3>
                  <p
                    className={cn(
                      "text-sm leading-relaxed transition-colors font-medium",
                      isActive ? "text-zinc-600" : "text-zinc-400",
                    )}
                  >
                    {feat.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="w-full lg:w-2/3">
            <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-zinc-100 border border-zinc-200 shadow-inner">
              {interactiveFeatures.map((feat, index) => (
                <div
                  key={feat.id}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-in-out",
                    activeFeature === index
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105 pointer-events-none",
                  )}
                >
                  <Image
                    src={feat.image}
                    alt={feat.title}
                    fill
                    className="object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/30 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}