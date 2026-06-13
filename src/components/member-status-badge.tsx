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
    setHasSub(newStatus); // Optimistic update
    
    startTransition(async () => {
      const res = await toggleMemberSubscriptionAction(memberId, newStatus)
      if (res?.error) {
        toast.error(res.error)
        setHasSub(!newStatus) // Revert on error
      } else {
        toast.success(newStatus ? "Abonnement activé pour ce membre" : "Abonnement retiré")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold border",
          isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
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
            : "bg-gray-50 text-gray-400 border-dashed border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 cursor-pointer"
        )}
        title={hasSub ? "Retirer l'abonnement" : "Activer l'abonnement"}
      >
        <Crown className={cn("size-3", hasSub ? "fill-amber-500 text-amber-600" : "")} />
        {hasSub ? "Abonné" : "Sans abonnement"}
      </button>
    </div>
  )
}
