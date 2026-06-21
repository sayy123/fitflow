"use client";

import { useActionState, useState, useEffect, Suspense } from "react";
import { registerAction, signInWithGoogleAction } from "@/app/actions/auth";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

function RegisterContent() {
  const [state, action, isPending] = useActionState(registerAction, null);
  const [role, setRole] = useState<"member" | "manager">("manager");
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "member") {
      setRole("member");
    }
  }, [searchParams]);

  const defaultEmail = searchParams.get("email") || "";
  const defaultName = searchParams.get("name") || "";

  return (
    <Card className="w-full max-w-[400px] border border-border/60 bg-card rounded-3xl shadow-xl shadow-primary/5 overflow-hidden">
      <CardHeader className="pt-10 pb-6 px-10 text-center">
        <div className="size-12 rounded-2xl bg-background border border-border/50 flex items-center justify-center text-foreground mx-auto mb-4">
          <UserPlus className="size-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Rejoignez Fitloww
        </CardTitle>
        <CardDescription className="text-muted-foreground font-medium mt-1">
          {role === "manager"
            ? "Lancez votre studio de fitness."
            : "Accédez aux plannings de vos coachs."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-10 pb-10">
        <Tabs
          value={role}
          className="mb-6"
          onValueChange={(v) => setRole(v as "member" | "manager")}
        >
          <TabsList className="grid w-full grid-cols-2 p-1 bg-background/80 rounded-xl h-10">
            <TabsTrigger
              value="manager"
              className="rounded-lg font-semibold text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
            >
              Gérant
            </TabsTrigger>
            <TabsTrigger
              value="member"
              className="rounded-lg font-semibold text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
            >
              Membre
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form action={action} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="plan" value={plan} />

          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-semibold text-foreground/90"
            >
              Votre nom complet
            </Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaultName}
              placeholder="ex: Jean Dupont"
              className="h-11 rounded-xl border-border focus:ring-primary/5 focus:border-primary transition-all bg-background/50 hover:bg-background"
            />
          </div>

          {role === "manager" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label
                htmlFor="studioName"
                className="text-xs font-semibold text-foreground/90"
              >
                Nom de votre studio
              </Label>
              <Input
                id="studioName"
                name="studioName"
                required={role === "manager"}
                placeholder="ex: Fit Studio"
                className="h-11 rounded-xl border-border focus:ring-primary/5 focus:border-primary transition-all bg-background/50 hover:bg-background"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-foreground/90"
            >
              Adresse email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              placeholder="ex: jean@email.com"
              className="h-11 rounded-xl border-border focus:ring-primary/5 focus:border-primary transition-all bg-background/50 hover:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              title="Mot de passe"
              className="text-xs font-semibold text-foreground/90"
            >
              Mot de passe
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="h-11 rounded-xl border-border focus:ring-primary/5 focus:border-primary transition-all bg-background/50 hover:bg-background"
            />
          </div>

          {state?.error && (
            <div className="p-3 rounded-xl bg-red-50/80 border border-red-100 text-sm font-medium text-red-600 animate-in fade-in slide-in-from-top-1 mt-2">
              ⚠️ {state.error}
            </div>
          )}

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox id="terms" name="terms" required className="mt-1" />
            <label
              htmlFor="terms"
              className="text-xs font-medium leading-relaxed text-foreground/80"
            >
              J'accepte les{" "}
              <Link href="/legal" className="text-foreground underline hover:text-foreground/90">
                Mentions Légales
              </Link>{" "}
              et la politique de confidentialité.
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-6"
            disabled={isPending}
          >
            {isPending
              ? "Création en cours..."
              : role === "manager"
                ? "Créer mon studio"
                : "S'inscrire"}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs font-medium text-muted-foreground">
            <span className="bg-card px-4">Ou s'inscrire avec</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11 rounded-xl font-semibold text-sm border-border text-foreground/90 hover:bg-background hover:text-foreground transition-colors flex items-center justify-center gap-3"
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

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="text-foreground font-semibold hover:underline ml-1"
          >
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md h-[600px] animate-pulse bg-card/50 rounded-[2rem] card-shadow" />
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
