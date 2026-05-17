import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Sandbox } from "e2b";
import { getCurrentUserId } from "@/lib/auth";
import { SANDBOX_WORKSPACE_DIR } from "@/lib/sandbox-preview";
import { autoHealAllFiles } from "@/lib/auto-heal-imports";

/**
 * TURBO AUTOFIX — Fixes errors exactly like a senior developer would.
 *
 * Strategy: Read error → Find file → Read code → Understand context → Surgical fix
 * No guessing. No touching unrelated files. Fix the exact root cause.
 */

const SURGICAL_FIX_PROMPT = `You are a senior Next.js developer debugging a build error. Think step by step:

STEP 1: READ THE ERROR
- What is the exact error message?
- Which file is the error in? What line number?
- What is the error TYPE? (import mismatch, missing module, syntax error, etc.)

STEP 2: FIND THE ROOT CAUSE
- Read the code at the error location
- If it's an import error: What does the import expect? What does the target file actually export?
- If it's a missing file: What file is being imported? Does it need to be created?
- If it's a syntax error: What's the malformed code? What should it be?
- If it's a type error: What type is expected vs what's provided?

STEP 3: MAKE THE MINIMUM FIX
- Change ONLY the broken line(s). Do NOT rewrite entire files.
- Do NOT add unrelated features, styles, or improvements.
- Do NOT touch files that aren't mentioned in the error.
- Return the COMPLETE fixed file (not just a diff).

COMMON FIXES (use these patterns):
- "Export X doesn't exist" → Change the import name to match the actual export
- "Module not found @/lib/X" → Create the missing file with proper exports
- "use client" error → Add "use client"; as line 1
- "Cannot find module" → Fix the import path or create the file
- PostCSS error → Create postcss.config.mjs with @tailwindcss/postcss
- Unescaped entity → Replace ' with &apos; and " with &quot; in JSX text
- Unused variable → Remove it or prefix with _
- Hook in conditional → Move hook to top level before any if/return

TECH STACK (never change these):
- Next.js 15, React 19, TypeScript, Tailwind CSS v4
- Tailwind v4: @import "tailwindcss" in globals.css, NO tailwind.config, NO @apply
- shadcn: import { Button } from "@/components/ui/button"
- Toast: import { toast } from "sonner"

OUTPUT FORMAT (strict JSON, no markdown, no \`\`\`):
{ "files": { "path/file.tsx": "complete fixed file content" }, "explanation": "1-line: what was wrong and what you changed" }`;


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

    // 2. SMART FILE EXTRACTION — Parse error to find EXACT files involved
    const relevantFiles: Record<string, string> = {};

    // Extract file paths mentioned in the error (./app/page.tsx, [project]/app/lib/data.ts, etc.)
    const mentionedPaths = new Set<string>();
    const pathPatterns = [
      /\.\/(?:app\/)?([^\s(]+\.tsx?)/g,          // ./app/page.tsx (5:1)
      /\[project\]\/(?:app\/)?([^\s[\]]+\.tsx?)/g, // [project]/app/lib/data.ts
      /['"]@\/([^'"]+)['"]/g,                     // '@/lib/data'
      /(?:^|\s)(app\/[^\s(]+\.(?:tsx?|css|mjs))/gm, // app/page.tsx standalone
    ];
    for (const pattern of pathPatterns) {
      let m;
      while ((m = pattern.exec(errorText)) !== null) {
        const rawPath = m[1].replace(/^app\//, ""); // normalize
        mentionedPaths.add(rawPath);
        mentionedPaths.add(`app/${rawPath}`);
        // Also try adding extensions for alias paths (@/lib/data → lib/data.ts)
        if (!rawPath.match(/\.\w+$/)) {
          mentionedPaths.add(`${rawPath}.ts`);
          mentionedPaths.add(`${rawPath}.tsx`);
          mentionedPaths.add(`app/${rawPath}.ts`);
          mentionedPaths.add(`app/${rawPath}.tsx`);
        }
      }
    }

    // Match mentioned paths against actual files
    for (const [path, content] of Object.entries(files)) {
      const isDirectMatch = mentionedPaths.has(path);
      const isBaseNameMatch = Array.from(mentionedPaths).some(mp => path.endsWith(mp));
      if (isDirectMatch || isBaseNameMatch) {
        relevantFiles[path] = content;
      }
    }

    // Always include core files that affect builds
    const coreFiles = ["app/globals.css", "app/layout.tsx", "package.json", "postcss.config.mjs"];
    for (const core of coreFiles) {
      if (files[core] && !relevantFiles[core]) {
        relevantFiles[core] = files[core];
      }
    }

    // Fallback: if nothing matched, include all TSX files
    if (Object.keys(relevantFiles).length <= 1) {
      for (const [path, content] of Object.entries(files)) {
        if (/\.(tsx?|css)$/.test(path)) relevantFiles[path] = content;
      }
    }

    console.log(`[Autofix] 🔍 ${Object.keys(relevantFiles).length} relevant files (${Object.keys(relevantFiles).join(", ")}) in ${Date.now() - t0}ms`);

    // 3. BUILD THE FIX TICKET — Like a tech lead assigning a bug to a senior dev
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI API key not configured" }, { status: 500 });

    // Parse error into structured diagnosis
    const diagnosis = buildDiagnosis(errorText);

    // List ALL file paths so AI knows what exists in the project
    const allFilePaths = Object.keys(files).sort();

    const userPrompt = `## BUG TICKET

### Error
${errorText.slice(0, 600)}

### Diagnosis
${diagnosis}

### All Files in Project (${allFilePaths.length} total)
${allFilePaths.join("\n")}

### Source Code (files involved in error)
${Object.entries(relevantFiles)
  .map(([p, c]) => `--- ${p} ---\n${c}`)
  .join("\n\n")}

### Your Task
1. Read the error and source code above
2. Find the EXACT line causing the error
3. Fix ONLY that issue — minimum change possible
4. Return the complete fixed file(s) as JSON
5. Do NOT return files you didn't change`;

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
// DIAGNOSTIC ENGINE — Parses raw errors into structured senior-dev diagnosis
// Tells AI exactly what's wrong so it doesn't guess
// ══════════════════════════════════════════════════════════════════════════

function buildDiagnosis(errorText: string): string {
  const lines: string[] = [];

  // Extract file + line number
  const fileLineMatch = errorText.match(/\.\/(?:app\/)?([^\s(]+\.tsx?)\s*\((\d+):(\d+)\)/);
  if (fileLineMatch) {
    lines.push(`📍 ERROR LOCATION: ${fileLineMatch[1]} at line ${fileLineMatch[2]}, column ${fileLineMatch[3]}`);
  }

  // Export mismatch
  const exportMismatch = errorText.match(/Export\s+(\w+)\s+doesn't exist in target module/i);
  const didYouMean = errorText.match(/Did you mean to import\s+(\w+)\s*\?/i);
  const targetModule = errorText.match(/\[project\]\/(?:app\/)?([^\s[\]]+\.tsx?)/);
  if (exportMismatch) {
    lines.push(`🔴 TYPE: Import/Export Mismatch`);
    lines.push(`❌ WRONG: import { ${exportMismatch[1]} } — this export does NOT exist`);
    if (didYouMean) lines.push(`✅ FIX: Change to import { ${didYouMean[1]} } — this is the actual export name`);
    if (targetModule) lines.push(`📁 TARGET MODULE: ${targetModule[1]} — check this file's exports`);
    if (fileLineMatch) lines.push(`📝 ACTION: In ${fileLineMatch[1]}, replace "${exportMismatch[1]}" with "${didYouMean?.[1] || 'the correct export name'}" on line ${fileLineMatch[2]}`);
  }

  // Module not found
  const moduleNotFound = errorText.match(/Module not found.*['"]([^'"]+)['"]/i);
  if (moduleNotFound) {
    lines.push(`🔴 TYPE: Module Not Found`);
    lines.push(`❌ MISSING: ${moduleNotFound[1]}`);
    lines.push(`✅ FIX: Create the missing file, or fix the import path`);
  }

  // Use client error
  if (errorText.match(/only works in Client Components/i) || errorText.match(/cannot be used.*Server Component/i)) {
    lines.push(`🔴 TYPE: Missing "use client" Directive`);
    lines.push(`✅ FIX: Add "use client"; as the FIRST line of the file that uses hooks/events`);
  }

  // Syntax error
  if (errorText.match(/SyntaxError|Unexpected token|parsing error/i)) {
    lines.push(`🔴 TYPE: Syntax Error`);
    lines.push(`✅ FIX: Check for unclosed brackets, missing semicolons, or invalid JSX`);
  }

  // PostCSS / Tailwind
  if (errorText.match(/postcss|@tailwindcss/i)) {
    lines.push(`🔴 TYPE: PostCSS/Tailwind Configuration Error`);
    lines.push(`✅ FIX: Ensure postcss.config.mjs exists with @tailwindcss/postcss plugin`);
  }

  // Unescaped JSX entities
  if (errorText.match(/Unterminated string|apostrophe|quote/i)) {
    lines.push(`🔴 TYPE: Unescaped Character in JSX`);
    lines.push(`✅ FIX: Replace ' with &apos; and " with &quot; in JSX text content`);
  }

  // Fallback
  if (lines.length === 0) {
    lines.push(`🔴 TYPE: Build Error (unclassified)`);
    lines.push(`📍 Analyze the error message carefully and fix the ROOT CAUSE`);
    lines.push(`⚠️ Do NOT fix unrelated files — fix ONLY what the error describes`);
  }

  return lines.join("\n");
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
