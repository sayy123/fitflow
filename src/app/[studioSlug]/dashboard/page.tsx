import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default async function MemberDashboardPage({ 
  params 
}: { 
  params: { studioSlug: string }
}) {
  const { studioSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const org = await prisma.organizations.findUnique({ where: { slug: studioSlug } })
  const member = await prisma.studio_members.findUnique({
    where: { organization_id_email: { organization_id: org!.id, email: user!.email! } },
    include: {
      bookings: {
        include: { classes: true },
        orderBy: { classes: { starts_at: 'asc' } },
        where: { classes: { starts_at: { gte: new Date() } } }
      }
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Bonjour, {member?.full_name}</h1>
        <Link href={`/${studioSlug}`}>
          <Button style={{ backgroundColor: org?.color_primary || '#4f46e5' }}>
            <CalendarDays className="mr-2 h-4 w-4" /> Réserver un cours
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mes Prochains Cours */}
        <Card>
          <CardHeader>
            <CardTitle>Mes prochaines séances</CardTitle>
          </CardHeader>
          <CardContent>
            {member?.bookings.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Vous n'avez pas encore de réservation.
              </div>
            ) : (
              <div className="space-y-4">
                {member?.bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-bold">{booking.classes.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.classes.starts_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(booking.classes.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {booking.status === 'confirmed' ? 'Confirmé' : 'Attente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mon Abonnement */}
        <Card>
          <CardHeader>
            <CardTitle>Mon abonnement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
              <p className="text-gray-600 mb-4">Vous n'avez pas encore d'abonnement actif dans ce studio.</p>
              <Button variant="outline" className="w-full">
                <CreditCard className="mr-2 h-4 w-4" /> Voir les tarifs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
