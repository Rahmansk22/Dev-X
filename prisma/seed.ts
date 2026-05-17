import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create a SaaS user
  const userId = 'saas-user-1';

  // Create a real SaaS project
  const project = await prisma.project.create({
    data: {
      userId,
      name: 'SaaS Starter Project',
      description: 'A seeded SaaS application project',
      status: 'active',
      currentVersion: 1,
      // Optionally, add more fields or relations as needed
    },
  });

  // Optionally, seed usage credits for the user
  await prisma.usage.upsert({
    where: { key: userId },
    update: { points: 100 },
    create: { key: userId, points: 100 },
  });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
