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
    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 justify-end">
      <span
        className={cn(
          "px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[10px] md:text-xs font-semibold border whitespace-nowrap",
          isActive ? "bg-muted text-foreground border-border" : "bg-background text-muted-foreground border-border/50"
        )}
      >
        {isActive ? "Actif" : "Inactif"}
      </span>
      
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[10px] md:text-xs font-semibold border flex items-center gap-1 transition-all whitespace-nowrap",
          hasSub 
            ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-pointer" 
            : "bg-background text-muted-foreground border-dashed border-border/50 hover:bg-muted hover:text-foreground cursor-pointer"
        )}
        title={hasSub ? "Retirer l'abonnement" : "Activer l'abonnement"}
      >
        <Crown className={cn("size-3", hasSub ? "fill-primary text-primary" : "")} />
        <span className="hidden sm:inline">{hasSub ? "Abonné" : "Non abonné"}</span>
        <span className="sm:hidden">{hasSub ? "Abo" : "À la carte"}</span>
      </button>
    </div>
  )
}
