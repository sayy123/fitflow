import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PublicStudioPage({ params }: { params: { studioSlug: string } }) {
  const { studioSlug } = await params

  const org = await prisma.organizations.findUnique({
    where: { slug: studioSlug }
  })

  if (!org) notFound()

  const classes = await prisma.classes.findMany({
    where: { 
      organization_id: org.id,
      starts_at: { gte: new Date() },
      is_cancelled: false
    },
    include: { org_members: true },
    orderBy: { starts_at: 'asc' },
    take: 20
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Studio */}
      <header className="bg-white border-b shadow-sm py-8 mb-8" style={{ borderTop: `4px solid ${org.color_primary || '#4f46e5'}` }}>
        <div className="container mx-auto px-4 flex flex-col items-center">
          {org.logo_url && <img src={org.logo_url} alt={org.name} className="h-16 mb-4" />}
          <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
          <p className="text-gray-500">Réservez votre prochaine séance</p>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-4xl">
        <div className="grid gap-6">
          <h2 className="text-xl font-semibold mb-2">Cours à venir</h2>
          
          {classes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Aucun cours n'est prévu pour le moment.
              </CardContent>
            </Card>
          ) : (
            classes.map((cls) => (
              <Card key={cls.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-2 bg-blue-600" style={{ backgroundColor: cls.color || org.color_primary || '#4f46e5' }} />
                  <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-blue-600 mb-1" style={{ color: org.color_primary || '#4f46e5' }}>
                        {new Date(cls.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{cls.title}</h3>
                      <p className="text-gray-500 text-sm">
                        {new Date(cls.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {cls.duration_min} min • Coach: {cls.org_members?.display_name || 'TBA'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{cls.capacity - 0} places restantes</span>
                        <p className="text-xs text-gray-500">sur {cls.capacity}</p>
                      </div>
                      <Link href={`/${studioSlug}/book/${cls.id}`}>
                        <Button style={{ backgroundColor: org.color_primary || '#4f46e5' }}>Réserver</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
