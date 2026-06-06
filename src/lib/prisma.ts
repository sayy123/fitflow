import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const prismaClientSingleton = () => {
  // On utilise une variable spécifique qui ne sera pas écrasée par l'intégration Vercel/Supabase
  const dbUrl = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL_POOLER or DATABASE_URL is not set')
  }
  
  console.log('Initializing Prisma with URL:', dbUrl.replace(/:[^:@]+@/, ':***@'))
  
  const pool = new pg.Pool({ 
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })
  console.log('Pool config:', { host: pool.options.host, port: pool.options.port, database: pool.options.database })
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({ adapter })
}

declare global {
  var __prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.__prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma
