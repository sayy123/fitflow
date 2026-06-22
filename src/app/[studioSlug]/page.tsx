import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { startOfWeek, addDays, subWeeks, addWeeks, format, parseISO, isSameDay, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function PublicStudioPage(props: { params: Promise<{ studioSlug: string }>, searchParams: Promise<{ d?: string }> }) {
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
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-12">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-400">{org.name.charAt(0)}</span>
                </div>
              )}
              <h1 className="text-lg font-bold">{org.name}</h1>
            </div>
            <div className="flex items-center gap-6">
              <Link href={`/${studioSlug}/login`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Connexion
              </Link>
              <Link href={`/${studioSlug}/register`}>
                <Button className="bg-[#10b981] hover:bg-[#059669] text-white rounded-[4px] px-6 h-9 shadow-none text-sm font-medium">
                  Inscription
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <div className="flex gap-8">
            <div className="border-b-[3px] border-[#10b981] pb-3 px-1">
              <span className="text-[15px] font-medium text-slate-900">Planning</span>
            </div>
            <div className="pb-3 px-1">
              <span className="text-[15px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer">Tarifs</span>
            </div>
            <div className="pb-3 px-1">
              <span className="text-[15px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer">Cartes cadeaux</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <div className="w-64">
            <Select>
              <SelectTrigger className="bg-white border-slate-200 shadow-none rounded-[4px] h-10">
                <SelectValue placeholder="Professeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <Select>
              <SelectTrigger className="bg-white border-slate-200 shadow-none rounded-[4px] h-10">
                <SelectValue placeholder="Type d'activité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <Select>
              <SelectTrigger className="bg-white border-slate-200 shadow-none rounded-[4px] h-10">
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation & Month */}
        <div className="flex items-center gap-6 mb-8">
          <h2 className="text-[22px] font-medium capitalize min-w-[140px] text-slate-900">{currentMonth}</h2>
          <div className="flex gap-2">
            <Link href={`/${studioSlug}?d=${format(prevWeek, 'yyyy-MM-dd')}`}>
              <Button variant="outline" className="text-slate-600 border-slate-200 shadow-none rounded-[4px] h-9 px-4 flex gap-2 text-sm font-medium hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" />
                Semaine dernière
              </Button>
            </Link>
            <Link href={`/${studioSlug}?d=${format(nextWeek, 'yyyy-MM-dd')}`}>
              <Button variant="outline" className="text-slate-600 border-slate-200 shadow-none rounded-[4px] h-9 px-4 flex gap-2 text-sm font-medium hover:bg-slate-50">
                Semaine prochaine
                <ChevronRight className="h-4 w-4" />
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
                      <Link 
                        href={`/${studioSlug}/book/${cls.id}`} 
                        key={cls.id} 
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
                      </Link>
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
