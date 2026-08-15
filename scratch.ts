import prisma from './src/lib/prisma';

async function main() {
  const count = await prisma.organizations.count();
  console.log("Org count:", count);
}

main().catch(console.error);
