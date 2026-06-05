'use client'

import { impersonateUser } from '@/app/actions/dev'
import { Button } from '@/components/ui/button'
import * as React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Users, User, ShieldCheck } from 'lucide-react'

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

  if (!mounted || process.env.NODE_ENV !== 'development') return null

  return (
    <div className="bg-white/90 backdrop-blur-md border border-zinc-200 rounded-xl shadow-2xl p-2 w-48 space-y-2">
      <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-100">
        <ShieldCheck className="size-3 text-zinc-900" />
        <h3 className="text-[9px] font-black uppercase tracking-tighter text-zinc-900">Dev</h3>
      </div>
      
      <div className="grid gap-1">
        <Button
          variant="outline"
          className="w-full text-[10px] justify-start h-7 rounded-lg border-zinc-100 px-2 font-medium"
          onClick={() => handleImpersonate('1139b2f2-19c6-48a8-a28a-e4da245af4e7', 'Martin')}
          disabled={loading}
        >
          👤 Martin
        </Button>
        <Button
          variant="outline"
          className="w-full text-[10px] justify-start h-7 rounded-lg border-zinc-100 px-2 font-medium"
          onClick={() => handleImpersonate('1b83657d-02fd-412b-8d06-a1e76f72bc49', '7k.say')}
          disabled={loading}
        >
          👤 7k.say
        </Button>

        <Button
          variant="outline"
          className="w-full text-[10px] justify-start h-7 rounded-lg border-zinc-100 px-2 font-medium"
          onClick={() => handleImpersonate('27c86c95-c50c-4c80-a6af-9abc49757044', 'Test')}
          disabled={loading}
        >
          👥 Test User
        </Button>
      </div>
    </div>
  )
}
