"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function BillingPoller({ isBlocked }: { isBlocked: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success");
  const [isPolling, setIsPolling] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (success === "true" && isBlocked) {
      setIsPolling(true);
      
      let toastId: string | number | undefined;
      if (!hasShownToast) {
         toastId = toast.loading("Validation de votre paiement en cours...");
         setHasShownToast(true);
      }

      const interval = setInterval(() => {
        router.refresh();
      }, 2000);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsPolling(false);
        toast.error("Le paiement prend plus de temps que prévu. Veuillez rafraîchir la page dans quelques instants.", { id: toastId });
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (success === "true" && !isBlocked) {
      setIsPolling(false);
      toast.dismiss();
      toast.success("Votre abonnement a été validé avec succès !");
      router.replace("/dashboard/billing");
    }
  }, [success, isBlocked, router, hasShownToast]);

  if (!isPolling) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-2xl font-bold mb-2">Validation en cours...</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Nous attendons la confirmation de votre paiement par notre partenaire sécurisé. Cela ne prendra que quelques secondes.
      </p>
    </div>
  );
}
