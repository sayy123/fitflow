'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createBookingAction } from '@/app/actions/bookings'
import { signInWithGoogleAction } from '@/app/actions/auth'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MapPin, ExternalLink, Calendar, Clock } from 'lucide-react'

import { useRouter } from 'next/navigation'

interface BookingClientProps {
  org: {
    id: string
    name: string
    slug: string
    color_primary?: string | null
  }
  cls: {
    id: string
    title: string
    starts_at: Date | string
    duration_min: number
    capacity: number
    location?: string | null
    org_members?: {
      display_name: string
      avatar_url?: string | null
    } | null
    bookings: {
      id: string
      status: string
      studio_members: {
        email: string
        full_name: string
        avatar_url?: string | null
      }
    }[]
  }
  currentUser?: {
    email: string
    user_metadata?: {
      full_name?: string | null
    }
  } | null
}

export default function BookingClient({ org, cls, currentUser }: BookingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isInvite = searchParams.get('invite') === 'true'
  
  const [isPending, setIsPending] = useState(false)
  const [createAccount, setCreateAccount] = useState(isInvite && !currentUser)

  const isUserBooked = currentUser && cls.bookings.some((b) => b.studio_members.email === currentUser.email)
  const userBooking = isUserBooked ? cls.bookings.find((b) => b.studio_members.email === currentUser.email) : null

  const googleMapsUrl = cls.location 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cls.location)}`
    : null

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    const res = await createBookingAction(formData)
    setIsPending(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.status === 'confirmed' ? 'Réservation confirmée !' : 'Ajouté à la liste d\'attente')
      router.push('/dashboard')
    }
  }

  const isFull = cls.bookings.length >= cls.capacity

  if (isUserBooked && userBooking) {
    return (
      <Card className="w-full max-w-lg border-none card-shadow rounded-2xl overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: org.color_primary || '#4f46e5' }} />
        <CardHeader className="p-8 pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight">Détails de la séance</CardTitle>
              <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">
                {cls.title} • {org.name}
              </CardDescription>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
              userBooking.status === 'confirmed' ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
            )}>
              {userBooking.status === 'confirmed' ? 'Confirmé' : 'En en attente'}
            </span>
          </div>
          {cls.org_members && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="size-8 rounded-lg bg-white border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm font-black text-[9px] text-primary uppercase">
                    {cls.org_members.avatar_url ? (
                        <img src={cls.org_members.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                        cls.org_members.display_name.charAt(0)
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Coach de la séance</p>
                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{cls.org_members.display_name}</p>
                </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-8">
          <div className="grid grid-cols-1 gap-3 p-5 bg-gray-50 rounded-2xl">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="size-4 text-gray-400" />
              {new Date(cls.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-sm font-bold text-gray-900 flex items-center gap-3">
              <Clock className="size-4 text-gray-400" />
              {new Date(cls.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({cls.duration_min} min)
            </p>
            {cls.location && (
              <div className="flex flex-col gap-1 pl-7">
                <div className="text-sm font-bold text-gray-900 flex items-center gap-3 -ml-7">
                  <MapPin className="size-4 text-gray-400" />
                  {cls.location}
                </div>
                {googleMapsUrl && (
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                    Ouvrir dans Google Maps <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Participants ({cls.bookings.length} / {cls.capacity})</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cls.bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-50 card-shadow text-xs font-bold text-gray-700">
                  <div className="size-6 rounded-lg border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm font-black text-[8px] text-primary uppercase bg-gray-50">
                    {b.studio_members.avatar_url ? (
                        <img src={b.studio_members.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                        b.studio_members.full_name.charAt(0)
                    )}
                  </div>
                  <span className="truncate">{b.studio_members.full_name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border-gray-100 hover:bg-gray-50 transition-all">
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg border-none card-shadow rounded-2xl overflow-hidden">
      <div className="h-2 w-full" style={{ backgroundColor: org.color_primary || '#4f46e5' }} />
      <CardHeader className="p-8 pb-4 text-center">
        <CardTitle className="text-2xl font-black tracking-tight">{isInvite ? 'Invitation' : 'Réserver une séance'}</CardTitle>
        <div className="mt-3 space-y-1">
          <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">
            {cls.title} • {new Date(cls.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {new Date(cls.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </CardDescription>
          {cls.location && (
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="size-3" /> {cls.location}
              </span>
              {googleMapsUrl && (
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1 mt-0.5">
                  Voir sur Google Maps <ExternalLink className="size-2" />
                </a>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        {isInvite && !currentUser && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-xl text-[10px] font-bold text-primary flex items-center gap-3">
            <span className="text-lg">✨</span>
            Vous avez été invité ! Créez un compte pour suivre vos séances.
          </div>
        )}

        {currentUser && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-[10px] font-bold text-green-800 flex items-center gap-3">
            <span className="text-lg">👤</span>
            Connecté en tant que {currentUser.email}
          </div>
        )}

        {isFull && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-[10px] font-bold text-yellow-800 flex items-center gap-3">
            <span className="text-lg">⏳</span>
            Ce cours est complet. Rejoignez la liste d'attente.
          </div>
        )}

        {isInvite && !currentUser && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              className="w-full h-11 rounded-xl font-bold border-gray-100 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
              onClick={() => signInWithGoogleAction()}
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              S'enregistrer avec Google
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-[8px] uppercase tracking-widest font-bold">
                <span className="bg-white px-3 text-gray-400">Ou via email</span>
              </div>
            </div>
          </div>
        )}
        
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="classId" value={cls.id} />
          <input type="hidden" name="organizationId" value={org.id} />
          
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Nom complet</Label>
            <Input 
              id="fullName" 
              name="fullName" 
              required 
              placeholder="ex: Jean Dupont" 
              defaultValue={currentUser?.user_metadata?.full_name || ''} 
              className="h-11 rounded-xl border-gray-100 focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              required 
              placeholder="ex: jean@email.com" 
              defaultValue={currentUser?.email || ''}
              readOnly={!!currentUser}
              className={cn("h-11 rounded-xl border-gray-100 focus:ring-primary/20", currentUser ? 'bg-gray-50' : '')}
            />
          </div>

          {!currentUser && (
            <div className="flex items-center space-x-3 py-1 px-1">
              <Checkbox 
                id="createAccount" 
                checked={createAccount} 
                onCheckedChange={(checked) => setCreateAccount(checked === true)} 
                className="size-4 rounded-md border-gray-200"
              />
              <Label htmlFor="createAccount" className="text-[11px] font-bold text-gray-600 cursor-pointer">
                Créer un compte pour suivre mes séances
              </Label>
            </div>
          )}

          {createAccount && !currentUser && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="password" title="Mot de passe" className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Mot de passe</Label>
              <Input id="password" name="password" type="password" required={createAccount} placeholder="••••••••" className="h-11 rounded-xl border-gray-100" />
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all mt-2" 
            disabled={isPending}
            style={{ 
              backgroundColor: org.color_primary || '#4f46e5',
              boxShadow: `0 8px 24px -6px ${org.color_primary}40`
            }}
          >
            {isPending ? 'Réservation...' : (isFull ? 'Rejoindre la liste d\'attente' : 'Confirmer la réservation')}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Link href={`/${org.slug}`} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Annuler</Link>
        </div>
      </CardContent>
    </Card>
  )
}
