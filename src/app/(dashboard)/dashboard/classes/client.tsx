'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, addWeeks, subWeeks, format, isSameDay, parseISO, startOfDay, getHours, getMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClassAction } from '@/app/actions/classes'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'

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
  const isStaff = ['owner', 'admin', 'coach'].includes(userRole)

  // Set the start of the week to Monday
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  const handleCreateClass = async (formData: FormData) => {
    const data = {
      title: formData.get('title') as string,
      starts_at: new Date(formData.get('starts_at') as string).toISOString(),
      duration_min: parseInt(formData.get('duration_min') as string),
      capacity: parseInt(formData.get('capacity') as string),
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
      color: formData.get('color') as string || '#2aa298', // Default to a teal matching the design
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

  const prevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1))
  const nextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1))

  // Generate the 7 days of the current week
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  // Dynamic Calendar configuration
  const weekClasses = initialClasses.filter(c => {
    const classDate = typeof c.starts_at === 'string' ? parseISO(c.starts_at) : c.starts_at
    return classDate >= currentWeekStart && classDate < addWeeks(currentWeekStart, 1)
  })

  // Find the earliest hour of the week to reduce empty space at the top
  const earliestHour = weekClasses.length > 0 
    ? Math.min(...weekClasses.map(c => getHours(typeof c.starts_at === 'string' ? parseISO(c.starts_at) : c.starts_at)))
    : 8;

  const maxClassEndHour = weekClasses.length > 0 
    ? Math.max(...weekClasses.map(c => {
        const classDate = typeof c.starts_at === 'string' ? parseISO(c.starts_at) : c.starts_at;
        return getHours(classDate) + Math.ceil((getMinutes(classDate) + c.duration_min) / 60);
      }))
    : 22;

  const PIXELS_PER_HOUR = 40 // 1 hour = 40px
  const MIN_HOUR = Math.max(0, earliestHour - 1) // Start 1 hour before the earliest class
  const MAX_HOUR = Math.max(23, maxClassEndHour + 1) // Ensure we have enough space for the latest class
  const TOTAL_HOURS = MAX_HOUR - MIN_HOUR
  const GRID_HEIGHT = TOTAL_HOURS * PIXELS_PER_HOUR

  const getEventStyle = (eventStart: Date | string, durationMin: number) => {
    const start = typeof eventStart === 'string' ? parseISO(eventStart) : eventStart
    const hours = getHours(start)
    const minutes = getMinutes(start)
    const absoluteMinutes = (hours - MIN_HOUR) * 60 + minutes
    const top = (absoluteMinutes / 60) * PIXELS_PER_HOUR
    const height = (durationMin / 60) * PIXELS_PER_HOUR

    return { top, height }
  }

  // Fallback colors resembling the provided image
  const defaultColors = ['#a0e1d9', '#2aa298', '#9d63c5'] // light teal, dark teal, purple
  const getDefaultColor = (title: string) => {
    if (title.toLowerCase().includes('yoga') || title.toLowerCase().includes('apéro')) return defaultColors[2] // Purple
    if (title.toLowerCase().includes('intermédiaire')) return defaultColors[1] // Dark teal
    return defaultColors[1] // Default dark teal
  }

  return (
    <div className="bg-white min-h-screen font-sans max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Tabs Row */}
      <div className="flex border-b border-gray-200 mb-6 w-full relative">
        <div className="flex gap-8">
          <div className="pb-3 border-b-2 border-green-600 text-[15px] font-medium text-gray-900 cursor-pointer">Planning</div>
        </div>
        
        {isStaff && (
          <div className="absolute right-0 top-0 -translate-y-2">
            <Button onClick={() => setIsModalOpen(true)} className="h-9 px-4 rounded bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm">Nouveau cours</Button>
          </div>
        )}
      </div>

      {/* Header: Month and Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-8">
        <h2 className="text-[26px] font-normal text-gray-900 min-w-[120px] capitalize">
          {format(currentWeekStart, 'MMMM yyyy', { locale: fr })}
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-[38px] px-3 bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-md shadow-sm transition-colors" 
            onClick={prevWeek}
          >
            <ChevronLeft className="w-[14px] h-[14px] mr-1" />
            <span className="text-[13px] font-medium">Semaine dernière</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-[38px] px-3 bg-white border-gray-200 text-gray-800 hover:bg-gray-50 rounded-md shadow-sm transition-colors" 
            onClick={nextWeek}
          >
            <span className="text-[13px] font-medium">Semaine prochaine</span>
            <ChevronRight className="w-[14px] h-[14px] ml-1" />
          </Button>
        </div>
      </div>

      {/* Desktop Calendar Grid */}
      <div className="hidden md:block w-full overflow-x-auto pb-8" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-7 gap-2 lg:gap-3 min-w-[800px] lg:min-w-full">
          {days.map(day => {
            // Filter classes for this day
            const dayClasses = initialClasses.filter(c => {
              const classDate = typeof c.starts_at === 'string' ? parseISO(c.starts_at) : c.starts_at
              return isSameDay(classDate, day)
            })

            return (
              <div key={day.toISOString()} className="flex flex-col min-w-[110px] lg:min-w-0">
                {/* Day Header */}
                <div className="text-center mb-6">
                  <div className="text-[13px] font-medium text-gray-500 lowercase">
                    {format(day, 'E.', { locale: fr })}
                  </div>
                  <div className="text-[22px] font-bold text-gray-900 leading-tight mt-0.5">{format(day, 'd')}</div>
                </div>
                
                {/* Day Events Column (Relative Container) */}
                <div 
                  className="relative w-full"
                  style={{ height: `${GRID_HEIGHT}px` }}
                >
                  {dayClasses.map(c => {
                    const classDate = typeof c.starts_at === 'string' ? parseISO(c.starts_at) : c.starts_at
                    const { top, height } = getEventStyle(classDate, c.duration_min)
                    const bgColor = c.color || getDefaultColor(c.title)
                    const textColor = '#0f172a' 
                    const coach = c.org_members;

                    return (
                      <div
                        key={c.id}
                        className="group absolute w-full rounded-md p-1.5 px-2 flex flex-col overflow-hidden transition-all hover:scale-[1.02] cursor-pointer shadow-sm border border-black/5 hover:!z-50"
                        style={{
                          top: `${top}px`,
                          height: `max(${height}px, 75px)`, // Minimum height to remain legible
                          backgroundColor: bgColor,
                          color: textColor,
                          opacity: c.is_cancelled ? 0.7 : 1,
                          zIndex: 10
                        }}
                        onClick={() => {
                          const slug = (c as any).organizations?.slug || studioSlug
                          if (isStaff) {
                            window.location.href = `/dashboard/classes/${c.id}`
                          } else {
                            window.location.href = `/${slug}/book/${c.id}`
                          }
                        }}
                      >
                        <div className="text-[11px] font-bold tracking-tight mb-0.5 truncate opacity-90">
                          {format(classDate, 'HH:mm')} • {c.duration_min} min
                        </div>
                        
                        <div className={`text-[13px] font-bold leading-[1.1] mb-1 truncate ${c.is_cancelled ? 'line-through opacity-70' : ''}`}>
                          {c.title}
                        </div>

                        {coach && (
                          <div className="flex items-center gap-1.5 mt-auto opacity-90">
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-black/10 flex items-center justify-center shrink-0 border border-black/5">
                              {coach.avatar_url ? (
                                <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold uppercase">{coach.display_name?.charAt(0) || '?'}</span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold truncate">
                              {coach.display_name || 'Coach'}
                            </span>
                          </div>
                        )}

                        {c.is_cancelled && (
                          <div className="mt-auto flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-80 pt-1">
                            <Users className="w-3.5 h-3.5" /> Annulé
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Agenda View */}
      <div className="md:hidden flex flex-col gap-6 pb-8 mt-2">
        {days.map(day => {
          const dayClasses = initialClasses.filter(c => {
            const classDate = typeof c.starts_at === 'string' ? parseISO(c.starts_at) : c.starts_at
            return isSameDay(classDate, day)
          }).sort((a, b) => {
            const dateA = typeof a.starts_at === 'string' ? parseISO(a.starts_at) : a.starts_at
            const dateB = typeof b.starts_at === 'string' ? parseISO(b.starts_at) : b.starts_at
            return dateA.getTime() - dateB.getTime()
          })

          if (dayClasses.length === 0) return null

          return (
            <div key={`mobile-${day.toISOString()}`} className="flex flex-col">
              <div className="sticky top-0 bg-white/95 backdrop-blur z-20 py-2.5 border-b border-zinc-100 mb-3 flex items-baseline gap-2">
                <h3 className="text-[16px] font-semibold text-zinc-900 capitalize tracking-tight">
                  {format(day, 'EEEE', { locale: fr })}
                </h3>
                <span className="text-[14px] font-medium text-zinc-500">
                  {format(day, 'd MMMM', { locale: fr })}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 px-0.5">
                {dayClasses.map(c => {
                  const classDate = typeof c.starts_at === 'string' ? parseISO(c.starts_at) : c.starts_at
                  const bgColor = c.color || getDefaultColor(c.title)
                  const textColor = '#0f172a' 
                  const coach = c.org_members

                  return (
                    <div
                      key={`mobile-event-${c.id}`}
                      className="group relative w-full rounded-2xl p-4 flex flex-col shadow-sm border border-black/5 active:scale-[0.98] transition-transform cursor-pointer"
                      style={{
                        backgroundColor: bgColor,
                        color: textColor,
                        opacity: c.is_cancelled ? 0.7 : 1,
                      }}
                      onClick={() => {
                        const slug = (c as any).organizations?.slug || studioSlug
                        if (isStaff) {
                          window.location.href = `/dashboard/classes/${c.id}`
                        } else {
                          window.location.href = `/${slug}/book/${c.id}`
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3 pr-2">
                        <div>
                          <div className="text-[11px] font-bold tracking-wide uppercase mb-1 opacity-80">
                            {format(classDate, 'HH:mm')} <span className="mx-1.5 opacity-50">—</span> {c.duration_min} min
                          </div>
                          <div className={`text-[16px] font-bold leading-tight tracking-tight ${c.is_cancelled ? 'line-through opacity-70' : ''}`}>
                            {c.title}
                          </div>
                        </div>
                        
                        {c.is_cancelled && (
                          <div className="absolute top-3.5 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-800 bg-white/60 px-2 py-1 rounded-md shrink-0 backdrop-blur-sm">
                            Annulé
                          </div>
                        )}
                      </div>

                      {coach && (
                        <div className="flex items-center gap-2.5 mt-1 pt-3 border-t border-black/10">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-black/10 flex items-center justify-center shrink-0 border border-black/5">
                            {coach.avatar_url ? (
                              <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold uppercase opacity-80">{coach.display_name?.charAt(0) || '?'}</span>
                            )}
                          </div>
                          <span className="text-[13px] font-semibold truncate opacity-90">
                            {coach.display_name || 'Coach'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {initialClasses.filter(c => {
            const classDate = typeof c.starts_at === 'string' ? parseISO(c.starts_at) : c.starts_at
            return classDate >= currentWeekStart && classDate < addWeeks(currentWeekStart, 1)
        }).length === 0 && (
          <div className="py-12 text-center text-zinc-500 text-sm">
            Aucun cours programmé cette semaine.
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Créer un cours</DialogTitle>
          </DialogHeader>
          <form action={handleCreateClass} className="space-y-4 pt-2">
            {(organizations?.length ?? 0) > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="organization_id" className="text-xs font-semibold text-gray-600">Studio</Label>
                <select 
                  name="organization_id" 
                  defaultValue={organizations![0].id} 
                  required
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
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

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-gray-600">Titre</Label>
              <Input id="title" name="title" required placeholder="ex: Yoga" className="h-10 rounded-md" />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="coach_id" className="text-xs font-semibold text-gray-600">Coach</Label>
              <select 
                name="coach_id" 
                defaultValue={currentMemberId}
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              >
                <option value="">Aucun coach</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.display_name || "Coach sans nom"}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="starts_at" className="text-xs font-semibold text-gray-600">Date et heure</Label>
                <Input id="starts_at" name="starts_at" type="datetime-local" required className="h-10 rounded-md" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration_min" className="text-xs font-semibold text-gray-600">Durée (min)</Label>
                <Input id="duration_min" name="duration_min" type="number" defaultValue="60" required className="h-10 rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-xs font-semibold text-gray-600">Capacité</Label>
                <Input id="capacity" name="capacity" type="number" defaultValue="15" required className="h-10 rounded-md" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-semibold text-gray-600">Prix (€) - Optionnel</Label>
                <Input id="price" name="price" type="number" step="0.50" min="0" placeholder="0 = Gratuit" className="h-10 rounded-md" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color" className="text-xs font-semibold text-gray-600">Couleur</Label>
              <Input id="color" name="color" type="color" defaultValue="#2aa298" className="h-10 p-1 w-full rounded-md" />
            </div>
            <Button type="submit" className="w-full h-10 mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md">Enregistrer</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

