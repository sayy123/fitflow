"use client";

import { useActionState } from "react";
import {
  loginAction,
  signInWithGoogleAction,
  resendVerificationAction,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { LogIn, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, null);
  const [resending, setResending] = useState(false);

  const handleResend = async (email: string) => {
    if (!email) {
      toast.error("Veuillez saisir votre email");
      return;
    }
    setResending(true);
    const result = await resendVerificationAction(email);
    setResending(false);
    if (result.success) {
      toast.success("Email de confirmation renvoyé !");
    } else {
      toast.error(result.error || "Erreur lors de l'envoi");
    }
  };

  return (
    <Card className="w-full max-w-[400px] border border-zinc-200/60 bg-white rounded-3xl shadow-xl shadow-zinc-900/5 overflow-hidden">
      <CardHeader className="pt-10 pb-6 px-10 text-center">
        <div className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 mx-auto mb-4">
          <LogIn className="size-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
          Content de vous revoir
        </CardTitle>
        <CardDescription className="text-zinc-500 font-medium mt-1">
          Accédez à votre espace personnel Fitflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-10 pb-10">
        <form action={action} className="space-y-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-zinc-700"
            >
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ex: jean@email.com"
              className="h-11 rounded-xl border-zinc-200 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all bg-zinc-50/50 hover:bg-zinc-50"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              title="Mot de passe"
              className="text-xs font-semibold text-zinc-700"
            >
              Mot de passe
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="h-11 rounded-xl border-zinc-200 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all bg-zinc-50/50 hover:bg-zinc-50"
            />
          </div>
          {state?.error && (
            <div className="p-4 rounded-xl bg-red-50/80 border border-red-100 text-sm font-medium text-red-600 animate-in fade-in slide-in-from-top-1 space-y-3">
              <p>⚠️ {state.error}</p>
              {(state.error.includes("confirmer") ||
                state.error.includes("confirm")) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs font-semibold text-red-700 border-red-200 hover:bg-red-100/50 transition-colors"
                  onClick={() => {
                    const emailInput = document.getElementById(
                      "email",
                    ) as HTMLInputElement;
                    handleResend(emailInput?.value);
                  }}
                  disabled={resending}
                >
                  <Send className="size-3.5 mr-2" />
                  {resending ? "Envoi..." : "Renvoyer l'email"}
                </Button>
              )}
            </div>
          )}
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold text-sm bg-zinc-900 text-white hover:bg-zinc-800 transition-colors mt-2"
            disabled={isPending}
          >
            {isPending ? "Connexion en cours.." : "Se connecter"}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-100" />
          </div>
          <div className="relative flex justify-center text-xs font-medium text-zinc-400">
            <span className="bg-white px-4">Ou continuer avec</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11 rounded-xl font-semibold text-sm border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center justify-center gap-3"
          onClick={() => signInWithGoogleAction()}
        >
          <svg className="size-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="text-zinc-900 font-semibold hover:underline"
          >
            S'inscrire
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
