import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip Stripe webhooks
  if (pathname.startsWith('/api/webhooks/stripe')) {
    return NextResponse.next();
  }

  // Skip middleware for prefetch requests to speed up navigation
  if (request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch') {
    return NextResponse.next()
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
