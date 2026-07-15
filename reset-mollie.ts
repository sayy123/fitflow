import { config } from 'dotenv';
config({ path: '.env' });

async function main() {
  const { default: prisma } = await import('./src/lib/prisma');
  
  await prisma.organizations.updateMany({
    data: {
      mollie_account_id: null,
      mollie_charges_enabled: false,
    },
  });
  console.log('Mollie accounts reset');
  
  await prisma.$disconnect();
}

main().catch(console.error);
