import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const members = await prisma.org_members.findMany({
    include: { organizations: true }
  })
  console.log(members)
}
main()
