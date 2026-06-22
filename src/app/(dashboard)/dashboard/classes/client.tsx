'use client'

import { useState, useEffect } from 'react'
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
  studioName,
  studioSlug,
  currentMemberId 
}: { 
  initialClasses: Class[], 
  coaches: Coach[], 
  organizations: Organization[],
  userRole: string,
  studioName: string,
  studioSlug: string,
  currentMemberId: string 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const isStaff = ['owner', 'admin', 'coach'].includes(userRole)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // Initial check
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const events = initialClasses.map(c => ({
    id: c.id,
    title: c.title,
    start: c.starts_at,
    end: new Date(new Date(c.starts_at).getTime() + c.duration_min * 60000),
    backgroundColor: (c.is_cancelled ? '#9ca3af' : c.color) ?? undefined,
    borderColor: (c.is_cancelled ? '#9ca3af' : c.color) ?? undefined,
    extendedProps: {
      coach: c.org_members,
      is_cancelled: c.is_cancelled,
      studioName: (c as any).organizations?.name || studioName,
      studioSlug: (c as any).organizations?.slug || studioSlug,
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
    <div className="bg-card p-4 md:p-8 rounded-2xl md:rounded-[2rem] card-shadow border-none overflow-hidden">
      {isStaff && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto h-11 sm:h-10 rounded-xl"> Nouveau cours</Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="rounded-3xl max-w-md w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Créer un cours</DialogTitle>
              </DialogHeader>
              <form action={handleCreateClass} className="space-y-3 pt-2">
                {(organizations?.length ?? 0) > 1 && (
                  <div className="space-y-2 text-foreground">
                    <Label htmlFor="organization_id" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Studio</Label>
                    <select 
                      name="organization_id" 
                      defaultValue={organizations![0].id} 
                      required
                      className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                    >
                      {organizations!.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(organizations?.length ?? 0) === 1 && (
                  <input type="hidden" name="organization_id" value={organizations![0].id} />
                )}

                <div className="space-y-2 text-foreground">
                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Titre</Label>
                  <Input id="title" name="title" required placeholder="ex: Yoga" className="h-11 rounded-xl border-border/50 bg-card" />
                </div>
                
                <div className="space-y-2 text-foreground">
                  <Label htmlFor="coach_id" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Coach</Label>
                  <select 
                    name="coach_id" 
                    defaultValue={currentMemberId}
                    className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                  >
                    <option value="">Aucun coach</option>
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>{c.display_name || "Coach sans nom"}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="starts_at" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date et heure</Label>
                    <Input id="starts_at" name="starts_at" type="datetime-local" required className="h-11 rounded-xl border-border/50 bg-card text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_min" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Durée (min)</Label>
                    <Input id="duration_min" name="duration_min" type="number" defaultValue="60" required className="h-11 rounded-xl border-border/50 bg-card text-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Capacité</Label>
                    <Input id="capacity" name="capacity" type="number" defaultValue="15" required className="h-11 rounded-xl border-border/50 bg-card text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prix (€) - Optionnel</Label>
                    <Input id="price" name="price" type="number" step="0.50" min="0" placeholder="0 = Gratuit" className="h-11 rounded-xl border-border/50 bg-card text-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Couleur</Label>
                  <Input id="color" name="color" type="color" defaultValue="#4f46e5" className="h-11 p-1 w-full rounded-xl border-border/50 bg-card" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] mt-2 shadow-lg shadow-primary/10">Enregistrer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="calendar-container overflow-hidden">
        <FullCalendar
          key={isMobile ? 'mobile' : 'desktop'}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
          locale={frLocale}
          headerToolbar={{
            left: isMobile ? 'prev,next' : 'prev,next today',
            center: 'title',
            right: isMobile ? 'timeGridDay,timeGridWeek' : 'dayGridMonth,timeGridWeek,timeGridDay'
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
          const durationMin = eventInfo.event.end && eventInfo.event.start 
            ? (eventInfo.event.end.getTime() - eventInfo.event.start.getTime()) / 60000 
            : 60;
          const isShort = durationMin <= 45;

          return (
            <div className={`p-1 w-full h-full overflow-hidden flex ${isShort ? 'flex-row items-center justify-between gap-1' : 'flex-col gap-1'}`}>
              <div className="font-extrabold text-[9px] sm:text-[10px] uppercase tracking-tight leading-none truncate">
                {eventInfo.event.title}
              </div>
              {coach && (
                <div className="flex items-center gap-1 shrink-0">
                  <div className="size-4 sm:size-5 rounded-full bg-card/20 overflow-hidden flex items-center justify-center shrink-0 border border-white/20">
                    {coach.avatar_url ? (
                      <img src={coach.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-black text-primary-foreground uppercase">{coach.display_name?.charAt(0)}</span>
                    )}
                  </div>
                  {!isShort && (
                    <span className="text-[9px] font-bold text-primary-foreground/90 truncate uppercase tracking-tight leading-none">
                      {coach.display_name || "Coach sans nom"}
                    </span>
                  )}
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
