import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching latest projects from Neon DB...");
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(`Found ${projects.length} projects:`);
  projects.forEach((p) => {
    console.log(`- ID: ${p.id} | Name: ${p.name} | isRunning: ${p.isRunning} | activeRunId: ${p.activeRunId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
