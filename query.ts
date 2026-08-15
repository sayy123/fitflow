import { PrismaClient } from './src/generated/client/index.js'

const prisma = new PrismaClient()

async function main() {
  const profiles = await prisma.user_profiles.findMany();
  const now = new Date();
  
  for (const profile of profiles) {
    const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const isTrialExpired = trialEnd ? now > trialEnd : false;
    
    const msLeft = trialEnd ? trialEnd.getTime() - now.getTime() : 0;
    const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));
    const hoursLeft = Math.max(0, Math.floor((msLeft / (1000 * 60 * 60)) % 24));
    
    console.log(`User: ${profile.user_id}`);
    console.log(`  trialEndsAt: ${profile.trial_ends_at}`);
    console.log(`  isTrialExpired: ${isTrialExpired}`);
    console.log(`  msLeft: ${msLeft}`);
    console.log(`  daysLeft: ${daysLeft}`);
    console.log(`  hoursLeft: ${hoursLeft}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
