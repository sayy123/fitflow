import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createFirstStudioAction } from "@/app/actions/studios";
import { Zap } from "lucide-react";
import Link from "next/link";

export default async function CreateStudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background/50 flex flex-col items-center justify-center p-6 selection:bg-zinc-200">
      <Link href="/dashboard" className="absolute top-8 left-8 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        &larr; Retour au tableau de bord
      </Link>
      
      <Card className="w-full max-w-md border-none shadow-xl shadow-zinc-900/5 rounded-3xl overflow-hidden">
        <CardHeader className="text-center p-8 pb-4">
          <div className="size-16 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-zinc-900/20 mb-6">
            <Zap className="size-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-foreground">
            Lancez votre studio
          </CardTitle>
          <CardDescription className="text-base font-medium text-muted-foreground mt-2">
            Donnez un nom à votre espace pour commencer à gérer vos plannings et vos membres.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <form action={async (fd) => { "use server"; await createFirstStudioAction(fd); }} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Nom du studio
              </Label>
              <Input
                id="name"
                name="name"
                required
                minLength={2}
                placeholder="Ex: Fitloww Yoga Paris"
                className="h-14 rounded-xl border-border bg-card text-base shadow-sm focus-visible:ring-zinc-900 focus-visible:border-zinc-900"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-14 rounded-xl bg-zinc-900 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Créer mon espace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}