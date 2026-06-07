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

type Organization = {
  id: string;
  name: string;
  slug: string;
}

export default function ClassesClient({ 
  initialClasses, 
  coaches, 
  organizations,
  userRole,
  studioSlug,
  currentMemberId 
}: { 
  initialClasses: Class[], 
  coaches: Coach[], 
  organizations: Organization[],
  userRole: string,
  studioSlug: string,
  currentMemberId: string 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isStaff = ['owner', 'admin', 'coach'].includes(userRole)

  const events = initialClasses.map(c => ({
    id: c.id,
    title: c.title,
    start: c.starts_at,
    end: new Date(new Date(c.starts_at).getTime() + c.duration_min * 60000),
    backgroundColor: (c.is_cancelled ? '#9ca3af' : c.color) ?? undefined,
    borderColor: (c.is_cancelled ? '#9ca3af' : c.color) ?? undefined,
    extendedProps: {
      coach: c.org_members,
      studioSlug: (c as any).organizations?.slug
    }
  }))

  async function handleCreateClass(formData: FormData) {
    const data = {
      title: formData.get('title') as string,
      starts_at: new Date(formData.get('starts_at') as string).toISOString(),
      duration_min: parseInt(formData.get('duration_min') as string),
      capacity: parseInt(formData.get('capacity') as string),
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
      color: formData.get('color') as string || '#4f46e5',
      location: formData.get('location') as string || '',
      coach_id: formData.get('coach_id') === "" ? null : (formData.get('coach_id') as string),
      organization_id: formData.get('organization_id') as string,
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
    <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] card-shadow border-none overflow-hidden">
      {isStaff && (
        <div className="mb-6 flex justify-end">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger render={<Button className="w-full sm:w-auto h-11 sm:h-10 rounded-xl"> Nouveau cours</Button>} />
            <DialogContent className="rounded-3xl max-w-md w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-zinc-900">Créer un cours</DialogTitle>
              </DialogHeader>
              <form action={handleCreateClass} className="space-y-4 pt-4">
                {(organizations?.length ?? 0) > 1 && (
                  <div className="space-y-2 text-zinc-900">
                    <Label htmlFor="organization_id" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Studio</Label>
                    <Select name="organization_id" defaultValue={organizations![0].id} required>
                      <SelectTrigger className="rounded-xl border-zinc-100 h-11 bg-white">
                        <SelectValue placeholder="Choisir un studio" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-zinc-900">
                        {organizations!.map(org => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(organizations?.length ?? 0) === 1 && (
                  <input type="hidden" name="organization_id" value={organizations![0].id} />
                )}

                <div className="space-y-2 text-zinc-900">
                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Titre</Label>
                  <Input id="title" name="title" required placeholder="ex: Yoga" className="h-11 rounded-xl border-zinc-100 bg-white" />
                </div>
                
                <div className="space-y-2 text-zinc-900">
                  <Label htmlFor="coach_id" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Coach</Label>
                  <Select name="coach_id" defaultValue={currentMemberId}>
                    <SelectTrigger className="rounded-xl border-zinc-100 h-11 bg-white">
                      <SelectValue placeholder="Choisir un coach" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-zinc-900">
                      <SelectItem value="">Aucun coach</SelectItem>
                      {coaches.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="starts_at" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Date et heure</Label>
                    <Input id="starts_at" name="starts_at" type="datetime-local" required className="h-11 rounded-xl border-zinc-100 bg-white text-zinc-900" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_min" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Durée (min)</Label>
                    <Input id="duration_min" name="duration_min" type="number" defaultValue="60" required className="h-11 rounded-xl border-zinc-100 bg-white text-zinc-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Capacité</Label>
                    <Input id="capacity" name="capacity" type="number" defaultValue="15" required className="h-11 rounded-xl border-zinc-100 bg-white text-zinc-900" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Couleur</Label>
                    <Input id="color" name="color" type="color" defaultValue="#4f46e5" className="h-11 p-1 rounded-xl border-zinc-100 bg-white" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] mt-2 shadow-lg shadow-zinc-900/10">Enregistrer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="calendar-container overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={window?.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek'}
          locale={frLocale}
          headerToolbar={{
            left: window?.innerWidth < 768 ? 'prev,next' : 'prev,next today',
            center: 'title',
            right: window?.innerWidth < 768 ? 'timeGridDay,timeGridWeek' : 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
        events={events}
        allDaySlot={false}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="01:00:00"
        height="1200px"
        expandRows={true}
        handleWindowResize={true}
        eventContent={(eventInfo) => {
          const coach = eventInfo.event.extendedProps.coach
          return (
            <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
              <div className="font-extrabold text-xs md:text-sm uppercase tracking-tight leading-snug">
                {eventInfo.event.title}
              </div>
              {coach && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="size-6 rounded-md bg-white/20 overflow-hidden flex items-center justify-center shrink-0 border border-white/20">
                    {coach.avatar_url ? (
                      <img src={coach.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-black text-white uppercase">{coach.display_name?.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-white/90 truncate uppercase tracking-tight">
                    {coach.display_name}
                  </span>
                </div>
              )}
            </div>
          )
        }}
        eventClick={(info) => {
          const slug = info.event.extendedProps.studioSlug || studioSlug
          if (isStaff) {
            window.location.href = `/dashboard/classes/${info.event.id}`
          } else {
            window.location.href = `/${slug}/book/${info.event.id}`
          }
        }}
      />
      </div>
    </div>
  )
}
      const slug = info.event.extendedProps.studioSlug || studioSlug
          if (isStaff) {
            window.location.href = `/dashboard/classes/${info.event.id}`
          } else {
            window.location.href = `/${slug}/book/${info.event.id}`
          }
        }}
      />
      </div>
    </div>
  )
}
