'use client'

import { Button } from "@/components/ui/button"
import { toggleMemberSubscriptionAction } from "@/app/actions/members"
import { toast } from "sonner"
import { useState } from "react"
import { Crown, Ban } from "lucide-react"

export function MemberSubscriptionToggle({ memberId, hasSubscription }: { memberId: string, hasSubscription: boolean }) {
  const [isPending, setIsPending] = useState(false)

  return (
    <Button 
      variant={hasSubscription ? "outline" : "default"}
      disabled={isPending}
      onClick={async () => {
        const newStatus = !hasSubscription;

        if (newStatus) {
          if (!window.confirm("En activant l'abonnement, ce membre pourra réserver tous vos cours gratuitement sans passer par votre lien de paiement. Confirmer ?")) {
            return;
          }
        }

        setIsPending(true)
        const res = await toggleMemberSubscriptionAction(memberId, newStatus)
        if (res?.error) {
          toast.error(res.error)
          setIsPending(false)
        } else {
          toast.success(newStatus ? "Abonnement activé : Ses séances seront gratuites." : "Abonnement retiré")
          setIsPending(false)
        }
      }}
      className={`rounded-xl h-9 px-4 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${hasSubscription ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
    >
      {hasSubscription ? (
        <>
            <Ban className="size-3" />
            Retirer l'abonnement
        </>
      ) : (
        <>
            <Crown className="size-3" />
            Activer l'abonnement (Gratuit)
        </>
      )}
    </Button>
  )
}
