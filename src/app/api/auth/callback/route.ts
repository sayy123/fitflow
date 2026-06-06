import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function handleAuth(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  console.log(`[Auth Callback] Processing request. Code: ${!!code}, TokenHash: ${!!token_hash}, Next: ${next}`);
  console.log(`[Auth Callback] Full URL: ${request.url}`);

  const supabase = await createClient()

  try {
    if (code) {
      console.log(`[Auth Callback] Exchanging code for session...`);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[Auth Callback] Code exchange error:', error);
        throw error;
      }
      
      if (!data.user) {
        console.error('[Auth Callback] No user in data');
        throw new Error('No user found after code exchange');
      }

      const user = data.user
      console.log(`[Auth Callback] Session established for user: ${user.id} (${user.email})`);
      
      // 1. S'assurer que l'utilisateur a un profil
      console.log(`[Auth Callback] Ensuring user profile in DB...`);
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

      // 2. Lazy link to organizations
      if (user.email) {
        console.log(`[Auth Callback] Checking for studio memberships for ${user.email}...`);
        const studioMemberships = await prisma.studio_members.findMany({
          where: { 
            email: {
              equals: user.email,
              mode: 'insensitive'
            }
          }
        })
        
        console.log(`[Auth Callback] Found ${studioMemberships.length} studio memberships`);

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
      
      console.log(`[Auth Callback] Finalizing. Revalidating path and redirecting to ${next}`);
      revalidatePath('/', 'layout');
      
      const redirectUrl = new URL(next, request.url)
      if (!redirectUrl.hostname.includes('localhost')) {
        redirectUrl.protocol = 'https:'
      }
      
      console.log(`[Auth Callback] Redirecting to: ${redirectUrl.toString()}`);
      return NextResponse.redirect(redirectUrl.toString())
    } 
    
    if (token_hash && type) {
      console.log(`[Auth Callback] Verifying OTP...`);
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (error) {
        console.error('[Auth Callback] OTP error:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No user found after OTP verification');
      }

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
      console.log(`[Auth Callback] OTP Success. Redirecting to: ${redirectUrl.toString()}`);
      return NextResponse.redirect(redirectUrl.toString())
    }

    console.warn('[Auth Callback] No code or token_hash found in URL');
    throw new Error('No authentication parameters provided');

  } catch (err: any) {
    console.error('[Auth Callback] Fatal error during auth callback:', err);
    
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'auth-callback-error')
    loginUrl.searchParams.set('message', err.message || 'Unknown error')
    if (!loginUrl.hostname.includes('localhost')) {
      loginUrl.protocol = 'https:'
    }
    return NextResponse.redirect(loginUrl.toString())
  }
}

export async function GET(request: Request) {
  return handleAuth(request)
}

export async function POST(request: Request) {
  return handleAuth(request)
}
