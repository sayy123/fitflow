"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeAction, createCustomerPortalAction } from "@/app/actions/billing";
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
    setLoading(true);

    if (isCurrentPlan) {
      const toastId = toast.loading("Ouverture de votre espace client...");
      try {
        const result = await createCustomerPortalAction();
        if (result?.error) {
          toast.error(result.error, { id: toastId });
        } else if (result?.url) {
          window.location.href = result.url;
        }
      } catch (error) {
        toast.error("Erreur lors de l'accès au portail Stripe.", { id: toastId });
      } finally {
        setLoading(false);
      }
      return;
    }

    const toastId = toast.loading("Préparation du paiement...");
    
    try {
      const result = await subscribeAction(plan);
      
      if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else if (result?.url) {
        toast.loading("Redirection vers Stripe...", { id: toastId });
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la connexion à Stripe.", { id: toastId });
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
