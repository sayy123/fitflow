import prisma from './src/lib/prisma'

async function main() {
  console.log('Seeding demo data for martin.stocq@gmail.com...')

  const user = await prisma.users.findUnique({
    where: { email: 'martin.stocq@gmail.com' }
  })

  if (!user) {
    console.error("L'utilisateur n'existe pas")
    process.exit(1)
  }

  const orgMembers = await prisma.org_members.findMany({
    where: { user_id: user.id, role: 'owner' },
    include: { organizations: true }
  })

  if (orgMembers.length === 0) {
    console.error("Pas de studio trouvé")
    process.exit(1)
  }

  // Inject in all owned organizations just in case
  for (const orgMember of orgMembers) {
    const orgId = orgMember.organization_id
    console.log(`Seeding pour le studio : ${orgMember.organizations.name} (${orgId})`)

    // Ensure martin is also a studio_member so he has "Mes prochaines séances"
    const myMember = await prisma.studio_members.upsert({
      where: {
        organization_id_email: {
          organization_id: orgId,
          email: 'martin.stocq@gmail.com'
        }
      },
      update: {},
      create: {
        organization_id: orgId,
        email: 'martin.stocq@gmail.com',
        full_name: 'Martin Stocq',
        is_active: true
      }
    })

    const classes = await prisma.classes.findMany({
      where: { organization_id: orgId }
    })

    if (classes.length > 0) {
      // Book him in the first two classes
      for (const cls of classes.slice(0, 2)) {
        await prisma.bookings.upsert({
          where: {
            class_id_studio_member_id: {
              class_id: cls.id,
              studio_member_id: myMember.id
            }
          },
          update: { status: 'confirmed' },
          create: {
            class_id: cls.id,
            studio_member_id: myMember.id,
            organization_id: orgId,
            status: 'confirmed',
            payment_status: 'paid'
          }
        })
      }
    }
  }
  console.log("Terminé : Réservations ajoutées pour Martin !")
}

main().catch(console.error).finally(() => prisma.$disconnect())
