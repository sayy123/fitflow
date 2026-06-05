import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'

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
      // Lazy link to organizations based on email
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
      return NextResponse.redirect(`${origin}${next}`)
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
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Auth OTP verification error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}

export async function GET(request: Request) {
  return handleAuth(request)
}

export async function POST(request: Request) {
  return handleAuth(request)
}
