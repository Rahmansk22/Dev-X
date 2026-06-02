import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Sandbox } from "e2b";
import { getCurrentUserId } from "@/lib/auth";
import { SANDBOX_WORKSPACE_DIR, CANONICAL_NEXT_CONFIG_TS, sanitizeShadcnUtilities, sanitizePreviewFile } from "@/lib/sandbox-preview";
import { canonicalizeDevxGeneratedPath } from "@/lib/devx-app-schema";
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
- Case Clashing / Capitalization Error → The spelling and capitalization of files created on disk MUST be 100% identical to their imported paths in import statements (e.g. if page imports MovieModal from @/components/MovieModal, you must write the file as components/MovieModal.tsx, NOT movieModal.tsx or moviemodal.tsx). Linux paths are strictly case-sensitive.
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
    // PRE-PASS: Blanket sanitize ALL files for Tailwind v4 CSS variable
    // function syntax (text-(--muted-foreground) etc.) that crashes builds.
    // This runs BEFORE any AI call and guarantees the fix regardless of
    // which file the error points to.
    // ══════════════════════════════════════════════════════════════════════
    const sanitizedFiles: Record<string, string> = {};
    let sanitizeCount = 0;
    for (const [path, content] of Object.entries(files)) {
      if (!/\.(tsx?|jsx?|css|scss|mjs)$/.test(path)) continue;
      const sanitized = sanitizeShadcnUtilities(content);
      if (sanitized !== content) {
        sanitizedFiles[path] = sanitized;
        sanitizeCount++;
      }
    }

    if (sanitizeCount > 0) {
      console.log(`[Autofix] 🧹 PRE-PASS: Sanitized ${sanitizeCount} files with CSS variable syntax`);
      Object.assign(files, sanitizedFiles);

      // Save sanitized files to DB
      await prisma.fragment.update({
        where: { id: latestFragment.id },
        data: { files },
      });

      // Trigger a wakeup to re-deploy all files and restart the dev server
      // This ensures the sandbox is alive and the preview URL is valid
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const wakeupRes = await fetch(`${appUrl}/api/projects/${projectId}/wakeup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
        });
        const wakeupData = await wakeupRes.json().catch(() => ({}));
        console.log(`[Autofix] 🔄 Wakeup triggered: status=${wakeupData.status || 'unknown'}, success=${wakeupData.success}`);
      } catch (wakeupErr) {
        console.warn('[Autofix] Wakeup trigger failed (files still saved to DB):', wakeupErr);
      }

      const totalMs = Date.now() - t0;
      console.log(`[Autofix] ⚡ Pre-pass sanitization + wakeup done in ${totalMs}ms`);
      return NextResponse.json({
        ok: true,
        fixed: Object.keys(sanitizedFiles),
        explanation: `Sanitized ${sanitizeCount} files: fixed Tailwind v4 CSS variable syntax (text-(--var), bg-(--var), etc.)`,
        ready: true,
        instant: true,
        requiresWakeup: true,
        duration: totalMs,
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // FAST-PATH: Instant fixes for known error patterns — NO AI call needed
    // Target: <2s instead of 27s
    // ══════════════════════════════════════════════════════════════════════
    const instantFix = tryInstantFix(errorText, files);
    if (instantFix) {
      console.log(`[Autofix] ⚡ INSTANT FIX (no AI): ${instantFix.explanation}`);

      // Auto-heal the fixed files + sanitize CSS variable syntax
      const healedFiles = autoHealAllFiles({ ...files, ...instantFix.files });
      for (const [path, content] of Object.entries(instantFix.files)) {
        if (/\.(tsx?|jsx?|css|scss|mjs)$/.test(path)) {
          instantFix.files[path] = sanitizeShadcnUtilities(content);
        }
      }
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

    // Classify the error type FIRST so we can make smart decisions about context
    const isModuleNotFoundError = /Module not found|Can't resolve/i.test(errorText);
    const isCssOrConfigError = /postcss|@tailwindcss|globals\.css|tailwind/i.test(errorText);

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

    // CONDITIONAL core file injection:
    // Only include CSS/config files when the error is actually about CSS/config.
    // For "Module not found" errors, these are irrelevant noise that misleads the AI.
    if (isCssOrConfigError) {
      const coreFiles = ["app/globals.css", "app/layout.tsx", "package.json", "postcss.config.mjs"];
      for (const core of coreFiles) {
        if (files[core] && !relevantFiles[core]) {
          relevantFiles[core] = files[core];
        }
      }
    }

    // For "Module not found" errors: include the IMPORTING file so AI can see
    // what the missing module should export, and include sibling files in the
    // same directory as the missing module for style/pattern reference.
    if (isModuleNotFoundError) {
      // Find the importing file (the one that has the broken import)
      const importingFileMatch = errorText.match(/\.\/(?:app\/)?([^\s(]+\.tsx?)\s*\(/);
      if (importingFileMatch) {
        const importingPath = importingFileMatch[1];
        const candidates = [importingPath, `app/${importingPath}`, importingPath.replace(/^app\//, "")];
        for (const c of candidates) {
          if (files[c] && !relevantFiles[c]) {
            relevantFiles[c] = files[c];
          }
        }
      }

      // Find sibling files in the same directory as the missing module for pattern reference
      const missingModuleMatch = errorText.match(/Can't resolve ['"]@\/([^'"]+)['"]/i);
      if (missingModuleMatch) {
        const missingDir = missingModuleMatch[1].substring(0, missingModuleMatch[1].lastIndexOf("/"));
        if (missingDir) {
          for (const [path, content] of Object.entries(files)) {
            if (path.startsWith(missingDir + "/") && !relevantFiles[path]) {
              relevantFiles[path] = content;
            }
          }
        }
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
5. If the error is "Module not found" / "Can't resolve": the file does NOT exist. You MUST CREATE IT with the correct exports matching how it's imported. Include the new file in your JSON output.
6. Do NOT return files you didn't change or create`;

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

    // 4. Parse response — with JSON repair fallback for truncated AI responses
    let fixResult: { files: Record<string, string>; explanation?: string };
    try {
      const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      fixResult = JSON.parse(cleaned);
    } catch {
      // ═══ JSON REPAIR: AI response was truncated (same as functions.ts Strategy 1B) ═══
      console.warn("[Autofix] ⚠️ JSON.parse failed. Attempting regex repair...");
      const repairFiles: Record<string, string> = {};
      const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      // Extract individual file entries: "path": "content"
      const fileObjRegex = /"([^"]+\.(?:tsx?|jsx?|css|mjs|json))"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let fileMatch;
      while ((fileMatch = fileObjRegex.exec(cleaned)) !== null) {
        try {
          const filePath = fileMatch[1];
          const fileContent = JSON.parse(`"${fileMatch[2]}"`);
          repairFiles[filePath] = fileContent;
        } catch { /* skip individual file */ }
      }
      if (Object.keys(repairFiles).length > 0) {
        console.log(`[Autofix] 🔧 Repaired ${Object.keys(repairFiles).length} files from broken AI JSON.`);
        fixResult = { files: repairFiles, explanation: "AI response was truncated — extracted and repaired available files" };
      } else {
        console.error("[Autofix] ❌ Parse failed and repair failed:", rawContent.slice(0, 300));
        return NextResponse.json({ error: "Could not parse AI fix", raw: rawContent.slice(0, 200) }, { status: 500 });
      }
    }

    if (!fixResult.files || Object.keys(fixResult.files).length === 0) {
      return NextResponse.json({ error: "AI returned no fixes" }, { status: 500 });
    }

    // 5. Auto-heal imports + FULL sanitization (includes unterminated string repair, truncation fix, etc.)
    fixResult.files = autoHealAllFiles(fixResult.files);
    for (const [path, content] of Object.entries(fixResult.files)) {
      if (/\.(tsx?|jsx?|css|scss|mjs)$/.test(path)) {
        fixResult.files[path] = sanitizePreviewFile(path, content);
      }
    }

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
  const moduleNotFound = errorText.match(/Module not found.*['"]([^'"]+)['"]/i) ||
    errorText.match(/Can't resolve ['"]([^'"]+)['"]/i);
  if (moduleNotFound) {
    const missingModule = moduleNotFound[1];
    const isAliasPath = missingModule.startsWith("@/");
    const resolvedPath = isAliasPath ? missingModule.replace("@/", "") : missingModule;
    const isComponent = resolvedPath.startsWith("components/");
    const isLib = resolvedPath.startsWith("lib/") || resolvedPath.startsWith("hooks/");
    
    lines.push(`🔴 TYPE: Module Not Found — FILE DOES NOT EXIST`);
    lines.push(`❌ MISSING FILE: ${missingModule} (resolves to ${resolvedPath}.tsx or ${resolvedPath}.ts)`);
    lines.push(`⚠️ THIS FILE WAS NEVER CREATED. You MUST create it.`);
    
    if (isComponent) {
      lines.push(`✅ FIX: CREATE the file ${resolvedPath}.tsx with a proper React component`);
      lines.push(`📝 ACTION: Look at the importing file to see HOW the component is used (props, default vs named export)`);
      lines.push(`📝 ACTION: Match the export style — if imported as \"import X from\" use \"export default function X\", if \"import { X }\" use \"export function X\"`);
    } else if (isLib) {
      lines.push(`✅ FIX: CREATE the file ${resolvedPath}.ts with the expected exports`);
      lines.push(`📝 ACTION: Look at the importing file to see WHAT functions/types are imported, then create them`);
    } else {
      lines.push(`✅ FIX: CREATE the missing file at ${resolvedPath}.tsx or ${resolvedPath}.ts`);
    }
    
    // Find which file is doing the import
    const importerMatch = errorText.match(/\.\/(?:app\/)?([^\s(]+\.tsx?)\s*\(/);
    if (importerMatch) {
      lines.push(`📁 IMPORTING FILE: ${importerMatch[1]} — READ THIS to understand what the missing file should export`);
    }
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

  // Unterminated string constant (from truncated AI JSON repair)
  if (errorText.match(/Unterminated string constant/i) || errorText.match(/Parsing ecmascript source code failed/i)) {
    lines.push(`🔴 TYPE: Unterminated String Constant (likely from truncated AI output)`);
    lines.push(`⚠️ The AI's code was cut off mid-string during generation. The file has unclosed quotes.`);
    lines.push(`✅ FIX: Find lines with an odd number of quotes and close them`);
    if (fileLineMatch) {
      lines.push(`📍 Start scanning at line ${fileLineMatch[2]} in ${fileLineMatch[1]}`);
    }
  }

  // Unescaped JSX entities (different from unterminated strings)
  if (errorText.match(/apostrophe|unescaped entity/i)) {
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
  ) || errorText.match(
    /Can't resolve ['"]@\/([^'"]+)['"]/i
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
        return null; // Let auto-heal handle it
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

    // ── FIX 4b: Generate missing component/lib/hooks files ──
    // Read the importing file to understand what the missing module should export
    const importingFileMatch = errorText.match(/\.\/(?:app\/)?([^\s(]+\.tsx?)\s*\(/);
    const isComponent = missingPath.startsWith("components/");
    const isLib = missingPath.startsWith("lib/") || missingPath.startsWith("hooks/");
    
    if (isComponent || isLib) {
      // Find the importing file to understand what's needed
      let importContext = "";
      if (importingFileMatch) {
        const importerPath = importingFileMatch[1];
        const importerCandidates = [importerPath, `app/${importerPath}`, importerPath.replace(/^app\//, "")];
        for (const c of importerCandidates) {
          if (files[c]) {
            importContext = files[c];
            break;
          }
        }
      }

      // Extract the component/function name from the import path
      const moduleName = missingPath.split("/").pop() || "Component";
      // PascalCase it for component names
      const componentName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
      
      // Determine import style from the importing file
      const isDefaultImport = importContext.includes(`import ${componentName} from`);
      const isNamedImport = importContext.includes(`{ ${componentName}`) || importContext.includes(`{${componentName}`);
      
      // Extract prop usage hints from the importing file
      const propHints = extractPropHints(importContext, componentName);
      
      if (isComponent) {
        const filePath = `${missingPath}.tsx`;
        const exportStyle = isNamedImport 
          ? `export function ${componentName}` 
          : `export default function ${componentName}`;
        
        const stubContent = `"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

${propHints.interfaceBlock}

${exportStyle}(${propHints.propsParam}) {
  return (
    <div className="w-full">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white">${componentName}</h3>
        <p className="text-sm text-gray-400 mt-2">Component placeholder — customize this component.</p>
      </div>
    </div>
  );
}
`;
        return {
          files: { [filePath]: stubContent },
          explanation: `Created missing component ${filePath} (${isDefaultImport ? 'default' : 'named'} export matching import in ${importingFileMatch?.[1] || 'page.tsx'})`,
        };
      }

      if (isLib) {
        const filePath = `${missingPath}.ts`;
        // Extract imported names from the importing file
        const importedNames = extractImportedNames(importContext, missingPath);
        
        let stubContent = `// Auto-generated stub for ${missingPath}\n\n`;
        for (const name of importedNames) {
          // Check if it looks like a type (starts with uppercase and is used as Type)
          const isType = /^[A-Z]/.test(name) && (importContext.includes(`: ${name}`) || importContext.includes(`<${name}`));
          if (isType) {
            stubContent += `export interface ${name} {\n  [key: string]: any;\n}\n\n`;
          } else {
            stubContent += `export function ${name}(...args: any[]): any {\n  // TODO: implement\n  return null;\n}\n\n`;
          }
        }
        
        if (importedNames.length === 0) {
          // Default export
          stubContent += `export default function ${componentName}(...args: any[]): any {\n  // TODO: implement\n  return null;\n}\n`;
        }

        return {
          files: { [filePath]: stubContent },
          explanation: `Created missing module ${filePath} with stub exports matching imports in ${importingFileMatch?.[1] || 'unknown'}`,
        };
      }
    }
  }

  // ── FIX 5: Tailwind v4 CSS variable function syntax crash ──
  // Error: text-(--muted-foreground) or bg-(--background) etc.
  const cssVarSyntax = errorText.match(/text-\(--|bg-\(--|border-\(--|Parsing ecmascript.*text-\(/i);
  if (cssVarSyntax) {
    // Find the file mentioned in the error
    const errorFileMatch = errorText.match(/\.\/(?:app\/)?([^\s(]+\.tsx?)/);
    if (errorFileMatch) {
      const rawPath = errorFileMatch[1];
      const candidates = [rawPath, `app/${rawPath}`, rawPath.replace(/^app\//, "")];
      for (const candidate of candidates) {
        if (files[candidate]) {
          const fixed = sanitizeShadcnUtilities(files[candidate]);
          if (fixed !== files[candidate]) {
            return {
              files: { [candidate]: fixed },
              explanation: `Fixed Tailwind v4 CSS variable syntax (text-(--var)) in ${candidate}`,
            };
          }
        }
      }
    }
  }

  // ── FIX 6: Unterminated string constant (from truncated AI JSON) ──
  // Error: Parsing ecmascript source code failed / Unterminated string constant
  // Root cause: AI JSON was truncated, regex repair extracted file with unclosed string literals
  const unterminatedString = errorText.match(/Unterminated string constant/i) ||
    errorText.match(/Parsing ecmascript source code failed/i);
  if (unterminatedString) {
    const errorFileMatch = errorText.match(/\.\/(?:app\/)?([^\s(]+\.tsx?)/);
    if (errorFileMatch) {
      const rawPath = errorFileMatch[1];
      const canonicalized = canonicalizeDevxGeneratedPath(rawPath);
      const candidates = [rawPath, `app/${rawPath}`, rawPath.replace(/^app\//, ""), canonicalized];
      for (const candidate of candidates) {
        if (files[candidate]) {
          const fixedContent = repairUnterminatedStrings(files[candidate]);
          if (fixedContent !== files[candidate]) {
            return {
              files: { [candidate]: fixedContent },
              explanation: `Fixed unterminated string constant(s) in ${candidate} — closed unclosed quote literals caused by truncated AI generation`,
            };
          }
        }
      }
    }
  }
  // ── FIX 7: "Element type is invalid" — Default/Named import mismatch ──
  // Runtime Error: Element type is invalid: expected a string... but got: undefined
  // Root cause: page.tsx does `import Navbar from "@/components/Navbar"` (default import)
  //             but Navbar.tsx has `export function Navbar() {}` (named export, no default)
  //             → Navbar is undefined at runtime
  const elementTypeInvalid = errorText.match(/Element type is invalid/i);
  const renderMethodMatch = errorText.match(/Check the render method of [`']?(\w+)[`']?/i);
  const undefinedComponentMatch = errorText.match(/but got:\s*(?:undefined|object)/i);
  if (elementTypeInvalid && undefinedComponentMatch) {
    // Find which component is undefined from the error stack
    // The error usually points to a line like: <Navbar /> or <Hero />
    const jsxComponentMatch = errorText.match(/<(\s*[A-Z][A-Za-z0-9]*)\s/);
    const brokenComponentName = jsxComponentMatch?.[1]?.trim();

    if (brokenComponentName) {
      // Find the file that imports this component
      const fixedFiles: Record<string, string> = {};
      let explanation = "";

      for (const [filePath, content] of Object.entries(files)) {
        if (!/\.(tsx?|jsx?)$/.test(filePath)) continue;

        // Check if this file has a default import for the broken component
        const defaultImportRegex = new RegExp(
          `import\\s+${brokenComponentName}\\s+from\\s*['"]@\\/([^'"]+)['"]`
        );
        const defaultImportMatch = content.match(defaultImportRegex);
        if (!defaultImportMatch) continue;

        const importPath = defaultImportMatch[1]; // e.g. "components/Navbar"

        // Find the target file
        const targetCandidates = [
          importPath + ".ts", importPath + ".tsx",
          importPath + "/index.ts", importPath + "/index.tsx", importPath,
        ];
        let targetPath: string | undefined;
        let targetContent: string | undefined;
        for (const c of targetCandidates) {
          if (files[c]) { targetPath = c; targetContent = files[c]; break; }
          if (files["app/" + c]) { targetPath = "app/" + c; targetContent = files["app/" + c]; break; }
        }

        if (!targetContent || !targetPath) continue;

        // Check if target has default export
        const hasDefault = /export\s+default\s+/.test(targetContent);
        if (hasDefault) continue; // Not the problem

        // Check if target has a named export matching the component
        const hasNamedExport = new RegExp(
          `export\\s+(?:const|function|class|async\\s+function)\\s+${brokenComponentName}\\b`
        ).test(targetContent);

        if (hasNamedExport) {
          // Rewrite import from default to named
          const oldImport = defaultImportMatch[0];
          const newImport = `import { ${brokenComponentName} } from "@/${importPath}"`;
          fixedFiles[filePath] = content.replace(oldImport, newImport);
          explanation = `Fixed default/named mismatch: ${brokenComponentName} — rewrote to named import in ${filePath} (target has named export)`;
          break;
        } else {
          // Target has the function but no export — add export default
          const hasDef = new RegExp(`(?:function|const|class)\\s+${brokenComponentName}\\b`).test(targetContent);
          if (hasDef) {
            fixedFiles[targetPath] = targetContent.trimEnd() + `\n\nexport default ${brokenComponentName};\n`;
            explanation = `Fixed default/named mismatch: added "export default ${brokenComponentName}" to ${targetPath}`;
            break;
          }
        }
      }

      if (Object.keys(fixedFiles).length > 0) {
        return { files: fixedFiles, explanation };
      }
    }
  }

  // ── FIX 8: next.config.ts syntax errors — Replace with canonical version ──
  // Error: Parsing source code failed in next.config.ts (broken quotes, malformed JS)
  // Root cause: AI generates config with hallucinated syntax like "https""" or }"
  // Fix: Replace the entire file with our known-good canonical version.
  const isNextConfigError = /next\.config\.(ts|mjs|js)/i.test(errorText);
  const isSyntaxError = /SyntaxError|Unexpected token|Expected.*got|Parsing.*source code failed/i.test(errorText);
  if (isNextConfigError && isSyntaxError) {
    const configPath = files["next.config.ts"] ? "next.config.ts" 
      : files["next.config.mjs"] ? "next.config.mjs" 
      : files["next.config.js"] ? "next.config.js" 
      : "next.config.ts";
    return {
      files: { [configPath]: CANONICAL_NEXT_CONFIG_TS },
      explanation: `Replaced broken ${configPath} with canonical version — AI generated malformed config syntax`,
    };
  }

  // ── FIX 9: Consecutive quote corruption — "Expected ',', got 'string literal'" ──
  // Error: Parsing ecmascript source code failed / Expected ',', got 'string literal (, "")'
  // Root cause: AI hallucinates runs of 3+ consecutive quotes inside string values:
  //   { label: "All""""", value: "all" }""",
  // These aren't unterminated strings (FIX 6), they're EXTRA quotes that break parsing.
  // Fix: Re-sanitize the file through sanitizePreviewFile which now has consecutive-quote collapse.
  const isConsecutiveQuoteError = /Expected.*got ['"]?string literal/i.test(errorText) ||
    /got ['"]?['"]/.test(errorText);
  if (isConsecutiveQuoteError || (isSyntaxError && !isNextConfigError)) {
    const errorFileMatch2 = errorText.match(/\.\/(?:app\/)?([^\s(]+\.tsx?)\s*\(/) ||
      errorText.match(/\.\/([^\s(]+\.tsx?)/);
    if (errorFileMatch2) {
      const rawPath = errorFileMatch2[1];
      const canonicalized = canonicalizeDevxGeneratedPath(rawPath);
      const candidates = [rawPath, `app/${rawPath}`, rawPath.replace(/^app\//, ""), canonicalized];
      for (const candidate of candidates) {
        if (files[candidate]) {
          // Run sanitizePreviewFile which now has the consecutive-quotes-collapse logic
          const resanitized = sanitizePreviewFile(candidate, files[candidate]);
          if (resanitized !== files[candidate]) {
            return {
              files: { [candidate]: resanitized },
              explanation: `Fixed consecutive quote corruption in ${candidate} — collapsed hallucinated multi-quote sequences ("All""""" → "All")`,
            };
          }
        }
      }
    }
  }

  return null; // No instant fix available — fall through to AI
}

// ══════════════════════════════════════════════════════════════════════════
// HELPER: Extract prop usage hints from the importing file
// Looks at how the component is used (<MovieModal movie={...} onClose={...} />)
// to generate a matching props interface
// ══════════════════════════════════════════════════════════════════════════

function extractPropHints(importContext: string, componentName: string): {
  interfaceBlock: string;
  propsParam: string;
} {
  if (!importContext) {
    return { interfaceBlock: "", propsParam: "" };
  }

  // Find JSX usage: <ComponentName prop1={...} prop2="..." />
  const jsxRegex = new RegExp(
    `<${componentName}[\\s\\n]([^>]*?)(?:\\/>|>)`,
    "s"
  );
  const jsxMatch = importContext.match(jsxRegex);

  if (!jsxMatch) {
    return { interfaceBlock: "", propsParam: "" };
  }

  const propsString = jsxMatch[1];
  // Extract prop names: key={value} or key="value" or key
  const propNames = new Set<string>();
  const propRegex = /(\w+)(?:\s*=\s*(?:\{[^}]*\}|"[^"]*"|'[^']*'))?/g;
  let m;
  while ((m = propRegex.exec(propsString)) !== null) {
    const name = m[1];
    // Skip React internal props and event handlers we can type properly
    if (name === "className" || name === "key" || name === "ref" || name === "style") continue;
    propNames.add(name);
  }

  if (propNames.size === 0) {
    return { interfaceBlock: "", propsParam: "" };
  }

  // Build interface
  const propLines = Array.from(propNames)
    .map((name) => {
      // Common event handler patterns
      if (name.startsWith("on") && name.length > 2 && name[2] === name[2].toUpperCase()) {
        return `  ${name}?: (...args: any[]) => void;`;
      }
      return `  ${name}?: any;`;
    })
    .join("\n");

  const interfaceName = `${componentName}Props`;
  const interfaceBlock = `interface ${interfaceName} {\n${propLines}\n}`;
  const propsParam = `{ ${Array.from(propNames).join(", ")} }: ${interfaceName}`;

  return { interfaceBlock, propsParam };
}

// ══════════════════════════════════════════════════════════════════════════
// HELPER: Extract imported names from import statements
// Given: import { fetchMovies, Movie } from "@/lib/api"
// Returns: ["fetchMovies", "Movie"]
// ══════════════════════════════════════════════════════════════════════════

function extractImportedNames(importContext: string, modulePath: string): string[] {
  if (!importContext) return [];

  const names: string[] = [];
  // Match: import { A, B, C } from "@/modulePath" or import { A, B, C } from "@/modulePath"
  const importRegex = new RegExp(
    `import\\s*\\{([^}]+)\\}\\s*from\\s*["']@/${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`,
    "g"
  );
  let m;
  while ((m = importRegex.exec(importContext)) !== null) {
    const nameList = m[1];
    nameList.split(",").forEach((name) => {
      const cleaned = name.trim().replace(/\s+as\s+\w+/, ""); // strip "as X" aliases
      if (cleaned && cleaned !== "type") {
        names.push(cleaned);
      }
    });
  }

  return names;
}

// ══════════════════════════════════════════════════════════════════════════
// HELPER: Repair unterminated string literals in generated code
// Scans each line for unbalanced quotes and closes them.
// This is the autofix counterpart of sanitizePreviewFile's section 4.5.
// ══════════════════════════════════════════════════════════════════════════

function repairUnterminatedStrings(content: string): string {
  const lines = content.split("\n");
  let repaired = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    // Skip comment lines
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

    let doubleQuoteCount = 0;
    let singleQuoteCount = 0;
    let inTemplate = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const prev = j > 0 ? line[j - 1] : "";
      if (ch === "`") { inTemplate = !inTemplate; continue; }
      if (inTemplate) continue;
      if (ch === '"' && prev !== "\\") doubleQuoteCount++;
      if (ch === "'" && prev !== "\\") singleQuoteCount++;
    }

    if (doubleQuoteCount % 2 !== 0) {
      const trailingComma = line.trimEnd().endsWith(",");
      if (trailingComma) {
        lines[i] = line.trimEnd().slice(0, -1) + '",';
      } else {
        lines[i] = line.trimEnd() + '"';
      }
      repaired = true;
    }
    if (singleQuoteCount % 2 !== 0) {
      const trailingComma = line.trimEnd().endsWith(",");
      if (trailingComma) {
        lines[i] = line.trimEnd().slice(0, -1) + "',";
      } else {
        lines[i] = line.trimEnd() + "'";
      }
      repaired = true;
    }
  }
  return repaired ? lines.join("\n") : content;
}
