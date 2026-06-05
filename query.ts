import { PrismaClient } from './src/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    where: {
      email: {
        in: ['7k.say1234@gmail.com', 'martin.stocq@gmail.com']
      }
    },
    select: { id: true, email: true }
  });
  console.log(JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
