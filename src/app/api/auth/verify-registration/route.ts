import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/emails/send'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return new Response('Token manquant', { status: 400 })
  }

  try {
    // 1. Trouver l'inscription en attente
    const pending = await prisma.pending_registrations.findUnique({
      where: { token }
    })

    if (!pending) {
      return new Response('Lien invalide ou expiré', { status: 404 })
    }

    if (new Date() > pending.expires_at) {
      await prisma.pending_registrations.delete({ where: { id: pending.id } })
      return new Response('Ce lien a expiré', { status: 410 })
    }

    const supabase = await createClient()

    // 2. Créer le compte Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: pending.email,
      password: pending.password_hash,
      options: {
        data: {
          full_name: pending.full_name,
        }
      }
    })

    if (authError && !authError.message.includes('already registered')) {
      console.error('Verify registration auth error:', authError)
      return new Response('Erreur lors de la création du compte', { status: 500 })
    }

    const userId = authData.user?.id
    if (!userId) {
      return new Response('Impossible de récupérer l\'utilisateur', { status: 500 })
    }

    // 3. Finaliser l'inscription dans la base de données
    if (pending.role === 'manager' && pending.studio_name) {
      const slug = pending.studio_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      
      try {
        await prisma.$transaction(async (tx) => {
          const org = await tx.organizations.create({
            data: {
              name: pending.studio_name!,
              slug: slug,
            }
          })
          
          await tx.org_members.create({
            data: {
              organization_id: org.id,
              user_id: userId,
              role: 'owner',
              display_name: pending.full_name,
            }
          })

          // Supprimer l'inscription en attente
          await tx.pending_registrations.delete({
            where: { id: pending.id }
          })
        })
        
        const host = request.headers.get('host')
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");
        await sendWelcomeEmail(pending.full_name, pending.studio_name, pending.email, siteUrl)
      } catch (error) {
        console.error('Organization creation error:', error)
      }
    } else {
      // Simple membre
      await prisma.pending_registrations.delete({
        where: { id: pending.id }
      })
    }

    // 4. Rediriger vers la page de login avec un message de succès
    redirect(`/login?message=${encodeURIComponent('Votre compte est créé ! Vous pouvez maintenant vous connecter.')}`)

  } catch (error) {
    console.error('Registration verification error:', error)
    return new Response('Une erreur est survenue lors de la validation', { status: 500 })
  }
}
