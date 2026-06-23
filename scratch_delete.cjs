const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organizations.findUnique({
    where: { slug: 'yoga-2614' }
  });
  if (org) {
    console.log("Found organization:", org.name);
    await prisma.organizations.delete({
      where: { slug: 'yoga-2614' }
    });
    console.log("Deleted successfully.");
  } else {
    console.log("Organization not found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
