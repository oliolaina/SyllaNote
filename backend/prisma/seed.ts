import { runSeedDatabase } from '../src/seed/seedDatabase.js';
import { prisma } from '../src/lib/prisma.js';

runSeedDatabase()
  .then((result) => {
    console.log('Seed completed:', result);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
