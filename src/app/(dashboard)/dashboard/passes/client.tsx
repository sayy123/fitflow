"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateOrganizationAction } from "@/app/actions/organizations";
import { AlertCircle, CreditCard } from "lucide-react";

interface Organization {
  id: string;
  member_monthly_price?: number | null;
  member_yearly_price?: number | null;
  stripe_charges_enabled?: boolean | null;
}

export function PassesClient({
  organization,
}: {
  organization: Organization;
}) {
  const [memberMonthlyPrice, setMemberMonthlyPrice] = useState(
    organization.member_monthly_price?.toString() || ""
  );
  const [memberYearlyPrice, setMemberYearlyPrice] = useState(
    organization.member_yearly_price?.toString() || ""
  );
  const [orgLoading, setOrgLoading] = useState(false);

  const handleUpdateOrg = async () => {
    setOrgLoading(true);
    const result = await updateOrganizationAction(organization.id, {
      member_monthly_price: memberMonthlyPrice
        ? parseFloat(memberMonthlyPrice)
        : null,
      member_yearly_price: memberYearlyPrice
        ? parseFloat(memberYearlyPrice)
        : null,
    });
    setOrgLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Offres mises à jour avec succès");
  };

  const isStripeConnected = organization.stripe_charges_enabled;

  if (!isStripeConnected) {
    return (
      <div className="p-8 sm:p-12 border border-border/50 bg-card rounded-2xl flex flex-col items-center justify-center text-center max-w-2xl mx-auto shadow-sm mt-8">
        <div className="size-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="size-8" />
        </div>
        <h3 className="text-2xl font-bold text-card-foreground mb-3">
          Compte Stripe requis
        </h3>
        <p className="text-muted-foreground mb-8">
          Pour pouvoir proposer des abonnements à vos clients, vous devez d&apos;abord connecter votre compte Stripe afin de recevoir les paiements en toute sécurité.
        </p>
        <Button
          onClick={() => {
            window.location.href = `/api/stripe/connect?orgId=${organization.id}`;
          }}
          className="h-12 px-8 rounded-xl font-bold text-[13px] uppercase tracking-wider bg-[#635BFF] hover:bg-[#5851df] text-white shadow-md hover:shadow-lg transition-all"
        >
          <CreditCard className="size-4 mr-2" /> Connecter mon compte Stripe
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 bg-card border border-border/50 rounded-2xl shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
      <div className="pb-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-card-foreground">
          Abonnements Clients (Pass Illimité)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez les prix pour que vos clients puissent s&apos;abonner et accéder à tous vos cours gratuitement. Laissez vide pour désactiver.
        </p>
      </div>
      <div className="space-y-6 max-w-xl">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Prix de l&apos;abonnement Mensuel (1 mois)
          </Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              €
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={memberMonthlyPrice}
              onChange={(e) => setMemberMonthlyPrice(e.target.value)}
              placeholder="Ex: 49.99"
              className="rounded-xl border-border h-12 pl-8 text-sm focus:border-primary focus:ring-primary/20 transition-all bg-background"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Prix de l&apos;abonnement Annuel (1 an)
          </Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              €
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={memberYearlyPrice}
              onChange={(e) => setMemberYearlyPrice(e.target.value)}
              placeholder="Ex: 499.00"
              className="rounded-xl border-border h-12 pl-8 text-sm focus:border-primary focus:ring-primary/20 transition-all bg-background"
            />
          </div>
        </div>
        <div className="pt-4">
          <Button
            onClick={handleUpdateOrg}
            disabled={orgLoading}
            className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold text-[13px] uppercase tracking-wider bg-gray-900 hover:bg-gray-800 shadow-md hover:shadow-lg transition-all text-white"
          >
            {orgLoading ? "Enregistrement..." : "Enregistrer les offres"}
          </Button>
        </div>
      </div>
    </div>
  );
}
