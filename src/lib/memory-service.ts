import prisma from "./db";

export type MemoryCategory = "design" | "engineering" | "business" | "tech_stack";

export class MemoryService {
  /**
   * Captures a new insight about the project.
   * If the key already exists, it updates it (refining the memory).
   */
  static async capture(projectId: string, key: string, value: string, category: MemoryCategory, confidence: number = 1.0) {
    console.log(`[MemoryService] Capturing memory for ${projectId}: [${category}] ${key}`);
    
    return await prisma.memory.upsert({
      where: {
        projectId_key: {
          projectId,
          key,
        },
      },
      update: {
        value,
        category,
        confidence,
      },
      create: {
        projectId,
        key,
        value,
        category,
        confidence,
      },
    });
  }

  /**
   * Retrieves all memories for a project to build context for the agent.
   */
  static async getContextForAgent(projectId: string) {
    const memories = await prisma.memory.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
    });

    if (memories.length === 0) return "";

    return `\n## PROJECT MEMORY (LONG-TERM CONTEXT)\n${memories
      .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
      .join("\n")}\n`;
  }

  /**
   * Clears specific memory keys.
   */
  static async forget(projectId: string, key: string) {
    return await prisma.memory.delete({
      where: {
        projectId_key: {
          projectId,
          key,
        },
      },
    });
  }
}
