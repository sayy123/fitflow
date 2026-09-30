import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createMollieClient } from '@mollie/api-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const orgId = searchParams.get('state');

    if (!code || !orgId) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    const host = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, "");
    
    // Exchange code for token
    const tokenResponse = await fetch('https://api.mollie.com/oauth2/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${process.env.MOLLIE_CLIENT_ID}:${process.env.MOLLIE_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${host}/api/mollie/callback`
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('[MOLLIE_OAUTH_ERROR]', tokenData);
      return NextResponse.redirect(`${host}/dashboard/settings?mollie_connect_error=true`);
    }

    // Initialize client with OAuth token to get the profile ID
    const oauthMollie = createMollieClient({ accessToken: tokenData.access_token });
    const profiles = await oauthMollie.profiles.page();
    if (!profiles || profiles.length === 0) {
      throw new Error('Aucun profil de site web trouvé sur ce compte Mollie.');
    }
    const profile = profiles[0];

    // Find the owners of this org
    const orgMembers = await prisma.org_members.findMany({
      where: { organization_id: orgId, role: 'owner' }
    });
    const ownerIds = orgMembers.map((m: any) => m.user_id);

    if (ownerIds.length > 0) {
      // Find all organizations owned by these owners
      const otherOrgs = await prisma.org_members.findMany({
        where: { user_id: { in: ownerIds }, role: 'owner' }
      });
      const orgIdsToUpdate = Array.from(new Set(otherOrgs.map((m: any) => m.organization_id)));

      // Update all organizations with Mollie Profile ID and Tokens
      await prisma.organizations.updateMany({
        where: { id: { in: orgIdsToUpdate } },
        data: {
          mollie_account_id: profile.id, // Using Profile ID instead of Account ID
          mollie_access_token: tokenData.access_token,
          mollie_refresh_token: tokenData.refresh_token,
          mollie_charges_enabled: true,
          mollie_account_status: 'active'
        }
      });
    } else {
      await prisma.organizations.update({
        where: { id: orgId },
        data: {
          mollie_account_id: profile.id, // Using Profile ID instead of Account ID
          mollie_access_token: tokenData.access_token,
          mollie_refresh_token: tokenData.refresh_token,
          mollie_charges_enabled: true,
          mollie_account_status: 'active'
        }
      });
    }

    return NextResponse.redirect(`${host}/dashboard/settings?mollie_connect_success=true`);
  } catch (error) {
    console.error('[MOLLIE_CALLBACK]', error);
    const host = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, "");
    return NextResponse.redirect(`${host}/dashboard/settings?mollie_connect_error=true`);
  }
}
