'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Trash2, Edit2, Share2, ExternalLink, Calendar, Clock, User } from 'lucide-react'
import { deleteBookingAction } from '@/app/actions/bookings'
import { updateClassAction, deleteClassAction } from '@/app/actions/classes'
import { toast } from 'sonner'
import Link from 'next/link'
import InviteButton from './invite-button'

type Coach = {
  id: string;
  display_name: string | null;
}

type Booking = {
  id: string;
  status: string;
  created_at: string | Date | null;
  studio_members: {
    full_name: string;
    email: string;
  }
}

type ClassWithDetails = {
  id: string;
  title: string;
  starts_at: string | Date;
  location: string | null;
  capacity: number;
  duration_min: number;
  coach_id: string | null;
  bookings: Booking[];
  org_members?: {
    avatar_url: string | null;
    display_name: string | null;
  } | null;
  organizations: {
    name: string;
  };
}

export default function ClassDetailClient({ 
  cls, 
  inviteLink, 
  coaches,
  userRole 
}: { 
  cls: ClassWithDetails, 
  inviteLink: string, 
  coaches: Coach[],
  userRole: string 
}) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const isManagementAllowed = ['owner', 'admin'].includes(userRole)

  async function handleDeleteBooking(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cette réservation ?')) return
    setIsDeleting(id)
    try {
      await deleteBookingAction(id)
      toast.success('Réservation supprimée')
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(null)
    }
  }

  async function handleUpdateClass(formData: FormData) {
    const startsAtStr = formData.get('starts_at') as string
    const data = {
      title: formData.get('title') as string,
      location: formData.get('location') as string,
      capacity: parseInt(formData.get('capacity') as string),
      starts_at: new Date(startsAtStr).toISOString(),
      duration_min: parseInt(formData.get('duration_min') as string),
      coach_id: formData.get('coach_id') as string || null,
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    }

    try {
      await updateClassAction(cls.id, data)
      setIsEditOpen(false)
      toast.success('Cours mis à jour')
      window.location.reload()
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  async function handleDeleteClass() {
    if (!confirm('Voulez-vous vraiment supprimer ce cours ? Cette action est irréversible.')) return

    try {
      await deleteClassAction(cls.id)
      toast.success('Cours supprimé avec succès')
      router.push('/dashboard/classes')
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const googleMapsUrl = cls.location 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cls.location)}`
    : null

  // Format the date for the datetime-local input (YYYY-MM-DDTHH:mm) in local time
  let defaultStartsAt = ''
  try {
    const dateObj = new Date(cls.starts_at)
    if (!isNaN(dateObj.getTime())) {
      defaultStartsAt = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
    }
  } catch (e) {
    // Silently fallback if date is invalid
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/dashboard/classes" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline mb-2 block">← Retour au planning</Link>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{cls.title}</h2>
          <p className="text-sm font-medium text-gray-500">
            {new Date(cls.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {new Date(cls.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InviteButton inviteLink={inviteLink} />
          
          {isManagementAllowed && (
            <>
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger
                  render={
                    <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold text-xs uppercase tracking-widest border-gray-100 hover:bg-gray-50 transition-all">
                      <Edit2 className="size-3.5 mr-2" /> Modifier
                    </Button>
                  }
                />
                <DialogContent className="rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black tracking-tight">Modifier le cours</DialogTitle>
                  </DialogHeader>
                  <form action={handleUpdateClass} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Titre</Label>
                      <Input id="title" name="title" defaultValue={cls.title} className="rounded-xl h-11" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="coach_id" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Coach assigné</Label>
                      <Select name="coach_id" defaultValue={cls.coach_id || ""}>
                        <SelectTrigger className="rounded-xl border-gray-100 h-11">
                          <SelectValue placeholder="Choisir un coach" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="">Aucun coach</SelectItem>
                          {coaches.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="starts_at" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date et heure</Label>
                        <Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={defaultStartsAt} className="rounded-xl h-11" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration_min" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Durée (min)</Label>
                        <Input id="duration_min" name="duration_min" type="number" defaultValue={cls.duration_min} className="rounded-xl h-11" required min="15" max="240" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Adresse / Lieu</Label>
                      <Input id="location" name="location" defaultValue={cls.location || ''} placeholder="ex: 12 rue du sport, Paris" className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capacité max</Label>
                      <Input id="capacity" name="capacity" type="number" defaultValue={cls.capacity} className="rounded-xl h-11" required />
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="w-full rounded-xl h-11 font-black uppercase tracking-widest text-[10px]">Enregistrer les modifications</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleDeleteClass} className="rounded-xl h-9 px-4 font-bold text-xs uppercase tracking-widest text-red-600 border-red-50 hover:bg-red-50 transition-all">
                <Trash2 className="size-3.5 mr-2" /> Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none card-shadow rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{cls.bookings.length} / {cls.capacity}</div>
            <p className="text-[10px] font-bold text-gray-400 mt-1">{cls.capacity - cls.bookings.length} places libres</p>
          </CardContent>
        </Card>
        <Card className="border-none card-shadow rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm font-black text-[10px] text-primary uppercase">
                    {cls.org_members?.avatar_url ? (
                        <img src={cls.org_members.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                        cls.org_members?.display_name?.charAt(0) || '?'
                    )}
                </div>
                <div>
                    <div className="text-lg font-black text-gray-900 tracking-tight leading-none truncate uppercase">{cls.org_members?.display_name || 'Non assigné'}</div>
                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Équipe {cls.organizations.name}</p>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none card-shadow rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lieu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900 truncate">{cls.location || 'Studio'}</div>
            {googleMapsUrl ? (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline mt-1 flex items-center gap-1">
                <MapPin className="size-3" /> Voir sur Google Maps <ExternalLink className="size-2.5" />
              </a>
            ) : (
              <p className="text-[10px] font-bold text-gray-400 mt-1">Pas d'adresse spécifiée</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none card-shadow rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between py-6 px-8">
          <CardTitle className="text-sm font-black uppercase tracking-widest">Réservations ({cls.bookings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Membre</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</TableHead>
                {isManagementAllowed && (
                  <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cls.bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isManagementAllowed ? 5 : 4} className="text-center text-gray-400 py-12 text-sm italic">Aucune réservation pour le moment.</TableCell>
                </TableRow>
              ) : (
                cls.bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50/50 transition-colors border-gray-50">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm font-black text-[10px] text-primary uppercase">
                        {booking.studio_members?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-900">{booking.studio_members?.full_name || 'Inconnu'}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{booking.studio_members?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </TableCell>
                    <TableCell className="text-sm text-gray-500 font-medium">{booking.studio_members.email}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        booking.status === 'confirmed' ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      )}>
                        {booking.status === 'confirmed' ? 'Confirmé' : 'Attente'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-400 font-bold">{new Date(booking.created_at!).toLocaleDateString('fr-FR')}</TableCell>
                    {isManagementAllowed && (
                      <TableCell className="px-8 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-lg size-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteBooking(booking.id)}
                          disabled={isDeleting === booking.id}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
g(booking.id)}
                          disabled={isDeleting === booking.id}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
