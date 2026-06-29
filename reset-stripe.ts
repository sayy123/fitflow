import { config } from 'dotenv';
config({ path: '.env' });

async function main() {
  const { default: prisma } = await import('./src/lib/prisma');
  
  await prisma.organizations.updateMany({
    data: {
      stripe_account_id: null,
      stripe_charges_enabled: false,
    },
  });
  console.log('Stripe accounts reset');
  
  await prisma.$disconnect();
}

main().catch(console.error);
