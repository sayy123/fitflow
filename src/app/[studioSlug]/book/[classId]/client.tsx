'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createBookingAction } from '@/app/actions/bookings'
import { signInWithGoogleAction } from '@/app/actions/auth'
import { CancelBookingButton } from '@/components/cancel-booking-button'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MapPin, ExternalLink, Calendar, Clock, ChevronLeft, CheckCircle2, UserCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BookingClientProps {
  org: {
    id: string
    name: string
    slug: string
    color_primary?: string | null
    payment_link?: string | null
    stripe_account_id?: string | null
    stripe_charges_enabled?: boolean | null
  }
  cls: {
    id: string
    title: string
    starts_at: Date | string
    duration_min: number
    capacity: number
    price?: number | null
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
  hasSubscription?: boolean
  isRemovedFromClass?: boolean
  isInactiveMember?: boolean
}

export default function BookingClient({ org, cls, currentUser, hasSubscription, isRemovedFromClass, isInactiveMember }: BookingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isInvite = searchParams.get('invite') === 'true'
  
  const [isPending, setIsPending] = useState(false)
  const [createAccount, setCreateAccount] = useState(isInvite && !currentUser)
  const [isAutoJoining, setIsAutoJoining] = useState(false)

  const isUserBooked = currentUser && cls.bookings.some((b) => b.studio_members.email === currentUser.email)
  const userBooking = isUserBooked ? cls.bookings.find((b) => b.studio_members.email === currentUser.email) : null

  const googleMapsUrl = cls.location 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cls.location)}`
    : null

  const isFull = cls.bookings.length >= cls.capacity
  const buttonColor = org.color_primary || '#10b981'
  const isStripeActive = org.stripe_account_id && org.stripe_charges_enabled;
  const hasPaymentMethod = org.payment_link || isStripeActive;
  const isPaid = cls.price && cls.price > 0 && hasPaymentMethod && !hasSubscription;

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    const res = await createBookingAction(formData)
    setIsPending(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.url) {
      window.location.href = res.url;
    } else {
      toast.success(res.status === 'confirmed' ? 'Réservation confirmée !' : 'Ajouté à la liste d\'attente')
      router.push('/dashboard')
    }
  }

  const handleAutoJoin = async () => {
    setIsAutoJoining(true)
    const { joinStudioAutomaticallyAction } = await import('@/app/actions/members')
    const res = await joinStudioAutomaticallyAction(org.id, cls.id)
    setIsAutoJoining(false)
    
    if (res.error) {
      toast.error(res.error)
    } else if (res.url) {
      window.location.href = res.url;
    } else {
      toast.success(res.bookingCreated ? 'Bienvenue ! Vous êtes maintenant inscrit à ce cours.' : 'Bienvenue dans le studio !')
      router.push('/dashboard')
    }
  }

  // --- VIEW FOR ALREADY BOOKED USER ---
  if (isUserBooked && userBooking) {
    return (
      <div className="max-w-3xl mx-auto pt-12 px-4">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ChevronLeft className="size-4 mr-1" /> Retour au tableau de bord
        </Link>
        
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-10 text-center border-b border-slate-100">
            <div className="mx-auto size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Réservation confirmée</h1>
            <p className="text-slate-500">Vous êtes inscrit pour ce cours chez {org.name}.</p>
          </div>
          
          <div className="p-8 md:p-10 bg-slate-50">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{cls.title}</h3>
              <div className="space-y-3 mt-4">
                <div className="flex items-center text-slate-600">
                  <Calendar className="size-5 mr-3 text-slate-400" />
                  {new Date(cls.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="flex items-center text-slate-600">
                  <Clock className="size-5 mr-3 text-slate-400" />
                  {new Date(cls.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({cls.duration_min} min)
                </div>
                {cls.location && (
                  <div className="flex items-start text-slate-600">
                    <MapPin className="size-5 mr-3 text-slate-400 shrink-0" />
                    <div>
                      <p>{cls.location}</p>
                      {googleMapsUrl && (
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline mt-1 block">
                          Ouvrir dans Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
              <div className="h-12 w-full">
                <CancelBookingButton bookingId={userBooking.id} />
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-slate-700 border-slate-200 hover:bg-slate-100 transition-colors">
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- BLOCKED VIEWS ---
  if (isInactiveMember) {
    return (
      <div className="max-w-3xl mx-auto pt-12 px-4 text-center">
        <div className="mx-auto size-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <UserCircle2 className="size-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Accès refusé</h1>
        <p className="text-slate-500 mb-8">Vous n'êtes plus autorisé à réserver dans ce studio.</p>
        <Link href={`/${org.slug}`}>
          <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
            Retour au planning
          </Button>
        </Link>
      </div>
    )
  }

  if (isRemovedFromClass) {
    return (
      <div className="max-w-3xl mx-auto pt-12 px-4 text-center">
        <div className="mx-auto size-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <Calendar className="size-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Réservation impossible</h1>
        <p className="text-slate-500 mb-8">Vous avez été retiré de ce cours par le gérant et ne pouvez plus le rejoindre.</p>
        <Link href={`/${org.slug}`}>
          <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
            Retour au planning
          </Button>
        </Link>
      </div>
    )
  }

  // --- BOOKING CHECKOUT VIEW ---
  return (
    <div className="max-w-6xl mx-auto pt-8 pb-24 px-4 md:px-8">
      {/* Top Bar */}
      <div className="mb-8">
        <Link href={`/${org.slug}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="size-4 mr-1" /> Retour au planning
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
        
        {/* Left Column: Checkout Form */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Finaliser la réservation</h1>
            <p className="text-slate-500">Vérifiez vos informations ci-dessous pour confirmer votre place.</p>
          </div>

          {currentUser ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Vos informations</h3>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="size-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <UserCircle2 className="size-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{currentUser.user_metadata?.full_name || 'Utilisateur'}</p>
                  <p className="text-sm text-slate-500">{currentUser.email}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Connecté</span>
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  onClick={handleAutoJoin}
                  disabled={isAutoJoining}
                  className="w-full h-14 rounded-xl text-white font-bold text-base shadow-md hover:shadow-lg transition-all"
                  style={{ backgroundColor: buttonColor }}
                >
                  {isAutoJoining ? "Réservation en cours..." : (isPaid ? `Réserver et payer ${cls.price}€` : "Confirmer la réservation")}
                </Button>
                {isPaid && (
                  <p className="text-xs text-slate-500 text-center mt-3">
                    Vous serez redirigé vers {isStripeActive ? 'notre page de paiement sécurisée' : 'une plateforme de paiement'}.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Vos informations</h3>
              
              <form action={handleSubmit} className="space-y-5">
                <input type="hidden" name="classId" value={cls.id} />
                <input type="hidden" name="organizationId" value={org.id} />
                
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-bold text-slate-700">Nom complet</Label>
                    <Input 
                      id="fullName" 
                      name="fullName" 
                      required 
                      placeholder="Jean Dupont" 
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="jean@email.com" 
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <Checkbox 
                      id="createAccount" 
                      checked={createAccount} 
                      onCheckedChange={(checked) => setCreateAccount(checked === true)} 
                      className="mt-0.5 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      style={{ backgroundColor: createAccount ? buttonColor : '', borderColor: createAccount ? buttonColor : '' }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="createAccount" className="text-sm font-bold text-slate-700 cursor-pointer">
                        Créer un compte Fitloww
                      </Label>
                      <p className="text-sm text-slate-500">Pour retrouver facilement vos réservations et annuler si besoin.</p>
                    </div>
                  </div>
                </div>

                {createAccount && (
                  <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="password" className="text-sm font-bold text-slate-700">Mot de passe</Label>
                    <Input id="password" name="password" type="password" required={createAccount} placeholder="••••••••" className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white" />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-start space-x-3">
                    <Checkbox id="terms" name="terms" required className="mt-1 border-slate-300" />
                    <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                      J'accepte les <Link href="/legal" target="_blank" className="text-slate-900 underline hover:text-primary transition-colors">Mentions Légales</Link> et la politique de confidentialité de Fitloww.
                    </label>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-xl text-white font-bold text-base shadow-md hover:shadow-lg transition-all" 
                    disabled={isPending}
                    style={{ backgroundColor: buttonColor }}
                  >
                    {isPending ? 'Réservation en cours...' : (isFull ? 'Rejoindre la liste d\'attente' : (isPaid ? `Réserver et payer ${cls.price}€` : 'Confirmer la réservation'))}
                  </Button>
                  
                  {isPaid && (
                    <p className="text-xs text-slate-500 text-center mt-3">
                      Vous serez redirigé vers {isStripeActive ? 'notre page de paiement sécurisée' : 'une plateforme de paiement'}.
                    </p>
                  )}
                </div>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span className="bg-white px-4">Déjà un compte ?</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                onClick={() => signInWithGoogleAction()}
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Se connecter avec Google
              </Button>

            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-8">
          <div className="h-32 w-full bg-slate-100 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-50" />
            <div className="absolute bottom-4 left-6">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold rounded-lg shadow-sm">
                {org.name}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">{cls.title}</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start text-slate-600">
                <Calendar className="size-5 mr-3 text-slate-400 shrink-0" />
                <div className="leading-snug">
                  <p className="font-bold text-slate-900">{new Date(cls.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <p className="text-sm text-slate-500">{new Date(cls.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {cls.duration_min} minutes</p>
                </div>
              </div>
              
              {cls.location && (
                <div className="flex items-start text-slate-600">
                  <MapPin className="size-5 mr-3 text-slate-400 shrink-0" />
                  <p className="leading-snug">{cls.location}</p>
                </div>
              )}
            </div>

            {cls.org_members && (
              <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                <div className="size-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                  {cls.org_members.avatar_url ? (
                    <img src={cls.org_members.avatar_url} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-slate-400">{cls.org_members.display_name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coach</p>
                  <p className="font-bold text-slate-900">{cls.org_members.display_name}</p>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Total à payer</span>
                <span className="text-xl font-black text-slate-900">
                  {cls.price && cls.price > 0 && !hasSubscription ? `${cls.price}€` : 'Gratuit'}
                </span>
              </div>
              {hasSubscription && cls.price && cls.price > 0 && (
                <p className="text-xs text-green-600 font-bold mt-1 text-right">Inclus dans votre abonnement</p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
