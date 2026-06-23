import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  const sessions = await stripe.checkout.sessions.list({ limit: 5 });
  for (const session of sessions.data) {
    console.log(session.id, session.payment_status, session.metadata);
  }
}
main().catch(console.error);
