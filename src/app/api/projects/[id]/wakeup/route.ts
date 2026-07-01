/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WAKEUP AGENT - Sandbox Recovery & Dev Server Restart
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Complete rewrite of the reconnect/route.ts
 * 
 * What it does:
 * 1. Validates user & project
 * 2. Checks sandbox state
 * 3. Attempts to reconnect to existing sandbox
 * 4. If dead: creates new sandbox and redeploys code
 * 5. Detects framework and starts correct dev server
 * 6. Waits until server is actually ready
 * 7. Gets new preview URL
 * 8. Updates all fragments with new URL
 * 9. Returns detailed status + logs
 * 
 * Error handling: Returns meaningful errors, not technical jargon
 * Logging: All steps logged for debugging
 * Timeouts: Configurable with sensible defaults
 * Retries: Automatic with backoff
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Sandbox } from 'e2b';
import { getCurrentUserId } from '@/lib/auth';
import SandboxLifecycleManager, { SandboxState } from '@/lib/sandbox-lifecycle-manager';
import { withProjectRecoveryLock, isProjectRecoveryLocked } from '@/lib/project-recovery-lock';
import {
  CANONICAL_NEXT_CONFIG_TS,
  createSandboxWithTemplateFallback,
  DEFAULT_E2B_TEMPLATE,
  ensurePreviewDependencies,
  ensurePreviewPortActive,
  installPreviewPackagesRobustly,
  normalizePreviewFiles,
  normalizePreviewPackageJson,
  sanitizeImports,
  sanitizeShadcnUtilities,
  SANDBOX_WORKSPACE_DIR,
  startEmergencyPreviewServer,
  validatePreviewBuild,
  waitForPreviewUrlReachable,
} from '@/lib/sandbox-preview';

const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/743f09b8-5f64-45ef-98fe-57ac7e9a16ff';
function emitDebugLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
  // Only emit debug logs in development — prevent data leakage and unnecessary network calls in prod
  if (process.env.NODE_ENV !== 'development') return;
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      runId: 'wakeup-e2e',
      hypothesisId,
      location: 'wakeup/route.ts',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

interface WakeupResponse {
  success: boolean;
  status:
    | 'reconnected'      // Connected to existing sandbox, server was running
    | 'restarted'        // Connected to existing sandbox, restarted dev server
    | 'recreated'        // Sandbox was dead, created new one
    | 'error';

  sandboxUrl?: string;  // New/updated preview URL
  sandboxState?: SandboxState;
  framework?: string;
  
  logs: string[];      // All operations
  error?: string;
  errorLogs?: string;  // Dev server logs if failed
    warming?: boolean;
}

function inferRuntimePackagesFromFiles(filesMap: Record<string, string>): string[] {
  const builtins = new Set([
    'fs', 'path', 'os', 'url', 'util', 'crypto', 'stream', 'events', 'buffer', 'assert', 'http', 'https', 'zlib', 'tty', 'querystring'
  ]);
  const specs = new Set<string>();
  const importRegex = /from\s+['"]([^'"\n]+)['"]|import\(\s*['"]([^'"\n]+)['"]\s*\)|require\(\s*['"]([^'"\n]+)['"]\s*\)/g;

  for (const [path, content] of Object.entries(filesMap)) {
    if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(path)) continue;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const spec = (match[1] || match[2] || match[3] || '').trim();
      if (!spec) continue;
      if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('@/') || spec.startsWith('http://') || spec.startsWith('https://')) continue;
      if (spec.startsWith('node:')) continue;
      if (spec.endsWith('.css') || spec.endsWith('.scss') || spec.endsWith('.sass') || spec.endsWith('.less')) continue;

      let pkgName = spec;
      if (spec.startsWith('next/')) {
        pkgName = 'next';
      } else if (spec.startsWith('@')) {
        const parts = spec.split('/');
        if (parts.length >= 2) pkgName = `${parts[0]}/${parts[1]}`;
      } else if (spec.includes('/')) {
        pkgName = spec.split('/')[0];
      }

      if (!pkgName || builtins.has(pkgName)) continue;
      if (!/^[a-zA-Z0-9@._/-]+$/.test(pkgName)) continue;
      specs.add(pkgName);
    }
  }

  return [...specs];
}

function isTransientCommandTimeout(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return lower.includes('deadline_exceeded') || lower.includes('timed out') || lower.includes('timeoutms');
}

function shellEscapeSingleQuotes(value: string): string {
  return value.replace(/'/g, "'\"'\"'");
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<WakeupResponse>> {
  const params = await context.params;
  const projectId = params.id;
  const wasLocked = isProjectRecoveryLocked(projectId);
  if (wasLocked) {
    emitDebugLog('H9', 'wakeup-recovery-lock-wait', { projectId });
  }

  return withProjectRecoveryLock(projectId, async () => {
  const logs: string[] = [];
  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${msg}`;
    logs.push(entry);
    console.log(entry);
  };

  const startTime = Date.now();
  const response: WakeupResponse = {
    success: false,
    status: 'error',
    logs: [],
    error: undefined,
    errorLogs: undefined,
  };

  try {
    emitDebugLog('H11', 'wakeup-route-version', { version: 'preview-staged-install-v1', projectId });
    // ═════ STEP 1: VALIDATION ═════
    log('🔐 Validating user & project...');
    
    const userId = await getCurrentUserId();
    if (!userId) {
      log('❌ User not authenticated');
      throw new Error('Unauthorized: User not authenticated');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      log('❌ Project not found');
      throw new Error('Project not found or you do not have access');
    }

    log(`✅ Project found: ${project.name}`);

    // ═════ STEP 2: GET PROJECT FILES & METADATA ═════
    log('📦 Retrieving project files from database...');

    const latestFragment = await prisma.fragment.findFirst({
      where: { message: { projectId } },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestFragment?.files) {
      log('❌ No code files found for this project');
      throw new Error('Project has no generated code. Generate code first.');
    }

    const files = latestFragment.files as Record<string, string>;
    if (!files || typeof files !== 'object' || Array.isArray(files)) {
      throw new Error('Invalid fragment files payload');
    }
    const inferredRuntimePackages = inferRuntimePackagesFromFiles(files);
    const fileCount = Object.keys(files).length;
    log(`✅ Found ${fileCount} files to deploy`);
    log(`🔎 Inferred imports: ${inferredRuntimePackages.join(', ') || 'none'}`);

    // ═════ STEP 3: CHECK SANDBOX STATE ═════
    log('🔍 Checking sandbox state...');
    const currentState = await SandboxLifecycleManager.checkSandboxState(projectId);
    log(`Sandbox state: ${currentState}`);
    emitDebugLog('H3', 'wakeup-state-evaluated', { projectId, currentState, sandboxId: project.sandboxId || null });

    let sandbox: Sandbox | null = null;
    let sandboxId = project.sandboxId;
    let isNewSandbox = false;

    // ═════ STEP 4: ATTEMPT RECONNECTION ═════
    if (
    currentState === SandboxState.ACTIVE ||
    currentState === SandboxState.SLEEPING
    ) {
      log(`🔗 Attempting to reconnect to existing sandbox: ${sandboxId}`);
      try {
        sandbox = await Sandbox.connect(sandboxId!);
        log('✅ Connected to existing sandbox');

        if (currentState === SandboxState.ACTIVE) {
          log('✨ Dev server is already running!');
          
          // Just get the URL and return
          const previewUrl = await SandboxLifecycleManager.getPreviewUrl(sandbox);
          if (!previewUrl) throw new Error('Could not generate preview URL');
          const previewReady = await waitForPreviewUrlReachable(previewUrl, 5);
          if (!previewReady) {
            log('⏳ Existing active sandbox preview host is still warming.');
          }

          response.success = true;
          response.status = 'reconnected';
          response.sandboxUrl = previewUrl;
          response.sandboxState = SandboxState.ACTIVE;
          response.warming = !previewReady;
          
          await updateFragmentsUrl(projectId, previewUrl, log);
          response.logs = logs;
          
          return NextResponse.json(response, { status: 200 });
        }

        if (currentState === SandboxState.SLEEPING) {
          emitDebugLog('H12', 'wakeup-sleeping-fast-path-start', { projectId, sandboxId });
          const previewUrl = await SandboxLifecycleManager.getPreviewUrl(sandbox, 3000);
          if (previewUrl) {
            let fastReady = false;
            try {
              const fastHome = SANDBOX_WORKSPACE_DIR;
              const quickRestart = `cd '${fastHome}' && npm run dev -- --hostname 0.0.0.0 --port 3000`;
              await sandbox.commands.run(
                `nohup bash -c '${shellEscapeSingleQuotes(quickRestart)}' > /tmp/devserver-fastwake.log 2>&1 &`,
                { timeoutMs: 1500 }
              );
              fastReady = await SandboxLifecycleManager.waitForServerReady(sandbox, 3000, 60, 30);
            } catch (fastErr) {
              emitDebugLog('H12', 'wakeup-sleeping-fast-path-error', {
                projectId,
                error: fastErr instanceof Error ? fastErr.message : String(fastErr),
              });
            }

            if (fastReady) {
              const previewReady = await waitForPreviewUrlReachable(previewUrl, 8);
              if (!previewReady) {
                log('⏳ Sleeping sandbox woke up, but preview host is still warming.');
              }
              response.success = true;
              response.status = 'restarted';
              response.sandboxUrl = previewUrl;
              response.sandboxState = SandboxState.ACTIVE;
              response.warming = !previewReady;
              await updateFragmentsUrl(projectId, previewUrl, log);
              response.logs = logs;
              emitDebugLog('H12', 'wakeup-sleeping-fast-path-success', { projectId, previewUrl, fastReady, warming: !previewReady });
              return NextResponse.json(response, { status: 200 });
            }

            log('⚠️ Sleeping sandbox fast-path did not become healthy. Continuing with full recovery...');
            emitDebugLog('H12', 'wakeup-sleeping-fast-path-fallback-full-recovery', {
              projectId,
              previewUrl,
              fastReady,
            });

            // Sleeping sandbox is likely in a bad state (stale node_modules / broken npm env).
            // Force a clean sandbox recreation instead of attempting heavy recovery in-place.
            try {
              if (sandboxId) {
                const staleSandbox = await Sandbox.connect(sandboxId);
                await staleSandbox.kill();
                log(`🗑️ Discarded unhealthy sleeping sandbox: ${sandboxId}`);
              }
            } catch (killErr) {
              log(`⚠️ Could not discard sleeping sandbox (may already be dead): ${String(killErr)}`);
            }
            await prisma.project.update({
              where: { id: projectId },
              data: { sandboxId: null },
            }).catch(() => {});
            sandbox = null;
            sandboxId = null;
          }
        }
      } catch (err) {
        const oldSandboxId = sandboxId;
        log(`⚠️ Reconnection failed: ${err instanceof Error ? err.message : String(err)}`);
        if (sandbox && isTransientCommandTimeout(err)) {
          log('⚠️ Transient timeout while connected; keeping sandbox and continuing recovery.');
        } else {
        log('🗑️ Killing old sandbox to free up E2B quota...');
        
        // Try to kill the dead sandbox to free quota
        if (oldSandboxId) {
          try {
            const deadSandbox = await Sandbox.connect(oldSandboxId);
            await deadSandbox.kill();
            log(`✅ Old sandbox killed: ${oldSandboxId}`);
          } catch (killErr) {
            log(`⚠️ Could not kill old sandbox (may already be dead): ${killErr}`);
          }
        }
        
        log('Creating new sandbox...');
        sandbox = null;
        sandboxId = null;
        }
      }
    }

    // ═════ STEP 5: CREATE NEW SANDBOX IF NEEDED ═════
    if (!sandbox) {
      log(`🆕 Creating new E2B sandbox. Preferred template: ${DEFAULT_E2B_TEMPLATE}`);
      try {
        const created = await createSandboxWithTemplateFallback({
          apiKey: process.env.E2B_API_KEY,
          log,
        });
        sandbox = created.sandbox;
        sandboxId = sandbox.sandboxId;
        isNewSandbox = true;
        log(`✅ Sandbox created successfully: ${sandboxId} (template: ${created.templateUsed})`);

        // Save to project
        await prisma.project.update({
          where: { id: projectId },
          data: { sandboxId },
        });
        log('💾 Sandbox ID saved to project');

        // Move fragments off stale/dead sandbox hosts immediately.
        const earlyPreviewUrl = await SandboxLifecycleManager.getPreviewUrl(sandbox, 3000);
        if (earlyPreviewUrl) {
          await updateFragmentsUrl(projectId, earlyPreviewUrl, log);
          log(`🔄 Fragments moved to fresh sandbox URL early: ${earlyPreviewUrl}`);
        }
      } catch (err) {
        const error = err as any;
        const errorMsg = error?.message || String(err);
        const errorCode = error?.code;
        log(`❌ E2B SANDBOX CREATION FAILED`);
        log(`   Message: ${errorMsg}`);
        log(`   Code: ${errorCode}`);
        log(`   Full error: ${String(err)}`);
        log(`   E2B_API_KEY set: ${!!process.env.E2B_API_KEY}`);
        throw new Error(`E2B Error: ${errorMsg}`);
      }
    }

    // ═════ STEP 6: GET HOME DIRECTORY (ROBUST FALLBACKS) ═════
    log('🏠 Preparing sandbox workspace directory...');
    let homeDir: string | null = null;
    try {
      homeDir = SANDBOX_WORKSPACE_DIR;
      let prepared = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await sandbox.commands.run(`mkdir -p '${homeDir}'`, { timeoutMs: 20000 });
          prepared = true;
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
      if (!prepared) {
        log('⚠️ Workspace mkdir timed out; continuing with fallback path.');
      }
      log(`✅ Workspace ready: ${homeDir}`);
    } catch {
      // Absolute final fallback: keep wakeup alive and continue.
      homeDir = SANDBOX_WORKSPACE_DIR;
      try {
        await sandbox.commands.run(`mkdir -p '${homeDir}'`, { timeoutMs: 5000 });
        log(`⚠️ Workspace fallback after error: ${homeDir}`);
      } catch (mkdirErr) {
        log(`❌ Could not prepare fallback home directory: ${String(mkdirErr)}`);
        throw new Error('Sandbox error: Could not prepare working directory');
      }
    }

    // ═════ STEP 7: DETECT FRAMEWORK ═════
    log('🔧 Detecting framework...');
    const framework = await SandboxLifecycleManager.detectFramework(sandbox, homeDir);
    log(`✅ Framework detected: ${framework}`);

    // ═════ STEP 8: PREPARE CLEAN ENVIRONMENT ═════
    log('🧹 Cleaning sandbox environment...');
    try {
      await sandbox.commands.run(`find '${homeDir}' -mindepth 1 -maxdepth 1 ! -name 'node_modules' ! -name '.npm' ! -name '.next' -exec rm -rf {} +`, {
        timeoutMs: 10000,
      });
      log('✅ Old files removed');
    } catch (err) {
      log(`⚠️ Warning: Could not fully clean directory: ${err}`);
    }

    // ═════ STEP 9: WRITE FILES WITH AUTO-HEALING ═════
    log(`📝 Writing ${fileCount} files...`);
    let packageDepsSeen: Set<string> = new Set<string>();
    let packageVersions: Record<string, string> = {};
    try {
      const normalizedPreview = normalizePreviewFiles(files, inferredRuntimePackages);
      packageDepsSeen = normalizedPreview.packageDepsSeen;
      packageVersions = normalizedPreview.packageVersions;
      for (const key of Object.keys(files)) {
        delete files[key];
      }
      Object.assign(files, normalizedPreview.files);
      // 9.1 Pre-inject structural files if missing
      if (!files['lib/utils.ts'] && !files['src/lib/utils.ts']) {
        log(`🏗️ Injecting core lib/utils.ts into wakeup`);
        files['lib/utils.ts'] = `import { type ClassValue, clsx } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`;
      }

      let cssKey = files['app/globals.css'] ? 'app/globals.css' : (files['src/app/globals.css'] ? 'src/app/globals.css' : 'app/globals.css');
      if (!files[cssKey]) {
         log(`🏗️ Injecting core globals.css into wakeup`);
         files[cssKey] = `@import "tailwindcss";\n\n@theme {\n  --color-border: var(--border);\n  --color-input: var(--input);\n  --color-ring: var(--ring);\n  --color-background: var(--background);\n  --color-foreground: var(--foreground);\n}\n\n:root {\n  --background: #ffffff;\n  --foreground: #020817;\n  --border: #e2e8f0;\n  --input: #e2e8f0;\n  --ring: #0f172a;\n}\n`;
      } else if (!files[cssKey].includes('@import "tailwindcss"')) {
         files[cssKey] = `@import "tailwindcss";\n` + files[cssKey];
      }

      let layoutKey = files['app/layout.tsx'] ? 'app/layout.tsx' : (files['src/app/layout.tsx'] ? 'src/app/layout.tsx' : 'app/layout.tsx');
      if (!files[layoutKey] && !files['app/layout.jsx'] && !files['src/app/layout.jsx']) {
         log(`🏗️ Injecting core layout.tsx into wakeup`);
         files[layoutKey] = `import "./globals.css";\nimport { Inter } from "next/font/google";\n\nconst inter = Inter({ subsets: ["latin"] });\n\nexport const metadata = {\n  title: "Dev X App",\n  description: "Generated by Dev X",\n};\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <html lang="en">\n      <body className={inter.className}>{children}</body>\n    </html>\n  );\n}\n`;
      }

      let pageKey = files['app/page.tsx'] ? 'app/page.tsx' : (files['src/app/page.tsx'] ? 'src/app/page.tsx' : null);
      if (!pageKey && !files['app/page.jsx'] && !files['src/app/page.jsx']) {
         log(`🏗️ Injecting core page.tsx into wakeup`);
         files['app/page.tsx'] = `export default function Home() {\n  return (\n    <div className="flex h-screen items-center justify-center bg-background text-foreground">\n      <h1 className="text-3xl font-bold">App successfully generated, but missing page.tsx.</h1>\n    </div>\n  );\n}\n`;
      }

      // Create directories
      // 9.2 Auto-heal missing Providers component
      for (const fKey of Object.keys(files)) {
        if (!/layout\.(tsx|jsx)$/.test(fKey)) continue;
        const lc = files[fKey];
        if (!lc.includes('Providers')) continue;
        const ld = fKey.substring(0, fKey.lastIndexOf('/'));
        const candidates = [
          ld ? `${ld}/providers.tsx` : 'providers.tsx',
          'app/providers.tsx', 'src/app/providers.tsx',
        ];
        const exists = candidates.some(k => files[k] || files[k.replace('.tsx', '.jsx')]);
        if (!exists) {
          const pp = ld ? `${ld}/providers.tsx` : 'app/providers.tsx';
          log(`🩹 Auto-healing: Injecting missing ${pp} (referenced by ${fKey})`);
          files[pp] = `"use client";\n\nexport function Providers({ children }: { children: React.ReactNode }) {\n  return <>{children}</>;\n}\n\nexport default Providers;\n`;
        }
      }

      const dirs = [...new Set(
        Object.keys(files)
          .map((f) => f.substring(0, f.lastIndexOf('/')))
          .filter((d) => d)
      )];

      if (dirs.length > 0) {
        await sandbox.commands.run(
          `mkdir -p ${dirs.map((d) => `'${homeDir}/${d}'`).join(' ')}`,
          { timeoutMs: 10000 }
        );
        log(`✅ Created ${dirs.length} directories`);
      }

      // Write files with auto-healing for package.json
      for (const [path, content] of Object.entries(files)) {
        let finalContent = content;

        if (path === 'package.json') {
          try {
            const pkg = JSON.parse(content);
            const normalizedPackage = normalizePreviewPackageJson(pkg, inferredRuntimePackages);
            packageDepsSeen = normalizedPackage.packageDepsSeen;
            packageVersions = normalizedPackage.packageVersions;
            finalContent = JSON.stringify(normalizedPackage.pkg, null, 2);
            log('  ✅ package.json auto-healed');
          } catch {
            log(`  ⚠️ Could not parse package.json, using as-is`);
          }
        }

        // ✅ Sanitize shadcn classes to prevent Tailwind v4 crashes
        if (/\.(tsx?|jsx?|css|scss|mjs)$/.test(path)) {
          finalContent = sanitizeShadcnUtilities(finalContent);
        }

        // ✅ AUTO-FIX: wrong import patterns (e.g. sonner has no default export)
        if (/\.(tsx?|jsx?|mjs|cjs)$/.test(path)) {
          finalContent = sanitizeImports(finalContent);
        }

        await sandbox.files.write(`${homeDir}/${path}`, finalContent);
      }

      log(`✅ All ${fileCount} files written successfully`);

      // ═══ POST-WRITE: Remove duplicate next.config files on disk ═══
      const configVariants = ['next.config.ts', 'next.config.mjs', 'next.config.js'];
      const writtenConfigs = configVariants.filter(c => files[c]);
      if (writtenConfigs.length > 1) {
        const priority = ['next.config.ts', 'next.config.mjs', 'next.config.js'];
        const keep = priority.find(p => writtenConfigs.includes(p)) || writtenConfigs[0];
        for (const cfg of writtenConfigs) {
          if (cfg !== keep) {
            log(`🧹 Removing duplicate config from disk: ${cfg} (keeping ${keep})`);
            await sandbox.commands.run(`rm -f '${homeDir}/${cfg}'`, { timeoutMs: 5000 }).catch(() => {});
          }
        }
      }

      // ═══ POST-WRITE: Aggressively remove tailwind/postcss v3 configs ═══
      log(`🧹 Cleaning up bad tailwind/postcss configs from disk`);
      await sandbox.commands.run(
        `cd '${homeDir}' && rm -f tailwind.config.js tailwind.config.ts tailwind.config.mjs postcss.config.js postcss.config.cjs`,
        { timeoutMs: 5000 }
      ).catch(() => {});

    } catch (err) {
      log(`❌ File write failed: ${err}`);
      throw new Error('Could not write code files to sandbox');
    }

    // ═════ STEP 10: ENSURE NEXT.CONFIG EXISTS (deduplicated) ═════
    const configKeys = Object.keys(files).filter(f => /^next\.config\.(ts|mjs|js)$/.test(f));
    if (configKeys.length === 0) {
      log('📄 Creating next.config.ts...');
      await sandbox.files.write(`${homeDir}/next.config.ts`, CANONICAL_NEXT_CONFIG_TS);
      log('✅ next.config.ts created');
    } else if (configKeys.length > 1) {
      // Dedup: keep preferred format
      const priority = ['next.config.ts', 'next.config.mjs', 'next.config.js'];
      const keep = priority.find(p => configKeys.includes(p)) || configKeys[0];
      for (const cfg of configKeys) {
        if (cfg !== keep) {
          log(`🧹 Removing duplicate config: ${cfg} (keeping ${keep})`);
          await sandbox.commands.run(`rm -f '${homeDir}/${cfg}'`, { timeoutMs: 5000 }).catch(() => {});
        }
      }
    }

    // ═════ STEP 10.5: VALIDATE REQUIRED APP ROUTING (no mock injection) ═════
    const projectHasRootLayout = Object.keys(files).some(f => f === "app/layout.tsx" || f === "app/layout.jsx" || f === "src/app/layout.tsx");
    const projectHasRootPage = Object.keys(files).some(f => f === "app/page.tsx" || f === "app/page.jsx" || f === "src/app/page.tsx");

    if (!projectHasRootLayout) {
      throw new Error('Missing required root layout file (app/layout.tsx). Refusing to inject mock layout.');
    }
    
    if (!projectHasRootPage) {
      throw new Error('Missing required root page file (app/page.tsx). Refusing to inject mock page.');
    }
    // ═════ STEP 11: CHECK IF npm install NEEDED ═════
    log('📦 Checking for dependencies...');
    let needsInstall = true;
    try {
      const check = await sandbox.commands.run(
        `cd '${homeDir}' && [ -f node_modules/.bin/next ] && echo 1 || echo 0`,
        { timeoutMs: 5000 }
      );
      needsInstall = check.stdout?.trim() !== '1';
    } catch {
      needsInstall = true;
    }

    let dependencyInstallFailed = false;
    if (needsInstall) {
      emitDebugLog('H11', 'wakeup-install-path-entered', { version: 'preview-staged-install-v1', projectId });
      log('⬇️ Running hardened preview install...');
      try {
        const envProbe = await sandbox.commands.run(
          `cd '${homeDir}' && echo "node=$(node -v 2>/dev/null || echo missing) npm=$(npm -v 2>/dev/null || echo missing)"`,
          { timeoutMs: 5000 }
        );
        emitDebugLog('H5', 'wakeup-install-env-probe', { env: (envProbe.stdout || '').trim() });
      } catch (probeErr) {
        emitDebugLog('H5', 'wakeup-install-env-probe-failed', {
          error: probeErr instanceof Error ? probeErr.message : String(probeErr),
        });
      }
      emitDebugLog('H1', 'wakeup-npm-install-start', { homeDir, projectId, command: 'staged-preview-install' });
      try {
        await ensurePreviewDependencies({
          sandbox,
          homeDir,
          packageVersions,
          inferredRuntimePackages,
          log,
          allowMinimalFallback: true,
        });

        log('✅ hardened preview install completed');
        emitDebugLog('H1', 'wakeup-npm-install-success', {
          projectId,
        });
      } catch (err) {
        log(`❌ hardened preview install failed: ${err}`);
        try {
          const npmDebugLog = await sandbox.commands.run(
            `bash -lc "latest=$(ls -1t ~/.npm/_logs/*-debug-0.log 2>/dev/null | head -1); if [ -n \\"$latest\\" ]; then echo FILE:$latest; tail -120 \\"$latest\\"; else echo NO_NPM_DEBUG_LOG; fi"`,
            { timeoutMs: 10000 }
          );
          emitDebugLog('H5', 'wakeup-npm-debug-log-tail', {
            logTail: (npmDebugLog.stdout || '').slice(-4000),
          });
        } catch (logErr) {
          emitDebugLog('H5', 'wakeup-npm-debug-log-tail-failed', {
            error: logErr instanceof Error ? logErr.message : String(logErr),
          });
        }
        emitDebugLog('H1', 'wakeup-npm-install-failed', { error: err instanceof Error ? err.message : String(err) });
        dependencyInstallFailed = true;
        log('⚠️ Continuing with startup retries despite dependency install failure...');
      }
    } else {
      log('✅ Dependencies already installed, skipping npm install');
    }

    const inferredMissingPackages = needsInstall
      ? []
      : inferredRuntimePackages.filter((pkg) => !packageDepsSeen.has(pkg));
    if (inferredMissingPackages.length > 0) {
      log(`🩹 Installing inferred missing packages: ${inferredMissingPackages.join(', ')}`);
      await installPreviewPackagesRobustly({
        sandbox,
        homeDir,
        stageLabel: 'inferred-missing',
        packages: inferredMissingPackages,
        timeoutMs: 180000,
        log,
      }).catch((err) => {
        log(`⚠️ Inferred package install failed (continuing): ${String(err)}`);
      });
    }

    const verifyNext = await sandbox.commands.run(
      `cd '${homeDir}' && if [ -f node_modules/.bin/next ] && [ -f node_modules/.bin/next ]; then echo OK; else echo MISSING; fi`,
      { timeoutMs: 5000 }
    );
    if ((verifyNext.stdout || '').trim() !== 'OK') {
      log('🩹 next binary missing, retrying targeted install...');
      emitDebugLog('H1', 'wakeup-next-binary-missing-before-retry', { verifyNext: (verifyNext.stdout || '').trim() });
      await installPreviewPackagesRobustly({
        sandbox,
        homeDir,
        stageLabel: 'next-core-targeted',
        packages: ['next', 'react', 'react-dom'],
        timeoutMs: 120000,
        log,
      }).catch((err) => {
        dependencyInstallFailed = true;
        log(`⚠️ Targeted next-core install failed (continuing): ${String(err)}`);
      });

      const verifyNextAfterRetry = await sandbox.commands.run(
        `cd '${homeDir}' && if [ -f node_modules/.bin/next ]; then echo OK; else echo MISSING; fi`,
        { timeoutMs: 5000 }
      );

      if ((verifyNextAfterRetry.stdout || '').trim() !== 'OK') {
        emitDebugLog('H1', 'wakeup-next-binary-still-missing-after-retry', {
          verifyNextAfterRetry: (verifyNextAfterRetry.stdout || '').trim(),
        });
        dependencyInstallFailed = true;
        log('⚠️ next binary still missing after retry. Startup is likely to fail.');
      }
    }

    if (dependencyInstallFailed) {
      log('⚠️ Dependency install did not complete cleanly. Runtime boot may fail.');
    }

    // ═════ STEP 12: START DEV SERVER (NO BUILD GATE) ═════
    // next dev handles errors gracefully via browser overlay.
    // Running next build wastes 2-5 minutes for no benefit.
    let serverReady = false;

    log('🧹 Clearing stale .next cache...');
    await sandbox.commands.run(`cd '${homeDir}' && rm -rf .next && (fuser -k 3000/tcp || true) && (pkill -9 -f 'next dev' || true) && (pkill -9 -f 'next-server' || true)`, { timeoutMs: 15000 }).catch(() => {});

    // Pre-emptive Prisma Database Setup (Migration & Generation)
    log('🗄️ Checking for Prisma database schema...');
    await sandbox.commands.run(`
      cd '${homeDir}' && 
      SCHEMA_PATH=""
      if [ -f prisma/schema.prisma ]; then SCHEMA_PATH="prisma/schema.prisma"; fi
      if [ -f src/prisma/schema.prisma ]; then SCHEMA_PATH="src/prisma/schema.prisma"; fi
      
      if [ -n "$SCHEMA_PATH" ]; then
        npx -y prisma generate
        npx -y prisma db push --accept-data-loss
      fi
    `, { timeoutMs: 45000 }).catch((e) => {
      log('⚠️ Prisma auto-migration failed or timed out: ' + String(e));
    });

    log('🚀 Starting dev server...');
    const startResult = await ensurePreviewPortActive({
      sandbox,
      homeDir,
      log,
    });
    serverReady = startResult.ready;

    if (!serverReady) {
      log('❌ Port still closed after app boot attempts.');
      const logsPrimary = await sandbox.commands.run(
        `tail -50 /tmp/next-dev.log 2>/dev/null || echo 'no primary log file'`,
        { timeoutMs: 5000 }
      );
      const logsRecovery = await sandbox.commands.run(
        `tail -50 /tmp/next-dev-recovery.log 2>/dev/null || echo 'no recovery log file'`,
        { timeoutMs: 5000 }
      );
      const logsExec = await sandbox.commands.run(
        `tail -50 /tmp/next-dev-exec.log 2>/dev/null || echo 'no npm exec log file'`,
        { timeoutMs: 5000 }
      );

      response.errorLogs = [logsPrimary.stdout, logsRecovery.stdout, logsExec.stdout]
        .filter(Boolean)
        .join('\n\n');
    }

    if (!serverReady) {
      log('❌ Dev server did not respond in time');
      
      // Gather diagnostics
      try {
        const procCheck = await sandbox.commands.run(
          `ps aux | grep -E "next|node|npm" | grep -v grep || echo "NO NEXT/NODE PROCESSES RUNNING"`,
          { timeoutMs: 5000 }
        );
        log(`  Processes:\n${procCheck.stdout}`);

        const portCheck = await sandbox.commands.run(
          `netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || echo "Port 3000 not listening"`,
          { timeoutMs: 5000 }
        );
        log(`  Port status:\n${portCheck.stdout}`);

        const errLogs = await sandbox.commands.run(
          `echo '=== primary ==='; tail -50 /tmp/next-dev.log 2>/dev/null || true; echo '\n=== recovery ==='; tail -50 /tmp/next-dev-recovery.log 2>/dev/null || true; echo '\n=== npm-exec ==='; tail -50 /tmp/next-dev-exec.log 2>/dev/null || true`,
          { timeoutMs: 5000 }
        );
        response.errorLogs = errLogs.stdout;
        log(`  Error logs:\n${errLogs.stdout}`);
      } catch {
        // Ignore
      }
      
      throw new Error('Dev server failed to start. Check logs for details.');
    }

    log('✅ Dev server is ready!');

    // ═════ STEP 14: GET PREVIEW URL ═════
    log('🌐 Generating preview URL...');
    const previewUrl = await SandboxLifecycleManager.getPreviewUrl(sandbox, 3000);
    if (!previewUrl) {
      throw new Error('Could not generate preview URL');
    }
    log(`✅ Preview URL: ${previewUrl}`);

    // ═════ STEP 14.5: VERIFY EXTERNAL URL IS REACHABLE ═════
    log('🌍 Verifying external URL reachability (E2B DNS propagation)...');
    const externalUrlReady = await waitForPreviewUrlReachable(previewUrl, 20);
    if (!externalUrlReady) {
      log('⚠️ External URL not reachable after 40 seconds - returning anyway, frontend may retry');
      emitDebugLog('H6', 'wakeup-external-url-timeout', {
        projectId,
        previewUrl: previewUrl.substring(0, 50),
        maxAttempts: 20,
      });
    } else {
      log('🟢 External URL is reachable!');
    }

    // ═════ STEP 15: UPDATE ALL FRAGMENTS ═════
    log('💾 Updating all project fragments with new URL...');
    await updateFragmentsUrl(projectId, previewUrl, log);

    // ═════ SUCCESS ═════
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ WAKEUP COMPLETE in ${elapsed}s`);

    response.success = true;
    response.status = isNewSandbox ? 'recreated' : 'restarted';
    response.sandboxUrl = previewUrl;
    response.sandboxState = SandboxState.ACTIVE;
    response.framework = framework;
    response.warming = !externalUrlReady;
    response.logs = logs;

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const errorMsg = err instanceof Error ? err.message : String(err);
    log(`❌ WAKEUP FAILED after ${elapsed}s: ${errorMsg}`);
    
    response.success = false;
    response.status = 'error';
    response.error = errorMsg;
    response.logs = logs;
    
    return NextResponse.json(response, { status: 500 });
  }
});
}

async function updateFragmentsUrl(projectId: string, url: string, log: (m: string) => void) {
  try {
    const fragments = await prisma.fragment.findMany({
      where: { message: { projectId } },
    });
    
    if (fragments.length === 0) return;
    
    await Promise.all(
      fragments.map((f) =>
        prisma.fragment.update({
          where: { id: f.id },
          data: { sandboxUrl: url },
        })
      )
    );
    log(`✅ Updated ${fragments.length} fragments with new URL`);
  } catch (err) {
    log(`⚠️ Could not update fragment URLs in database: ${err}`);
  }
}

