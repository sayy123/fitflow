'use client'

import { impersonateUser, updateTestSubscriptionStatus } from '@/app/actions/dev'
import { Button } from '@/components/ui/button'
import * as React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Users, User, ShieldCheck, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'

export function DevTools() {
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleImpersonate = async (userId: string, label: string) => {
    setLoading(true)
    const toastId = toast.loading(`Connexion en tant que ${label}...`)
    try {
      const result = await impersonateUser(userId)
      if (result?.error) {
        toast.error(result.error, { id: toastId })
      } else {
        toast.success(`Connecté en tant que ${label}`, { id: toastId })
        window.location.reload()
      }
    } catch (err) {
      toast.error("Erreur de connexion", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    setLoading(true)
    const toastId = toast.loading(`Mise à jour du statut vers ${status}...`)
    try {
      const result = await updateTestSubscriptionStatus(status)
      if (result?.error) {
        toast.error(result.error, { id: toastId })
      } else {
        toast.success(`Statut mis à jour : ${status}`, { id: toastId })
        window.location.reload()
      }
    } catch (err) {
      toast.error("Erreur lors de la mise à jour", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-2xl p-2 w-48 space-y-3">
      <div className="flex items-center gap-1.5 pb-1 border-b border-border/50">
        <ShieldCheck className="size-3 text-foreground" />
        <h3 className="text-[9px] font-black uppercase tracking-tighter text-foreground">Dev Tools</h3>
      </div>
      
      <div className="space-y-1">
        <p className="text-[8px] font-bold text-muted-foreground uppercase px-1">Impersonate</p>
        <div className="grid gap-1">
          <Button
            variant="outline"
            className="w-full text-[10px] justify-start h-7 rounded-lg border-border/50 px-2 font-medium"
            onClick={() => handleImpersonate('1139b2f2-19c6-48a8-a28a-e4da245af4e7', 'Martin')}
            disabled={loading}
          >
            👤 Martin
          </Button>
          <Button
            variant="outline"
            className="w-full text-[10px] justify-start h-7 rounded-lg border-border/50 px-2 font-medium"
            onClick={() => handleImpersonate('1b83657d-02fd-412b-8d06-a1e76f72bc49', '7k.say')}
            disabled={loading}
          >
            👤 7k.say
          </Button>
        </div>
      </div>

      <div className="space-y-1 pt-1 border-t border-border/50">
        <p className="text-[8px] font-bold text-muted-foreground uppercase px-1">Subscription Status</p>
        <div className="grid gap-1">
          <Button
            variant="outline"
            className="w-full text-[10px] justify-start h-7 rounded-lg border-emerald-100 bg-emerald-50 text-emerald-700 px-2 font-bold"
            onClick={() => handleUpdateStatus('active')}
            disabled={loading}
          >
            <CheckCircle2 className="size-3 mr-1" /> Active
          </Button>
          <Button
            variant="outline"
            className="w-full text-[10px] justify-start h-7 rounded-lg border-border/50 px-2 font-medium"
            onClick={() => handleUpdateStatus('trialing')}
            disabled={loading}
          >
            <Zap className="size-3 mr-1" /> Trialing
          </Button>
          <Button
            variant="outline"
            className="w-full text-[10px] justify-start h-7 rounded-lg border-amber-100 bg-amber-50 text-amber-700 px-2 font-bold"
            onClick={() => handleUpdateStatus('past_due')}
            disabled={loading}
          >
            <AlertTriangle className="size-3 mr-1" /> Expired (Block)
          </Button>
          <Button
            variant="outline"
            className="w-full text-[10px] justify-start h-7 rounded-lg border-red-100 bg-red-50 text-red-700 px-2 font-bold"
            onClick={() => handleUpdateStatus('unpaid')}
            disabled={loading}
          >
            <AlertTriangle className="size-3 mr-1" /> Unpaid (Block)
          </Button>
        </div>
      </div>
    </div>
  )
}
