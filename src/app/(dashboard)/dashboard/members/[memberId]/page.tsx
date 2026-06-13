import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { MemberSubscriptionToggle } from '@/components/member-subscription-toggle'

export default async function MemberDetailPage(props: { params: Promise<{ memberId: string }> }) {
  const params = await props.params
  const { memberId } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staffMember = await prisma.org_members.findFirst({
    where: { user_id: user.id }
  })
  if (!staffMember || staffMember.role === 'member') redirect('/dashboard')

  const member = await prisma.studio_members.findUnique({
    where: { id: memberId, organization_id: staffMember.organization_id },
    include: {
      bookings: {
        include: {
          classes: true
        },
        orderBy: {
          classes: {
            starts_at: 'desc'
          }
        }
      },
      member_subscriptions: {
        orderBy: {
          created_at: 'desc'
        }
      }
    }
  })

  if (!member) notFound()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-[1.5rem] bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-lg font-black text-xl text-primary uppercase">
            {member.full_name.charAt(0)}
          </div>
          <div>
            <Link href="/dashboard/members" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline mb-2 block">← Retour à la liste</Link>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">{member.full_name}</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <MemberSubscriptionToggle memberId={member.id} hasSubscription={member.has_active_subscription || false} />
            <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold text-xs uppercase tracking-widest border-gray-100 hover:bg-gray-50 transition-all">
                Modifier le profil
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none card-shadow rounded-2xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
                "text-lg font-black tracking-tight uppercase",
                member.is_active ? "text-green-600" : "text-gray-400"
            )}>
                {member.is_active ? 'Actif' : 'Inactif'}
            </div>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Inscrit le {new Date(member.created_at!).toLocaleDateString('fr-FR')}</p>
          </CardContent>
        </Card>
        
        <Card className="border-none card-shadow rounded-2xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Séances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-black text-gray-900 tracking-tight">{member.bookings.length} séances</div>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Réservations totales</p>
          </CardContent>
        </Card>

        <Card className="border-none card-shadow rounded-2xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-black text-gray-900 tracking-tight truncate">{member.phone || 'Pas enregistré'}</div>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Contact client</p>
          </CardContent>
        </Card>
      </div>

      {member.notes && (
        <Card className="border-none card-shadow rounded-2xl overflow-hidden bg-gray-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes internes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap italic">&quot;{member.notes}&quot;</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-none card-shadow rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b border-gray-50 py-6 px-8">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Historique des séances</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/20">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Cours</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Date & Heure</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</TableHead>
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {member.bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-12 text-[10px] font-bold uppercase tracking-widest italic">Aucune séance enregistrée.</TableCell>
                </TableRow>
              ) : (
                member.bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell className="px-8 py-4">
                      <span className="font-bold text-sm text-gray-900 uppercase tracking-tight">{booking.classes.title}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-medium">
                        {new Date(booking.classes.starts_at).toLocaleDateString('fr-FR')} à {new Date(booking.classes.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        booking.status === 'confirmed' ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      )}>
                        {booking.status === 'confirmed' ? 'Conf.' : 'Att.'}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                        <Link href={`/dashboard/classes/${booking.class_id}`}>
                            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors h-8">Gérer</Button>
                        </Link>
                    </TableCell>
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
