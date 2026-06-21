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
    <div className="min-h-screen bg-background/50 flex flex-col items-center justify-center p-6 pt-24 md:pt-6 selection:bg-zinc-200 relative">
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
        Retour
      </Link>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
              Parlons de votre <br />
              <span className="text-muted-foreground">studio.</span>
            </h1>
            <p className="text-base md:text-lg font-medium text-muted-foreground leading-relaxed max-w-md">
              Besoin d&apos;aide, d&apos;une démonstration ou simplement envie de discuter ? Notre équipe est là.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="size-12 rounded-2xl bg-card shadow-sm border border-border/60 flex items-center justify-center text-foreground">
                <Mail className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Direct</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">{email}</span>
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Copier l'email"
                  >
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-card shadow-sm border border-border/60 flex items-center justify-center text-foreground">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Réponse moyenne</p>
                <p className="text-lg font-bold text-foreground">Moins de 24 heures</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-border/60 shadow-2xl shadow-zinc-200/40 rounded-[2.5rem] overflow-hidden bg-card">
          <CardContent className="p-12 space-y-8">
            <div className="size-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white rotate-3">
              <MessageSquare className="size-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Nous écrire</h2>
              <p className="text-muted-foreground font-medium">
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
                className="h-14 rounded-2xl font-bold border-border hover:bg-background transition-all flex items-center gap-3"
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
                <div className="h-px flex-1 bg-muted"></div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ou</span>
                <div className="h-px flex-1 bg-muted"></div>
              </div>

              <Button 
                asChild
                variant="ghost"
                className="h-12 rounded-xl text-muted-foreground font-bold hover:text-foreground transition-all"
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
