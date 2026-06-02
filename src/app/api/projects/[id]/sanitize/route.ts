import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { sanitizeShadcnUtilities } from "@/lib/sandbox-preview";

/**
 * POST /api/projects/[id]/sanitize
 * Sanitizes all fragment files for a project — fixes Tailwind v4 CSS variable
 * function syntax (text-(--muted-foreground)) and semantic token classes.
 * This writes the fixed files back to the DB so the next wakeup uses clean code.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: projectId, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fragment = await prisma.fragment.findFirst({
    where: { message: { projectId } },
    orderBy: { createdAt: "desc" },
  });

  if (!fragment?.files) return NextResponse.json({ error: "No files" }, { status: 404 });

  const files = fragment.files as Record<string, string>;
  let fixedCount = 0;

  for (const [path, content] of Object.entries(files)) {
    if (!/\.(tsx?|jsx?|css|scss|mjs)$/.test(path)) continue;
    const sanitized = sanitizeShadcnUtilities(content);
    if (sanitized !== content) {
      files[path] = sanitized;
      fixedCount++;
      console.log(`[Sanitize] Fixed: ${path}`);
    }
  }

  if (fixedCount > 0) {
    await prisma.fragment.update({
      where: { id: fragment.id },
      data: { files },
    });
  }

  return NextResponse.json({ ok: true, fixedCount, message: `Sanitized ${fixedCount} files. Refresh preview to apply.` });
}
