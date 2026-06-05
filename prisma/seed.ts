import { PrismaClient } from '../src/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new pg.Pool({ 
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding data...')

  // 1. Create Organization
  const org = await prisma.organizations.upsert({
    where: { slug: 'elite-fitness' },
    update: {},
    create: {
      name: 'Elite Fitness Studio',
      slug: 'elite-fitness',
      plan: 'starter',
      color_primary: '#4f46e5',
      timezone: 'Europe/Brussels',
      onboarding_completed: true
    }
  })

  console.log(`Created organization: ${org.name}`)

  // 2. Create Sample Classes
  const classes = [
    {
      title: 'Yoga Flow',
      starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration_min: 60,
      capacity: 15,
      location: 'Studio A',
      color: '#4f46e5'
    },
    {
      title: 'CrossFit Basics',
      starts_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      duration_min: 45,
      capacity: 10,
      location: 'Main Hall',
      color: '#ef4444'
    },
    {
      title: 'Pilates',
      starts_at: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
      duration_min: 60,
      capacity: 12,
      location: 'Studio B',
      color: '#10b981'
    }
  ]

  for (const cls of classes) {
    await prisma.classes.create({
      data: {
        ...cls,
        organization_id: org.id
      }
    })
  }

  console.log('Created sample classes')

  // 3. Create a test member and link to user if exists
  const user = await prisma.users.findFirst({
    where: { email: 'martin.stocq@gmail.com' }
  })

  await prisma.studio_members.upsert({
    where: { organization_id_email: { organization_id: org.id, email: 'martin.stocq@gmail.com' } },
    update: {},
    create: {
      organization_id: org.id,
      email: 'martin.stocq@gmail.com',
      full_name: 'Martin Stocq',
      is_active: true
    }
  })

  if (user) {
    await prisma.org_members.upsert({
      where: { 
        organization_id_user_id: { 
          organization_id: org.id, 
          user_id: user.id 
        } 
      },
      update: {},
      create: {
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        display_name: 'Martin Stocq'
      }
    })
    console.log('Linked user to organization as owner')
  }

  console.log('Created sample studio member')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
