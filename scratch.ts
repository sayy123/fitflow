import prisma from './src/lib/prisma'
async function main() {
  const orgs = await prisma.organizations.findMany({ select: { name: true, member_monthly_price: true, mollie_account_id: true } })
  console.log(orgs)
}
main()
