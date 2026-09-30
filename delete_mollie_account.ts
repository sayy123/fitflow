import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user_profiles.findFirst({
    where: { full_name: { contains: 'Martin Stocq', mode: 'insensitive' } }
  });

  if (!user) {
    console.log("User 'Martin Stocq' not found in user_profiles.");
    return;
  }

  console.log("Found user:", user);

  await prisma.user_profiles.update({
    where: { user_id: user.user_id },
    data: {
      mollie_customer_id: null,
      mollie_subscription_id: null,
      subscription_status: 'trialing', // reset status
      plan: 'none'
    }
  });

  console.log("Cleared mollie_customer_id for user_profiles.");

  // Find organizations where this user is owner
  const memberships = await prisma.org_members.findMany({
    where: { user_id: user.user_id, role: 'owner' }
  });

  for (const member of memberships) {
    await prisma.organizations.update({
      where: { id: member.organization_id },
      data: {
        mollie_account_id: null,
        mollie_charges_enabled: false
      }
    });
    console.log(`Cleared mollie_account_id for organization ${member.organization_id}.`);
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
