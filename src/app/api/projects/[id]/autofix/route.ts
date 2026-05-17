import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Sandbox } from "e2b";
import { getCurrentUserId } from "@/lib/auth";
import { SANDBOX_WORKSPACE_DIR } from "@/lib/sandbox-preview";
import { autoHealAllFiles } from "@/lib/auto-heal-imports";

/**
 * TURBO AUTOFIX — Surgical error fixer. Target: <10s total.
 *
 * Strategy: Senior dev approach — read error, find broken file, fix ONLY that.
 * No bloated prompts. No full app regen. No server restart (HMR handles it).
 */

const SURGICAL_FIX_PROMPT = `You are an expert Next.js 15 debugger. Fix the EXACT error. Nothing else.

TECH STACK (do NOT change these):
- Next.js 15.4.10, React 19, TypeScript
- Tailwind CSS v4 (use @import "tailwindcss" in globals.css, NO tailwind.config, NO @apply)
- In globals.css @layer components: ONLY simple CSS class names (.glass-card, .glow-text)
  NEVER use Tailwind utility names as selectors (.bg-slate-900/40 = INVALID, "/" breaks CSS parser)
- "use client" on line 1 for any file using hooks/events/browser APIs
- Import shadcn from exact paths: import { Button } from "@/components/ui/button"
- Toasts: import { toast } from "sonner" (NEVER useToast)
- Escape JSX: It&apos;s not It's

RULES:
- Return ONLY changed/new files as JSON
- Do NOT return unchanged files
- Fix the ROOT CAUSE, not symptoms
- If missing file → create it. If bad import → fix import. If bad CSS → fix CSS.

OUTPUT (JSON only, no markdown):
{ "files": { "path/file.tsx": "fixed code" }, "explanation": "what was fixed" }`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const t0 = Date.now();
  try {
    const { id: projectId } = await params;
    const { error } = await req.json();

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get project + latest fragment
    const [project, latestFragment] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId, userId } }),
      prisma.fragment.findFirst({
        where: { message: { projectId } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!latestFragment?.files) return NextResponse.json({ error: "No files found" }, { status: 404 });

    const files = latestFragment.files as Record<string, string>;
    const errorText = typeof error === "string" ? error : JSON.stringify(error);

    // 2. SURGICAL FILE EXTRACTION — only files mentioned in error + core files
    const relevantFiles: Record<string, string> = {};

    for (const [path, content] of Object.entries(files)) {
      const baseName = path.split("/").pop() || "";
      const isErrorFile = errorText.includes(baseName) || errorText.includes(path);
      const isCoreFile = path === "app/globals.css" || path === "app/layout.tsx" ||
        path === "src/app/layout.tsx" || path === "package.json";

      if (isErrorFile || isCoreFile) {
        relevantFiles[path] = content;
      }
    }

    // If nothing matched, include all TSX files (small project)
    if (Object.keys(relevantFiles).length <= 1) {
      for (const [path, content] of Object.entries(files)) {
        if (/\.(tsx?|css)$/.test(path)) relevantFiles[path] = content;
      }
    }

    console.log(`[Autofix] 🔍 ${Object.keys(relevantFiles).length} relevant files in ${Date.now() - t0}ms`);

    // 3. FAST AI CALL — lean prompt, fast model
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI API key not configured" }, { status: 500 });

    const userPrompt = `## ERROR:\n${errorText}\n\n## FILES:\n${Object.entries(relevantFiles)
      .map(([p, c]) => `### ${p}\n\`\`\`\n${c}\n\`\`\``)
      .join("\n\n")}`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://devx.app",
        "X-Title": "DevX Autofix",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        messages: [
          { role: "system", content: SURGICAL_FIX_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        max_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[Autofix] AI call failed:", errText);
      return NextResponse.json({ error: "AI fix failed" }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    console.log(`[Autofix] 🤖 AI responded in ${Date.now() - t0}ms`);

    // 4. Parse response
    let fixResult: { files: Record<string, string>; explanation?: string };
    try {
      const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      fixResult = JSON.parse(cleaned);
    } catch {
      console.error("[Autofix] Parse failed:", rawContent.slice(0, 300));
      return NextResponse.json({ error: "Could not parse AI fix", raw: rawContent.slice(0, 200) }, { status: 500 });
    }

    if (!fixResult.files || Object.keys(fixResult.files).length === 0) {
      return NextResponse.json({ error: "AI returned no fixes" }, { status: 500 });
    }

    // 5. Auto-heal imports
    fixResult.files = autoHealAllFiles(fixResult.files);

    console.log(`[Autofix] ✅ ${Object.keys(fixResult.files).length} files fixed: ${Object.keys(fixResult.files).join(", ")}`);
    console.log(`[Autofix] 💡 ${fixResult.explanation || "no explanation"}`);

    // 6. Write to sandbox (HMR will auto-reload — NO server restart needed)
    const sandboxId = project.sandboxId;
    const updatedFiles = { ...files, ...fixResult.files };

    // Always save to DB
    await prisma.fragment.update({
      where: { id: latestFragment.id },
      data: { files: updatedFiles },
    });

    if (!sandboxId) {
      return NextResponse.json({
        ok: true, fixed: Object.keys(fixResult.files),
        explanation: fixResult.explanation, savedToDb: true,
        duration: Date.now() - t0,
      });
    }

    try {
      const sandbox = await Sandbox.connect(sandboxId);
      const homeDir = SANDBOX_WORKSPACE_DIR;

      // Write files in parallel — HMR handles the rest
      await Promise.all(
        Object.entries(fixResult.files).map(async ([path, content]) => {
          const dir = path.substring(0, path.lastIndexOf("/"));
          if (dir) await sandbox.commands.run(`mkdir -p '${homeDir}/${dir}'`, { timeoutMs: 3000 }).catch(() => {});
          return sandbox.files.write(`${homeDir}/${path}`, content);
        })
      );

      // If globals.css was fixed, clear .next cache so CSS recompiles
      if (Object.keys(fixResult.files).some(f => f.includes("globals.css"))) {
        sandbox.commands.run(`rm -rf '${homeDir}/.next/cache'`, { timeoutMs: 3000 }).catch(() => {});
      }

      const totalMs = Date.now() - t0;
      console.log(`[Autofix] ⚡ Done in ${totalMs}ms`);

      return NextResponse.json({
        ok: true,
        fixed: Object.keys(fixResult.files),
        explanation: fixResult.explanation,
        ready: true, // HMR will pick up changes
        duration: totalMs,
      });
    } catch (sandboxErr: any) {
      console.error("[Autofix] Sandbox write failed:", sandboxErr);
      const is404 = sandboxErr?.message?.includes("404") || sandboxErr?.status === 404;
      return NextResponse.json({
        ok: true, fixed: Object.keys(fixResult.files),
        explanation: fixResult.explanation,
        error: is404 ? "Sandbox expired" : "Failed to write",
        requiresWakeup: is404, savedToDb: true,
        duration: Date.now() - t0,
      });
    }
  } catch (err: any) {
    console.error("[Autofix API] Error:", err);
    return NextResponse.json({ error: err.message, duration: Date.now() - t0 }, { status: 500 });
  }
}
