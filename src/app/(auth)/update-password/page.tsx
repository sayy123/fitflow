"use client";

import { useState } from "react";
import { updatePasswordAction } from "@/app/actions/auth";
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
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    
    setIsPending(true);
    const result = await updatePasswordAction(password);
    setIsPending(false);

    if (result.success) {
      toast.success("Mot de passe mis à jour avec succès !");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Une erreur est survenue");
    }
  };

  return (
    <Card className="w-full max-w-[400px] border border-border bg-background rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
      <CardHeader className="pt-10 pb-6 px-10 text-center">
        <div className="size-12 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground mx-auto mb-6">
          <ShieldCheckIcon className="size-5" />
        </div>
        <CardTitle className="text-2xl font-heading font-medium tracking-tight text-foreground">
          Nouveau mot de passe
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-2 font-light">
          Choisissez votre nouveau mot de passe sécurisé.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-10 pb-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-medium text-foreground/80 uppercase tracking-wider"
            >
              Nouveau mot de passe
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-lg border-border focus:ring-1 focus:ring-foreground focus:border-foreground transition-colors bg-background"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full h-11 rounded-lg font-medium text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors mt-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            disabled={isPending}
          >
            {isPending ? "Mise à jour..." : "Enregistrer et continuer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
