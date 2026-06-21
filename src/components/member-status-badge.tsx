'use client'

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { toggleMemberSubscriptionAction } from "@/app/actions/members"
import { toast } from "sonner"
import { Crown } from "lucide-react"

export function MemberStatusBadge({ 
  memberId, 
  isActive, 
  initialHasSubscription 
}: { 
  memberId: string, 
  isActive: boolean | null, 
  initialHasSubscription: boolean | null 
}) {
  const [isPending, startTransition] = useTransition()
  const [hasSub, setHasSub] = useState(initialHasSubscription || false)

  const handleToggle = () => {
    const newStatus = !hasSub;

    if (newStatus) {
      if (!window.confirm("En activant l'abonnement, ce membre pourra réserver tous vos cours gratuitement sans passer par votre lien de paiement. Confirmer ?")) {
        return;
      }
    }

    setHasSub(newStatus); // Optimistic update
    
    startTransition(async () => {
      const res = await toggleMemberSubscriptionAction(memberId, newStatus)
      if (res?.error) {
        toast.error(res.error)
        setHasSub(!newStatus) // Revert on error
      } else {
        toast.success(newStatus ? "Abonnement activé : Ses séances seront gratuites." : "Abonnement retiré")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold border",
          isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-background text-foreground/80 border-border"
        )}
      >
        {isActive ? "Actif" : "Inactif"}
      </span>
      
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-all",
          hasSub 
            ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-50 cursor-pointer" 
            : "bg-background text-muted-foreground border-dashed border-border hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 cursor-pointer"
        )}
        title={hasSub ? "Retirer l'abonnement" : "Activer l'abonnement"}
      >
        <Crown className={cn("size-3", hasSub ? "fill-amber-500 text-amber-600" : "")} />
        {hasSub ? "Abonné" : "Sans abonnement"}
      </button>
    </div>
  )
}
