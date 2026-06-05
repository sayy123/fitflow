"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeAction } from "@/app/actions/billing";
import { toast } from "sonner";

interface BillingButtonProps {
  plan: "starter" | "premium";
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export function BillingButton({ 
  plan, 
  disabled, 
  children, 
  className,
  variant = "default" 
}: BillingButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
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
      onClick={handleSubscribe}
      variant={variant}
    >
      {loading ? "Chargement..." : children}
    </Button>
  );
}
