"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeAction, cancelSubscriptionAction } from "@/app/actions/billing";
import { toast } from "sonner";

interface BillingButtonProps {
  plan: "starter" | "premium";
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  isCurrentPlan?: boolean;
}

export function BillingButton({ 
  plan, 
  disabled, 
  children, 
  className,
  variant = "default",
  isCurrentPlan = false
}: BillingButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (isCurrentPlan) {
      if (!window.confirm("Voulez-vous vraiment annuler votre abonnement ? Cette action est immédiate.")) return;
      
      setLoading(true);
      const toastId = toast.loading("Annulation en cours...");
      try {
        const result = await cancelSubscriptionAction();
        if (result?.error) {
          toast.error(result.error, { id: toastId });
        } else {
          toast.success("Abonnement annulé avec succès.", { id: toastId });
          window.location.reload();
        }
      } catch (error) {
        toast.error("Erreur lors de l'annulation.", { id: toastId });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Préparation du paiement...");
    
    try {
      const result = await subscribeAction(plan);
      
      if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else if (result?.url) {
        toast.loading("Redirection vers Mollie...", { id: toastId });
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la connexion à Mollie.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      className={className}
      disabled={disabled || loading}
      onClick={handleAction}
      variant={variant}
    >
      {loading ? "Chargement..." : children}
    </Button>
  );
}
