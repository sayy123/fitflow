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

    const org = await prisma.organizations.findUnique({
      where: { id: orgId }
    });

    if (!org || !org.stripe_account_id) {
      return new NextResponse('Organization or Stripe account not found', { status: 404 });
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(org.stripe_account_id);

    // Update the database based on charges_enabled and details_submitted
    await prisma.organizations.update({
      where: { id: orgId },
      data: { 
        stripe_charges_enabled: account.charges_enabled,
        stripe_account_status: account.charges_enabled ? 'active' : (account.details_submitted ? 'pending_verification' : 'pending'),
      }
    });

    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${host}/dashboard/settings?tab=general&stripe=success`);
  } catch (error) {
    console.error('[STRIPE_CALLBACK]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
