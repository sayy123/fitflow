import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip Mollie webhooks
  if (pathname.startsWith('/api/webhooks/mollie')) {
    return NextResponse.next();
  }

  // Skip middleware for prefetch requests to speed up navigation
  if (request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch') {
    return NextResponse.next()
  }

  // Si Supabase redirige vers la page d'accueil avec un "code" au lieu du callback
  // (arrive souvent quand l'URL de callback n'est pas dans la whitelist Supabase)
  if (request.nextUrl.searchParams.has('code') && pathname !== '/api/auth/callback') {
    const code = request.nextUrl.searchParams.get('code');
    // On déduit l'intention : si c'est un reset, on veut aller vers update-password
    // Comme on n'a pas le paramètre exact, on le devine ou on va vers le callback classique
    const callbackUrl = new URL('/api/auth/callback', request.url);
    callbackUrl.searchParams.set('code', code!);
    
    // Si c'est fort probablement un reset de mot de passe (on force vers update-password)
    callbackUrl.searchParams.set('next', '/update-password');
    
    return NextResponse.redirect(callbackUrl);
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    '/register',
    '/onboarding/:path*',
    '/api/:path*',
  ],
}
