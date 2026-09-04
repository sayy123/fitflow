import prisma from './src/lib/prisma'

async function wipeDatabase() {
  console.log("Wiping Prisma tables...");
  
  // Delete all users. Because of foreign keys, this should cascade delete 
  // most data in auth schema and linked tables if set up properly.
  // Actually, we'll delete organizations and related data manually to be safe.
  const orgs = await prisma.organizations.deleteMany({});
  console.log(`Deleted ${orgs.count} organizations.`);

  const users = await prisma.users.deleteMany({});
  console.log(`Deleted ${users.count} users.`);

  await prisma.pending_registrations.deleteMany({});
  await prisma.pending_bookings.deleteMany({});
  await prisma.org_invitations.deleteMany({});
  
  console.log("Database wiped successfully!");
}

wipeDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
