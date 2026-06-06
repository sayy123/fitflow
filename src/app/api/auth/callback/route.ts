import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function handleAuth(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const user = data.user
      
      // 1. S'assurer que l'utilisateur a un profil (pour la facturation/plan)
      await prisma.user_profiles.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          plan: 'starter',
          subscription_status: 'trialing',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      });

      // 2. Lazy link to organizations based on email
      if (user.email) {
        const studioMemberships = await prisma.studio_members.findMany({
          where: { 
            email: {
              equals: user.email,
              mode: 'insensitive'
            }
          }
        })

        for (const membership of studioMemberships) {
          await prisma.org_members.upsert({
            where: {
              organization_id_user_id: {
                organization_id: membership.organization_id,
                user_id: user.id
              }
            },
            update: {
              display_name: user.user_metadata?.full_name || membership.full_name
            },
            create: {
              organization_id: membership.organization_id,
              user_id: user.id,
              role: 'member',
              display_name: user.user_metadata?.full_name || membership.full_name
            }
          })
        }
      }
      revalidatePath('/', 'layout');
      const redirectUrl = new URL(next, request.url)
      // Force https if we are not on localhost to avoid browser redirect issues
      if (!redirectUrl.hostname.includes('localhost')) {
        redirectUrl.protocol = 'https:'
      }
      return NextResponse.redirect(redirectUrl.toString())
    }
    console.error('Auth code exchange error:', error)
  } else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error && data.user) {
      const user = data.user
      if (user.email) {
        const studioMemberships = await prisma.studio_members.findMany({
          where: { 
            email: {
              equals: user.email,
              mode: 'insensitive'
            }
          }
        })

        for (const membership of studioMemberships) {
          await prisma.org_members.upsert({
            where: {
              organization_id_user_id: {
                organization_id: membership.organization_id,
                user_id: user.id
              }
            },
            update: {
              display_name: user.user_metadata?.full_name || membership.full_name
            },
            create: {
              organization_id: membership.organization_id,
              user_id: user.id,
              role: 'member',
              display_name: user.user_metadata?.full_name || membership.full_name
            }
          })
        }
      }
      revalidatePath('/', 'layout');
      const redirectUrl = new URL(next, request.url)
      if (!redirectUrl.hostname.includes('localhost')) {
        redirectUrl.protocol = 'https:'
      }
      return NextResponse.redirect(redirectUrl.toString())
    }
    console.error('Auth OTP verification error:', error)
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('error', 'auth-code-error')
  if (!loginUrl.hostname.includes('localhost')) {
    loginUrl.protocol = 'https:'
  }
  return NextResponse.redirect(loginUrl.toString())
}

export async function GET(request: Request) {
  return handleAuth(request)
}

export async function POST(request: Request) {
  return handleAuth(request)
}
