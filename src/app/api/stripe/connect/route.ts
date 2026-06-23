import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

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

    let accountId = org.stripe_account_id;

    if (org.stripe_charges_enabled && accountId) {
      // Create a magic login link for Express accounts
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.redirect(loginLink.url);
    }

    if (!accountId) {
      // Create an Express Connect account (supports magic login links)
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: org.name,
        },
      });
      accountId = account.id;

      await prisma.organizations.update({
        where: { id: orgId },
        data: { stripe_account_id: accountId }
      });
    }

    // Create Account Link for onboarding
    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${host}/dashboard/settings?tab=general`, // If they drop off, just return to settings
      return_url: `${host}/api/stripe/callback?orgId=${orgId}`,
      type: 'account_onboarding',
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error('[STRIPE_CONNECT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
