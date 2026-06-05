"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, ArrowRight, Zap } from "lucide-react";
import { createStudioAction, setActiveStudioAction } from "@/app/actions/studios";
import { toast } from "sonner";
import Link from "next/link";

interface Studio {
  id: string;
  name: string;
  plan: string;
  address: string | null;
  subscription_status: string;
}

export default function StudiosClient({
  studios,
  isPremium,
  activeStudioId,
}: {
  studios: Studio[];
  isPremium: boolean;
  activeStudioId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setLoading(true);
    const result = await createStudioAction(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Nouveau studio créé !");
      setIsCreating(false);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Mes Salles
          </h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Gérez vos différents studios depuis une seule interface.
          </p>
        </div>
        {isPremium && studios.length < 3 && (
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="size-4 mr-2" />
            Nouvelle salle
          </Button>
        )}
      </div>

      {!isPremium && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Building2 className="size-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-amber-900 font-bold">Vous avez besoin d&apos;une autre salle ?</h3>
              <p className="text-amber-700/80 font-medium text-sm mt-1 max-w-md">
                Le plan Starter vous limite à 1 seule salle. Passez au plan Premium pour gérer jusqu&apos;à 3 salles indépendantes avec des plannings et coachs distincts.
              </p>
            </div>
          </div>
          <Link href="/dashboard/billing" className="w-full md:w-auto shrink-0">
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold border-none">
              <Zap className="size-4 mr-2" />
              Passer en Premium
            </Button>
          </Link>
        </div>
      )}

      {isCreating && (
        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Créer une nouvelle salle</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label htmlFor="name">Nom du studio / salle</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ex: Fitflow Paris 15"
                  required
                  className="bg-white"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-32">
                {loading ? "Création..." : "Créer"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                Annuler
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studios.map((studio) => (
          <Card
            key={studio.id}
            className={`relative overflow-hidden transition-all ${
              studio.id === activeStudioId
                ? "border-zinc-900 shadow-md ring-1 ring-zinc-900"
                : "border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {studio.id === activeStudioId && (
              <div className="absolute top-0 right-0 bg-zinc-900 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                Actif
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="size-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
                <Building2 className="size-6 text-zinc-500" />
              </div>
              <CardTitle className="text-lg font-bold text-zinc-900 line-clamp-1">
                {studio.name}
              </CardTitle>
              <p className="text-sm text-zinc-500 font-medium">
                {studio.address || "Adresse non renseignée"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-6">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  studio.plan === 'premium' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {studio.plan}
                </span>
              </div>
              {studio.id !== activeStudioId ? (
                <Button
                  variant="outline"
                  className="w-full font-bold group"
                  onClick={() => setActiveStudioAction(studio.id)}
                >
                  Basculer sur cette salle
                  <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button disabled variant="secondary" className="w-full font-bold">
                  Salle actuellement gérée
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
