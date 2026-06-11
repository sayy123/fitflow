"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 px-6 mb-20 relative">
      <div className="absolute inset-0 bg-zinc-900 -skew-y-2 origin-top-left -z-10" />
      <div className="max-w-4xl mx-auto text-center text-white relative z-10 py-12">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight">
          Prêt à transformer <br />
          votre studio ?
        </h2>
        <p className="text-zinc-400 text-xl font-medium mb-12 max-w-2xl mx-auto">
          Rejoignez les studios qui ont déjà choisi l'élégance et la
          simplicité.
        </p>
        <Link href="/register">
          <Button className="bg-white text-zinc-900 rounded-full h-14 px-8 text-lg font-bold hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
            Démarrer gratuitement
          </Button>
        </Link>
      </div>
    </section>
  );
}