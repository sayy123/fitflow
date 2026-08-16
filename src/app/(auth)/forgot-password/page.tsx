"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "@/app/actions/auth";
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
import { KeyIcon } from "@heroicons/react/24/outline";

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, null);

  return (
    <Card className="w-full max-w-[400px] border border-border bg-background rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
      <CardHeader className="pt-10 pb-6 px-10 text-center">
        <div className="size-12 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground mx-auto mb-6">
          <KeyIcon className="size-5" />
        </div>
        <CardTitle className="text-2xl font-heading font-medium tracking-tight text-foreground">
          Mot de passe oublié
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-2 font-light">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-10 pb-10">
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-medium text-foreground/80 uppercase tracking-wider"
            >
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ex: jean@email.com"
              className="h-11 rounded-lg border-border focus:ring-1 focus:ring-foreground focus:border-foreground transition-colors bg-background"
            />
          </div>
          
          {state?.error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive space-y-3">
              <p>{state.error}</p>
            </div>
          )}
          {state?.success && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-600 space-y-3">
              <p>{state.message}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-lg font-medium text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors mt-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            disabled={isPending || state?.success}
          >
            {isPending ? "Envoi en cours..." : "Envoyer le lien"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground font-light">
          <Link
            href="/login"
            className="text-foreground font-medium hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
