import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return new NextResponse('Missing orgId', { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify user is owner/admin
    const membership = await prisma.org_members.findFirst({
      where: {
        organization_id: orgId,
        user_id: user.id,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!membership) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const org = await prisma.organizations.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    const host = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, "");
    const redirectUri = `${host}/api/mollie/callback`;
    const clientId = process.env.MOLLIE_CLIENT_ID || 'app_dummy';
    
    // Generate Mollie OAuth URL
    const url = new URL('https://my.mollie.com/oauth2/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', orgId);
    url.searchParams.set('scope', 'payments.read payments.write customers.read customers.write profiles.read profiles.write');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('approval_prompt', 'force');

    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error('[MOLLIE_CONNECT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
