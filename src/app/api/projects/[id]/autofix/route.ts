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

    // ══════════════════════════════════════════════════════════════════════
    // FAST-PATH: Instant fixes for known error patterns — NO AI call needed
    // Target: <2s instead of 27s
    // ══════════════════════════════════════════════════════════════════════
    const instantFix = tryInstantFix(errorText, files);
    if (instantFix) {
      console.log(`[Autofix] ⚡ INSTANT FIX (no AI): ${instantFix.explanation}`);

      // Auto-heal the fixed files
      const healedFiles = autoHealAllFiles({ ...files, ...instantFix.files });
      const updatedFiles = { ...files, ...Object.fromEntries(
        Object.keys(instantFix.files).map(k => [k, healedFiles[k] || instantFix.files[k]])
      )};

      // Save to DB
      await prisma.fragment.update({
        where: { id: latestFragment.id },
        data: { files: updatedFiles },
      });

      // Write to sandbox
      const sandboxId = project.sandboxId;
      if (sandboxId) {
        try {
          const sandbox = await Sandbox.connect(sandboxId);
          const homeDir = SANDBOX_WORKSPACE_DIR;
          await Promise.all(
            Object.entries(instantFix.files).map(async ([path, content]) => {
              const dir = path.substring(0, path.lastIndexOf("/"));
              if (dir) await sandbox.commands.run(`mkdir -p '${homeDir}/${dir}'`, { timeoutMs: 3000 }).catch(() => {});
              return sandbox.files.write(`${homeDir}/${path}`, content);
            })
          );
        } catch (e) {
          console.warn("[Autofix] Sandbox write failed for instant fix:", e);
        }
      }

      const totalMs = Date.now() - t0;
      console.log(`[Autofix] ⚡ Instant fix done in ${totalMs}ms`);
      return NextResponse.json({
        ok: true,
        fixed: Object.keys(instantFix.files),
        explanation: instantFix.explanation,
        ready: true,
        instant: true,
        duration: totalMs,
      });
    }

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

// ══════════════════════════════════════════════════════════════════════════
// INSTANT FIX ENGINE — Pattern-matched fixes that skip AI entirely
// Each fix takes <100ms instead of 15-30s
// ══════════════════════════════════════════════════════════════════════════

type InstantFixResult = { files: Record<string, string>; explanation: string } | null;

function tryInstantFix(errorText: string, files: Record<string, string>): InstantFixResult {

  // ── FIX 1: "Export X doesn't exist" with "Did you mean Y?" ──
  // Error: Export getMovies doesn't exist in target module
  // Did you mean to import categories?
  const exportMismatch = errorText.match(
    /Export\s+(\w+)\s+doesn't exist in target module/i
  );
  const didYouMean = errorText.match(
    /Did you mean to import\s+(\w+)\s*\?/i
  );
  const errorFilePath = errorText.match(
    /\.\/(?:app\/)?([^\s(]+\.tsx?)\s*\(/
  );

  if (exportMismatch && didYouMean && errorFilePath) {
    const wrongName = exportMismatch[1];
    const correctName = didYouMean[1];
    const rawPath = errorFilePath[1];

    // Find the file in our files map
    const candidates = [rawPath, `app/${rawPath}`, rawPath.replace(/^app\//, "")];
    for (const candidate of candidates) {
      if (files[candidate]) {
        const fixed = files[candidate].replace(
          new RegExp(`\\b${wrongName}\\b`, 'g'),
          correctName
        );
        if (fixed !== files[candidate]) {
          return {
            files: { [candidate]: fixed },
            explanation: `Fixed import: ${wrongName} → ${correctName} in ${candidate}`,
          };
        }
      }
    }
  }

  // ── FIX 2: Missing postcss.config.mjs ──
  if (errorText.match(/postcss/i) && !files["postcss.config.mjs"] && !files["postcss.config.js"]) {
    return {
      files: {
        "postcss.config.mjs": `/** @type {import('postcss-load-config').Config} */\nconst config = {\n  plugins: {\n    "@tailwindcss/postcss": {},\n  },\n};\n\nexport default config;\n`,
      },
      explanation: "Created missing postcss.config.mjs for Tailwind v4",
    };
  }

  // ── FIX 3: Missing "use client" ──
  const useClientMatch = errorText.match(
    /(?:useState|useEffect|useRef|useCallback|useMemo|useRouter|onClick|onChange).*(?:is not a function|cannot be used|only works in Client Components)/i
  );
  const useClientFile = errorText.match(/\.\/(?:app\/)?([^\s(]+\.tsx?)/);
  if (useClientMatch && useClientFile) {
    const filePath = useClientFile[1];
    const candidates = [filePath, `app/${filePath}`, filePath.replace(/^app\//, "")];
    for (const candidate of candidates) {
      if (files[candidate] && !files[candidate].startsWith('"use client"') && !files[candidate].startsWith("'use client'")) {
        return {
          files: { [candidate]: `"use client";\n\n${files[candidate]}` },
          explanation: `Added missing "use client" directive to ${candidate}`,
        };
      }
    }
  }

  // ── FIX 4: Module not found for @/ imports ──
  const moduleNotFound = errorText.match(
    /Module not found.*['"]@\/([^'"]+)['"]/i
  );
  if (moduleNotFound) {
    const missingPath = moduleNotFound[1];
    // Check if the file exists with different extension
    const extensions = [".ts", ".tsx", "/index.ts", "/index.tsx"];
    for (const ext of extensions) {
      const tryPath = missingPath + ext;
      if (files[tryPath]) {
        // File exists but import path is wrong — likely needs the extension stripped
        // This is handled by auto-heal, but we can log it
        break;
      }
    }
    // If it's a lib/utils missing, create it
    if (missingPath === "lib/utils" && !files["lib/utils.ts"]) {
      return {
        files: {
          "lib/utils.ts": `import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`,
        },
        explanation: "Created missing lib/utils.ts with cn() helper",
      };
    }
  }

  return null; // No instant fix available — fall through to AI
}
