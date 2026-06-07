"use client";

import { Mail, MessageSquare, Clock, ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const email = "fitflow887@gmail.com";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Email copié !");
    setTimeout(() => setCopied(false), 2000);
  };

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
              Besoin d&apos;aide, d&apos;une démonstration ou simplement envie de discuter ? Notre équipe est là.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="size-12 rounded-2xl bg-white shadow-sm border border-zinc-200/60 flex items-center justify-center text-zinc-900">
                <Mail className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Direct</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-zinc-900">{email}</span>
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
                    title="Copier l'email"
                  >
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </button>
                </div>
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
              <h2 className="text-2xl font-bold text-zinc-900">Nous écrire</h2>
              <p className="text-zinc-500 font-medium">
                Choisissez votre service de messagerie favori pour nous contacter directement.
              </p>
            </div>

            <div className="grid gap-3 pt-4">
              <Button 
                asChild
                className="h-14 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 flex items-center gap-3"
              >
                <a 
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir dans Gmail
                </a>
              </Button>
              
              <Button 
                asChild
                variant="outline"
                className="h-14 rounded-2xl font-bold border-zinc-200 hover:bg-zinc-50 transition-all flex items-center gap-3"
              >
                <a 
                  href={`https://outlook.office.com/mail/deeplink/compose?to=${email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir dans Outlook
                </a>
              </Button>

              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-zinc-100"></div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ou</span>
                <div className="h-px flex-1 bg-zinc-100"></div>
              </div>

              <Button 
                asChild
                variant="ghost"
                className="h-12 rounded-xl text-zinc-500 font-bold hover:text-zinc-900 transition-all"
              >
                <a href={`mailto:${email}`}>
                  Utiliser l&apos;application par défaut
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
