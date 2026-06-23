import { config } from 'dotenv';
config();
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

async function main() {
  const account = await stripe.accounts.retrieve('acct_1TlV5jHobBC2bZzD');
  console.log('details_submitted:', account.details_submitted);
  console.log('charges_enabled:', account.charges_enabled);
  console.log('requirements:', account.requirements?.currently_due);
}

main().catch(console.error);
