import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

export default async function MemberDashboardLayout({ 
  children,
  params
}: { 
  children: React.ReactNode,
  params: Promise<{ studioSlug: string }>
}) {
  const { studioSlug } = await params
  const supabase = await createClient()
  
  // 1. Vérifier si le membre est connecté via Supabase Auth
  const { data: { user } } = await supabase.auth.getUser()
  
  // Si pas de user, on redirige vers le login public du studio
  if (!user) {
    redirect(`/${studioSlug}/login`)
  }

  // 2. Vérifier si c'est bien un membre de ce studio
  const org = await prisma.organizations.findUnique({ where: { slug: studioSlug } })
  if (!org) redirect('/')

  const member = await prisma.studio_members.findUnique({
    where: { 
      organization_id_email: { 
        organization_id: org.id, 
        email: user.email! 
      } 
    }
  })

  // Si l'utilisateur auth n'est pas enregistré comme membre de ce studio
  if (!member) {
    // On pourrait le créer ici ou rediriger
    redirect(`/${studioSlug}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-bold text-lg">{org.name} — Espace Membre</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action="/api/auth/signout" method="post">
              <button className="text-sm text-red-600 hover:underline">Déconnexion</button>
            </form>
          </div>
        </div>
      </nav>
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  )
}
