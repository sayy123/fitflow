'use client'

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClassAction } from '@/app/actions/classes'
import { toast } from 'sonner'

type Coach = {
  id: string;
  display_name: string | null;
  avatar_url?: string | null;
}

type Class = {
  id: string;
  title: string;
  starts_at: string | Date;
  duration_min: number;
  is_cancelled?: boolean | null;
  color?: string | null;
  org_members?: Coach | null;
}

export default function ClassesClient({ 
  initialClasses, 
  coaches, 
  userRole,
  studioSlug,
  currentMemberId 
}: { 
  initialClasses: Class[], 
  coaches: Coach[], 
  userRole: string,
  studioSlug: string,
  currentMemberId: string 
}) {
  const [classes, setClasses] = useState(initialClasses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const isStaff = ['owner', 'admin', 'coach'].includes(userRole)

  const events = classes.map(c => ({
    id: c.id,
    title: c.title,
    start: c.starts_at,
    end: new Date(new Date(c.starts_at).getTime() + c.duration_min * 60000),
    backgroundColor: (c.is_cancelled ? '#9ca3af' : c.color) ?? undefined,
    borderColor: (c.is_cancelled ? '#9ca3af' : c.color) ?? undefined,
    extendedProps: {
      coach: c.org_members
    }
  }))

  async function handleCreateClass(formData: FormData) {
    const data = {
      title: formData.get('title') as string,
      starts_at: new Date(formData.get('starts_at') as string).toISOString(),
      duration_min: parseInt(formData.get('duration_min') as string),
      capacity: parseInt(formData.get('capacity') as string),
      color: formData.get('color') as string || '#4f46e5',
      location: formData.get('location') as string || '',
      coach_id: formData.get('coach_id') === "" ? null : (formData.get('coach_id') as string),
    }

    try {
      const result = await createClassAction(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        setIsModalOpen(false)
        toast.success('Le cours a été ajouté au planning.')
        window.location.reload() 
      }
    } catch (error) {
      toast.error('Impossible de créer le cours.')
    }
  }

  return (
    <div className="bg-white p-8 rounded-[2rem] card-shadow border-none overflow-hidden">
      {isStaff && (
        <div className="mb-4 flex justify-end">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger render={<Button>+ Nouveau cours</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau cours</DialogTitle>
              </DialogHeader>
              <form action={handleCreateClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input id="title" name="title" required placeholder="ex: Yoga Vinyasa" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="coach_id">Coach assigné</Label>
                  <Select name="coach_id" defaultValue={currentMemberId}>
                    <SelectTrigger className="rounded-xl border-gray-100">
                      <SelectValue placeholder="Choisir un coach" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun coach</SelectItem>
                      {coaches.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="starts_at">Date et heure</Label>
                    <Input id="starts_at" name="starts_at" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_min">Durée (min)</Label>
                    <Input id="duration_min" name="duration_min" type="number" defaultValue="60" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacité</Label>
                    <Input id="capacity" name="capacity" type="number" defaultValue="15" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Couleur</Label>
                    <Input id="color" name="color" type="color" defaultValue="#4f46e5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lieu / Adresse</Label>
                  <Input id="location" name="location" placeholder="ex: 12 rue du sport, Paris (Optionnel)" />
                </div>
                <Button type="submit" className="w-full">Enregistrer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={frLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="25:00:00"
        height="auto"
        eventContent={(eventInfo) => {
          const coach = eventInfo.event.extendedProps.coach
          return (
            <div className="p-1 h-full flex flex-col justify-between overflow-hidden">
              <div className="font-black text-[10px] uppercase tracking-tight leading-tight truncate">
                {eventInfo.event.title}
              </div>
              {coach && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="size-5 rounded-md bg-white/20 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                    {coach.avatar_url ? (
                      <img src={coach.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-black text-white uppercase">{coach.display_name?.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-white/90 truncate uppercase tracking-tighter">
                    {coach.display_name}
                  </span>
                </div>
              )}
            </div>
          )
        }}
        eventClick={(info) => {
          if (isStaff) {
            window.location.href = `/dashboard/classes/${info.event.id}`
          } else {
            window.location.href = `/${studioSlug}/book/${info.event.id}`
          }
        }}
      />
    </div>
  )
}
