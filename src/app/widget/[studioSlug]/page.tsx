import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { startOfWeek, addDays, subWeeks, addWeeks, format, parseISO, isSameDay, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function WidgetStudioPage(props: { params: Promise<{ studioSlug: string }>, searchParams: Promise<{ d?: string }> }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { studioSlug } = params
  
  const org = await prisma.organizations.findUnique({
    where: { slug: studioSlug }
  })

  if (!org) notFound()

  // Determine current week start
  const queryDate = searchParams.d ? parseISO(searchParams.d) : new Date()
  const weekStart = startOfWeek(queryDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = addDays(weekStart, 6)
  
  const classes = await prisma.classes.findMany({
    where: { 
      organization_id: org.id,
      starts_at: { 
        gte: weekStart,
        lte: addDays(weekEnd, 1) // up to end of Sunday
      }
    },
    include: { org_members: true },
    orderBy: { starts_at: 'asc' }
  })

  const prevWeek = subWeeks(weekStart, 1)
  const nextWeek = addWeeks(weekStart, 1)
  
  const currentMonth = format(weekStart, 'MMMM yyyy', { locale: fr })
  
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

  return (
    <div className="bg-transparent text-slate-900 font-sans pb-4">
      {/* Main Content */}
      <main className="w-full mx-auto px-2 pt-4">

        {/* Navigation & Month */}
        <div className="flex items-center justify-between gap-6 mb-6">
          <h2 className="text-[20px] font-medium capitalize min-w-[140px] text-slate-900">{currentMonth}</h2>
          <div className="flex gap-2">
            <Link href={`/widget/${studioSlug}?d=${format(prevWeek, 'yyyy-MM-dd')}`}>
              <Button variant="outline" className="text-slate-600 border-slate-200 shadow-none rounded-[4px] h-8 px-3 flex gap-2 text-xs font-medium hover:bg-slate-50">
                <ChevronLeft className="h-3 w-3" />
                <span className="hidden sm:inline">Précédent</span>
              </Button>
            </Link>
            <Link href={`/widget/${studioSlug}?d=${format(nextWeek, 'yyyy-MM-dd')}`}>
              <Button variant="outline" className="text-slate-600 border-slate-200 shadow-none rounded-[4px] h-8 px-3 flex gap-2 text-xs font-medium hover:bg-slate-50">
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => {
            const dayClasses = classes.filter(c => isSameDay(c.starts_at, day))
            
            return (
              <div key={day.toISOString()} className="flex flex-col">
                {/* Column Header */}
                <div className="text-center mb-4">
                  <div className="text-[13px] text-slate-900">{format(day, 'EEE.', { locale: fr })}</div>
                  <div className="text-[15px] font-bold text-slate-900">{format(day, 'dd')}</div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-[6px]">
                  {dayClasses.map((cls) => {
                    const classPast = isPast(addDays(cls.starts_at, 0))
                    const isCancelled = cls.is_cancelled

                    let bgClass = "bg-[#2eb5a3]"
                    let textClass = "text-white"
                    
                    const titleLow = cls.title.toLowerCase()
                    if (titleLow.includes('yoga') || titleLow.includes('apéro')) {
                      bgClass = "bg-[#9d50f0]"
                    } else if (titleLow.includes('intermédiaire')) {
                      bgClass = "bg-[#1a9a89]"
                    }

                    if (classPast) {
                      bgClass = "bg-[#a6dfd6]"
                      textClass = "text-[#2e7d73]"
                    }

                    return (
                      <a 
                        href={`/${studioSlug}/book/${cls.id}`} 
                        key={cls.id} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block transition-transform hover:-translate-y-0.5`}
                      >
                        <div 
                          className={`${bgClass} rounded-[6px] p-3 ${textClass} flex flex-col justify-between relative`}
                          style={{ minHeight: `${Math.max(cls.duration_min * 1.8, 95)}px` }}
                        >
                          <div>
                            <div className={`text-[12px] font-medium mb-1 ${isCancelled ? 'line-through opacity-70' : ''}`}>
                              {format(cls.starts_at, 'HH:mm')} • {cls.duration_min} min
                            </div>
                            <div className={`text-[13px] leading-snug line-clamp-2 ${isCancelled ? 'line-through opacity-70' : 'font-medium'}`}>
                              {cls.title}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between">
                            {/* Profile photo */}
                            {cls.org_members?.avatar_url ? (
                              <img src={cls.org_members.avatar_url} alt={cls.org_members.display_name || ''} className="w-6 h-6 rounded-full border border-white/30 object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-bold">
                                {cls.org_members?.display_name?.charAt(0) || 'C'}
                              </div>
                            )}

                            {isCancelled && (
                              <div className="text-[11px] font-semibold flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Annulé
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
