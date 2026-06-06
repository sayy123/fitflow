"use client";

import { Mail, MessageSquare, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col items-center justify-center p-6 selection:bg-zinc-200">
      <Link 
        href="/" 
        className="fixed top-8 left-8 flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
        Retour
      </Link>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-zinc-900">
              Parlons de votre <br />
              <span className="text-zinc-400">studio.</span>
            </h1>
            <p className="text-lg font-medium text-zinc-500 leading-relaxed max-w-md">
              Besoin d&apos;aide, d&apos;une démonstration ou simplement envie de discuter de votre projet ? Notre équipe est là pour vous accompagner.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-white shadow-sm border border-zinc-200/60 flex items-center justify-center text-zinc-900">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</p>
                <a href="mailto:fitflow887@gmail.com" className="text-lg font-bold text-zinc-900 hover:underline">
                  fitflow887@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-white shadow-sm border border-zinc-200/60 flex items-center justify-center text-zinc-900">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Réponse moyenne</p>
                <p className="text-lg font-bold text-zinc-900">Moins de 24 heures</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-zinc-200/60 shadow-2xl shadow-zinc-200/40 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-12 space-y-8">
            <div className="size-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white rotate-3">
              <MessageSquare className="size-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900">Support Client</h2>
              <p className="text-zinc-500 font-medium">
                Propriétaires de studios et membres, nous sommes à votre disposition 7j/7.
              </p>
            </div>

            <div className="pt-4">
              <Button 
                asChild
                className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10"
              >
                <a href="mailto:fitflow887@gmail.com">
                  Envoyer un message
                </a>
              </Button>
            </div>

            <p className="text-center text-xs text-zinc-400 font-medium">
              Pas encore inscrit ? <Link href="/register" className="text-zinc-900 font-bold hover:underline">Créez votre studio gratuitement &rarr;</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
