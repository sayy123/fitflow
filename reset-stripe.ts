import { config } from 'dotenv';
config();

import prisma from './src/lib/prisma';

async function main() {
  await prisma.organizations.updateMany({
    data: {
      stripe_account_id: null,
      stripe_charges_enabled: false,
    },
  });
  console.log('Stripe accounts reset');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
