'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function impersonateUser(authUserId: string) {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'Impersonation only allowed in development' }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // 1. Get the user's email
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(authUserId)
  
  if (userError || !user?.email) {
    return { error: 'User not found: ' + (userError?.message || 'No email') }
  }

  // 2. Generate magic link to get the token_hash
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  })

  if (error) {
    return { error: 'Failed to generate link: ' + error.message }
  }

  // 3. Extract token_hash from the generated link URL
  const url = new URL(data.properties.action_link)
  const token_hash = url.searchParams.get('token')

  if (!token_hash) {
    return { error: 'Could not extract token_hash from link' }
  }

  // 4. Verify OTP using token_hash to get a real session
  const { data: sessionData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
    token_hash,
    type: 'magiclink'
  })

  if (verifyError || !sessionData.session) {
    return { error: 'Failed to verify OTP: ' + (verifyError?.message || 'No session') }
  }

  // 5. Set the session cookies
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const supabase = await createServerClient()
  
  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  })

  if (setSessionError) {
    return { error: 'Failed to set session: ' + setSessionError.message }
  }

  redirect('/dashboard')
}
