'use client'

import { Button } from "@/components/ui/button"
import { memberSelfCancelBookingAction } from "@/app/actions/bookings"
import { toast } from "sonner"
import { useState } from "react"

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [isPending, setIsPending] = useState(false)

  return (
    <Button 
      variant="outline" 
      disabled={isPending}
      onClick={async () => {
        if (window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
          setIsPending(true)
          const res = await memberSelfCancelBookingAction(bookingId)
          if (res?.error) {
            toast.error(res.error)
            setIsPending(false)
          } else {
            toast.success("Réservation annulée")
          }
        }
      }}
      className="w-full h-9 rounded-lg font-bold text-[10px] uppercase tracking-widest border-border text-foreground/80 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
    >
      {isPending ? "Annulation..." : "Annuler"}
    </Button>
  )
}
