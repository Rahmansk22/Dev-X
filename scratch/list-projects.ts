import prisma from "C:/Users/RAH22/Desktop/Dev X -Extend/src/lib/db";

async function main() {
  console.log("Fetching latest projects from Neon DB...");
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  });

  if (projects.length === 0) {
    console.log("No projects found in the database.");
    return;
  }

  console.log(`Found ${projects.length} projects:`);
  for (const p of projects) {
    console.log(`- ID: ${p.id} | Name: ${p.name} | User: ${p.userId} | Created: ${p.createdAt.toISOString()}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
