import prisma from './src/lib/prisma';

async function main() {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      created_at: true,
      userProfiles: { select: { plan: true } }
    }
  });
  
  const orgs = await prisma.organizations.findMany({
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  const studioMembers = await prisma.studio_members.findMany({
    select: {
      id: true,
      email: true,
      full_name: true
    }
  });

  console.log("USERS:", JSON.stringify(users, null, 2));
  console.log("ORGS:", JSON.stringify(orgs, null, 2));
  console.log("STUDIO MEMBERS:", JSON.stringify(studioMembers, null, 2));
}

main().catch(e => console.error(e)).finally(() => process.exit(0));
