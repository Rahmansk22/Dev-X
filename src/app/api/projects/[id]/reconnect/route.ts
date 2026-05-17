import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Sandbox } from 'e2b';
import { SANDBOX_TIMEOUT } from '@/inngest/types';
import { getCurrentUserId } from '@/lib/auth';
import { withProjectRecoveryLock, isProjectRecoveryLocked } from '@/lib/project-recovery-lock';
import SandboxLifecycleManager from '@/lib/sandbox-lifecycle-manager';
import {
    createSandboxWithTemplateFallback,
    ensurePreviewDependencies,
    ensurePreviewPortActive,
    installPreviewPackagesRobustly,
    isHealthyPreviewHttpCode,
    normalizePreviewFiles,
    normalizePreviewPackageJson,
    SANDBOX_WORKSPACE_DIR,
    startEmergencyPreviewServer,
    validatePreviewBuild,
    waitForPreviewUrlReachable,
} from '@/lib/sandbox-preview';

const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/743f09b8-5f64-45ef-98fe-57ac7e9a16ff';
function emitDebugLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'development') return;
    fetch(DEBUG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            runId: 'wakeup-e2e',
            hypothesisId,
            location: 'reconnect/route.ts',
            message,
            data,
            timestamp: Date.now(),
        }),
    }).catch(() => { });
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

async function resolveHomeDir(sandbox: Sandbox): Promise<string> {
    // Use deterministic writable workspace to avoid HOME resolution failures across templates.
    const workspaceDir = SANDBOX_WORKSPACE_DIR;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await sandbox.commands.run(`mkdir -p '${workspaceDir}'`, { timeoutMs: 20000 });
            return workspaceDir;
        } catch {
            if (attempt === 2) {
                // Do not fail hard on transient command timeouts; later mkdir -p calls for nested
                // paths can still bootstrap the workspace.
                console.warn('[reconnect] workspace mkdir timed out, continuing with fallback path');
            } else {
                await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            }
        }
    }
    return workspaceDir;
}

function isTransientCommandTimeout(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    return lower.includes('deadline_exceeded') || lower.includes('timed out') || lower.includes('timeoutms');
}

function shellEscapeSingleQuotes(value: string): string {
    return value.replace(/'/g, "'\"'\"'");
}

/**
 * POST /api/projects/[id]/reconnect
 * 
 * Reconnects or recreates an E2B sandbox for a project.
 * When a sandbox expires (30min timeout), this endpoint:
 * 1. Tries to reconnect to the existing sandbox
 * 2. If reconnection fails, creates a brand new sandbox
 * 3. Re-deploys the code from the latest Fragment's stored files
 * 4. Starts the dev server
 * 5. Updates the Fragment's sandboxUrl with the new URL
 */
export async function POST(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const params = await context.params;
    const projectId = params.id;
    const wasLocked = isProjectRecoveryLocked(projectId);
    if (wasLocked) {
        emitDebugLog('H9', 'reconnect-recovery-lock-wait', { projectId });
    }

    return withProjectRecoveryLock(projectId, async () => {
    try {
                emitDebugLog('H11', 'reconnect-route-version', { version: 'preview-staged-install-v1', projectId });
        const userId = await getCurrentUserId();
        // FIX: Validate userId before using in query
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // 1. Get project and its latest fragment
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId },
        });

        if (!project) {
            return NextResponse.json(
                { success: false, error: 'Project not found or unauthorized' },
                { status: 404 },
            );
        }

        // Get the latest fragment (which has the stored files)
        const latestFragment = await prisma.fragment.findFirst({
            where: {
                message: {
                    projectId: projectId,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!latestFragment) {
            return NextResponse.json(
                { success: false, error: 'No fragment found for this project' },
                { status: 404 },
            );
        }

        // 2. Try to reconnect to existing sandbox
        let sandbox: Sandbox | null = null;
        let sandboxId = project.sandboxId;

        if (sandboxId) {
            try {
                // If the sandbox ID is totally invalid/obsolete, e2b will throw an error
                sandbox = await Sandbox.connect(sandboxId);
                await sandbox.setTimeout(SANDBOX_TIMEOUT);

                // Sandbox is alive — check if dev server is still running
                try {
                    const ping = await sandbox.commands.run(
                        `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:3000 2>/dev/null || echo 0`,
                        { timeoutMs: 8000 }
                    );
                    const httpCode = parseInt(ping.stdout?.trim() || "0", 10);

                    if (isHealthyPreviewHttpCode(httpCode)) {
                        // Dev server is running — just return the existing URL
                        const host = sandbox.getHost(3000);
                        const sandboxUrl = `https://${host}`;
                        const previewReady = await waitForPreviewUrlReachable(sandboxUrl, 5);

                        // Update fragment URL in case it's different
                        if (latestFragment.sandboxUrl !== sandboxUrl) {
                            await prisma.fragment.update({
                                where: { id: latestFragment.id },
                                data: { sandboxUrl },
                            });
                        }

                        return NextResponse.json({
                            success: true,
                            sandboxUrl,
                            status: 'reconnected',
                            warming: !previewReady,
                        });
                    }
                } catch {
                    // Dev server not running — will restart below
                }

                const host = sandbox.getHost(3000);
                const sandboxUrl = `https://${host}`;

                const homeDirFast = await resolveHomeDir(sandbox);
                let fastReady = false;
                await sandbox.commands.run(
                    `cd '${homeDirFast}' && nohup sh -lc '${shellEscapeSingleQuotes(`npm run dev -- --hostname 0.0.0.0 --port 3000`)}' > /tmp/next-dev.log 2>&1 < /dev/null & echo STARTED`,
                    { timeoutMs: 1500 }
                ).catch(() => { /* best effort detached start */ });

                fastReady = await SandboxLifecycleManager.waitForServerReady(sandbox, 3000, 20, 12).catch(() => false);

                if (!fastReady) {
                    console.warn('[reconnect] Fast reconnect start did not become healthy, continuing with full redeploy...');

                    // Existing sleeping sandbox is likely corrupted for npm/bootstrap.
                    // Force fresh sandbox creation rather than recovering in-place.
                    try {
                        const staleSandbox = await Sandbox.connect(sandboxId);
                        await staleSandbox.kill();
                        console.warn(`[reconnect] 🗑️ Discarded unhealthy sleeping sandbox: ${sandboxId}`);
                    } catch (killErr) {
                        console.warn('[reconnect] Could not discard sleeping sandbox (may already be dead):', killErr);
                    }

                    await prisma.project.update({
                        where: { id: projectId },
                        data: { sandboxId: null },
                    }).catch(() => {});
                    sandbox = null;
                    sandboxId = null;
                } else {
                    const previewReady = await waitForPreviewUrlReachable(sandboxUrl, 8);
                    if (latestFragment.sandboxUrl !== sandboxUrl) {
                        await prisma.fragment.update({
                            where: { id: latestFragment.id },
                            data: { sandboxUrl },
                        });
                    }

                    return NextResponse.json({
                        success: true,
                        sandboxUrl,
                        status: 'reconnected',
                        warming: !previewReady,
                    });
                }

            } catch (err) {
                emitDebugLog('H2', 'reconnect-existing-sandbox-reconnect-failed', {
                    projectId,
                    sandboxId,
                    error: err instanceof Error ? err.message : String(err),
                });
                if (sandbox && isTransientCommandTimeout(err)) {
                    // Keep using connected sandbox; timeout likely came from an internal command,
                    // not from Sandbox.connect itself.
                    console.warn('[reconnect] transient command timeout while connected; continuing without sandbox recreation');
                } else {
                // Sandbox is dead or not found (e.g. "Sandbox not found") — will create new one below
                console.warn(`[reconnect] Sandbox ${sandboxId} not found or dead, will recreate:`, err);
                // Clear stale sandboxId so future health checks don't trust a dead reference.
                await prisma.project.update({
                    where: { id: projectId },
                    data: { sandboxId: null },
                }).catch(() => {
                    // Best-effort cleanup; creation flow below still continues.
                });
                sandbox = null;
                sandboxId = null;
                }
            }
        }

        // 3. Create new sandbox if reconnection failed
        if (!sandbox) {
            const created = await createSandboxWithTemplateFallback({
                apiKey: process.env.E2B_API_KEY,
                log: (message) => console.log(`[reconnect] ${message}`),
            });
            sandbox = created.sandbox;
            await sandbox.setTimeout(SANDBOX_TIMEOUT);
            sandboxId = sandbox.sandboxId;
            console.log(`[reconnect] ✅ Created sandbox with template '${created.templateUsed}'`);

            // Save the new sandboxId to the project
            await prisma.project.update({
                where: { id: projectId },
                data: { sandboxId },
            });

            // Immediately point the latest fragment to the new sandbox host to avoid stale dead URLs.
            const newHost = sandbox.getHost(3000);
            const earlySandboxUrl = `https://${newHost}`;
            if (latestFragment.sandboxUrl !== earlySandboxUrl) {
                await prisma.fragment.update({
                    where: { id: latestFragment.id },
                    data: { sandboxUrl: earlySandboxUrl },
                });
            }
        }

        // 4. Re-deploy files from the fragment
        // FIX: Validate files is actually a Record before using
        let files = latestFragment.files as Record<string, string> | null;
        if (!files || typeof files !== 'object' || Array.isArray(files)) {
            return NextResponse.json(
                { success: false, error: 'Invalid fragment files data' },
                { status: 400 },
            );
        }
        const inferredRuntimePackages = inferRuntimePackagesFromFiles(files);
        const homeDir = await resolveHomeDir(sandbox);

        if (Object.keys(files).length > 0) {
            // 4.1. CRITICAL: Clean up existing home directory to ensure a truly fresh start
            // This prevents old, broken node_modules or malformed files from lingering.
            console.log("[reconnect] \uD83E\uDDF9 Cleaning up sandbox environment...");
            await sandbox.commands.run(`find '${homeDir}' -mindepth 1 -maxdepth 1 ! -name 'node_modules' ! -name '.npm' ! -name '.next' -exec rm -rf {} +`, { timeoutMs: 10000 });
            
            // Ensure next.config.mjs exists to handle the app/ structure correctly
            if (!files['next.config.mjs'] && !files['next.config.js']) {
                files['next.config.mjs'] = `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  typescript: { ignoreBuildErrors: true }\n};\nexport default nextConfig;`;
            }

            const normalizedPreview = normalizePreviewFiles(files, inferredRuntimePackages);
            for (const key of Object.keys(files)) {
                delete files[key];
            }
            Object.assign(files, normalizedPreview.files);
             
            // Create all directories first
            const dirs = [...new Set(
                Object.keys(files)
                    .map(f => f.substring(0, f.lastIndexOf('/')))
                    .filter(d => d)
            )];

            if (dirs.length > 0) {
                await sandbox.commands.run(
                    `mkdir -p ${dirs.map(d => `"${homeDir}/${d}"`).join(' ')}`,
                    { timeoutMs: 10000 }
                );
            }

            // Write all files in parallel
            // FIX: Ensure sandbox exists before writing files
            if (!sandbox) {
                throw new Error("Sandbox not available for file writing");
            }

            let packageDepsSeen: Set<string> = new Set<string>();
            let packageVersions: Record<string, string> = {};
            packageDepsSeen = normalizedPreview.packageDepsSeen;
            packageVersions = normalizedPreview.packageVersions;
            await Promise.all(
                Object.entries(files).map(async ([path, content]) => {
                    let finalContent = content;
                    
                    // Auto-heal package.json while preserving generated dependencies.
                    if (path === 'package.json') {
                        try {
                            const pkg = JSON.parse(content);
                            const normalizedPackage = normalizePreviewPackageJson(pkg, inferredRuntimePackages);
                            packageDepsSeen = normalizedPackage.packageDepsSeen;
                            packageVersions = normalizedPackage.packageVersions;
                            finalContent = JSON.stringify(normalizedPackage.pkg, null, 2);
                        } catch (e) {
                            console.warn("Failed to auto-heal package.json:", e);
                        }
                    }

                    await sandbox!.files.write(`${homeDir}/${path}`, finalContent);
                })
            );

            // 5. Install dependencies only if needed, then start dev server
            const depCheck = await sandbox.commands.run(
                `cd '${homeDir}' && if [ -f node_modules/.bin/next ]; then echo 1; else echo 0; fi`,
                { timeoutMs: 5000 }
            );
            const hasNodeModules = depCheck.stdout?.trim() === "1";
            let dependencyInstallFailed = false;

            if (!hasNodeModules) {
                emitDebugLog('H11', 'reconnect-install-path-entered', { version: 'preview-staged-install-v1', projectId });
                console.log("[reconnect] 📦 node_modules missing. Running hardened preview install...");
                emitDebugLog('H1', 'reconnect-npm-install-start', { projectId, homeDir });
                try {
                    const envProbe = await sandbox.commands.run(
                        `cd '${homeDir}' && echo "node=$(node -v 2>/dev/null || echo missing) npm=$(npm -v 2>/dev/null || echo missing)"`,
                        { timeoutMs: 5000 }
                    );
                    emitDebugLog('H5', 'reconnect-install-env-probe', { env: (envProbe.stdout || '').trim() });
                } catch (probeErr) {
                        emitDebugLog('H5', 'reconnect-install-env-probe-failed', {
                            error: probeErr instanceof Error ? probeErr.message : String(probeErr),
                        });
                    }
                try {
                    await ensurePreviewDependencies({
                        sandbox,
                        homeDir,
                        packageVersions,
                        inferredRuntimePackages,
                        log: (message) => console.log(`[reconnect] ${message}`),
                        allowMinimalFallback: true,
                    });

                    emitDebugLog('H1', 'reconnect-npm-install-success', {
                        projectId,
                    });
                } catch (installErr) {
                    try {
                        const npmDebugLog = await sandbox.commands.run(
                            `bash -lc "latest=$(ls -1t ~/.npm/_logs/*-debug-0.log 2>/dev/null | head -1); if [ -n \\"$latest\\" ]; then echo FILE:$latest; tail -120 \\"$latest\\"; else echo NO_NPM_DEBUG_LOG; fi"`,
                            { timeoutMs: 10000 }
                        );
                        emitDebugLog('H5', 'reconnect-npm-debug-log-tail', {
                            logTail: (npmDebugLog.stdout || '').slice(-4000),
                        });
                    } catch (logErr) {
                        emitDebugLog('H5', 'reconnect-npm-debug-log-tail-failed', {
                            error: logErr instanceof Error ? logErr.message : String(logErr),
                        });
                    }
                    emitDebugLog('H1', 'reconnect-npm-install-failed', {
                        projectId,
                        error: installErr instanceof Error ? installErr.message : String(installErr),
                    });
                    dependencyInstallFailed = true;
                    console.warn('[reconnect] ⚠️ Continuing with startup retries despite dependency install failure');
                }
            } else {
                console.log("[reconnect] ⚡ node_modules present. Skipping npm install.");
            }

            const inferredMissingPackages = hasNodeModules
                ? inferredRuntimePackages.filter((pkg) => !packageDepsSeen.has(pkg))
                : [];
            if (inferredMissingPackages.length > 0) {
                console.log('[reconnect] 🩹 Installing inferred missing packages:', inferredMissingPackages);
                await installPreviewPackagesRobustly({
                    sandbox,
                    homeDir,
                    stageLabel: 'inferred-missing',
                    packages: inferredMissingPackages,
                    timeoutMs: 180000,
                    log: (message) => console.log(`[reconnect] ${message}`),
                }).catch((err) => {
                    console.warn('[reconnect] Inferred package install failed (continuing):', String(err));
                });
            }

            const verifyNext = await sandbox.commands.run(
                `cd '${homeDir}' && if [ -f node_modules/.bin/next ]; then echo OK; else echo MISSING; fi`,
                { timeoutMs: 5000 }
            );
            if ((verifyNext.stdout || '').trim() !== 'OK') {
                console.log('[reconnect] 🩹 next binary missing, retrying targeted install...');
                emitDebugLog('H1', 'reconnect-next-binary-missing-before-retry', { projectId });
                await installPreviewPackagesRobustly({
                    sandbox,
                    homeDir,
                    stageLabel: 'next-core-targeted',
                    packages: ['next', 'react', 'react-dom'],
                    timeoutMs: 120000,
                    log: (message) => console.log(`[reconnect] ${message}`),
                }).catch((err) => {
                    dependencyInstallFailed = true;
                    console.warn('[reconnect] ⚠️ next-core targeted install failed (continuing):', String(err));
                });

                const verifyNextAfterRetry = await sandbox.commands.run(
                    `cd '${homeDir}' && if [ -f node_modules/.bin/next ]; then echo OK; else echo MISSING; fi`,
                    { timeoutMs: 5000 }
                );

                if ((verifyNextAfterRetry.stdout || '').trim() !== 'OK') {
                emitDebugLog('H1', 'reconnect-next-binary-still-missing-after-retry', { projectId });
                dependencyInstallFailed = true;
                console.warn('[reconnect] ⚠️ next binary still missing after retry. Startup is likely to fail.');
                }
            }

            if (dependencyInstallFailed) {
                console.warn('[reconnect] ⚠️ Dependency install did not complete cleanly. Runtime boot may fail.');
            }

            let serverReady = false;

            // Skip build validation — next dev handles errors in-browser
            console.log("[reconnect] 🧹 Clearing stale cache...");
            await sandbox.commands.run(`cd '${homeDir}' && rm -rf .next && (fuser -k 3000/tcp || true) && (pkill -9 -f 'next dev' || true) && (pkill -9 -f 'next-server' || true)`, { timeoutMs: 15000 }).catch(() => {});

            // Pre-emptive Prisma generation
            await sandbox.commands.run(`cd '${homeDir}' && if [ -f prisma/schema.prisma ] && [ -x node_modules/.bin/prisma ]; then npx prisma generate > /dev/null 2>&1; fi`, { timeoutMs: 30000 }).catch(() => {});

            console.log("[reconnect] 🚀 Starting Next.js dev server...");
            const startResult = await ensurePreviewPortActive({
                sandbox,
                homeDir,
                log: (message) => console.log(`[reconnect] ${message}`),
            });
            serverReady = startResult.ready;

            if (!serverReady) {
                console.warn("[reconnect] ❌ Port still closed after app boot attempts.");
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

                let errorLogs = 'Dev server failed to start within 60 seconds. ';
                errorLogs += `\nLogs:\n${[logsPrimary.stdout, logsRecovery.stdout, logsExec.stdout].filter(Boolean).join('\n\n')}`;
                return NextResponse.json({
                    success: false,
                    error: errorLogs,
                }, { status: 503 });
            }

        }

        // 7. Get the new sandbox URL and update the fragment
        const host = sandbox.getHost(3000);
        const newSandboxUrl = `https://${host}`;

        // 7.5. Verify external URL is reachable before returning
        console.log('[reconnect] 🌍 Verifying external URL reachability...');
        const externalUrlReady = await waitForPreviewUrlReachable(newSandboxUrl, 20);
        if (!externalUrlReady) {
            console.warn('[reconnect] ⚠️ External URL not reachable after 40 seconds - returning anyway, frontend may retry');
            emitDebugLog('H6', 'reconnect-external-url-timeout', {
                projectId,
                newSandboxUrl: newSandboxUrl.substring(0, 50),
            });
        } else {
            console.log('[reconnect] 🟢 External URL is reachable!');
        }

        // Update ALL fragments for this project to the new URL
        const allFragments = await prisma.fragment.findMany({
            where: {
                message: {
                    projectId: projectId,
                },
            },
        });

        await Promise.all(
            allFragments.map(f =>
                prisma.fragment.update({
                    where: { id: f.id },
                    data: { sandboxUrl: newSandboxUrl },
                })
            )
        );

        return NextResponse.json({
            success: true,
            sandboxUrl: newSandboxUrl,
            status: 'recreated',
            warming: !externalUrlReady,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        emitDebugLog('H11', 'reconnect-route-catch', { projectId, message });
        console.error('[reconnect] ❌ Error:', message);
        if (message.includes('Unauthorized')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 },
            );
        }
        return NextResponse.json(
            { success: false, error: process.env.NODE_ENV === 'development' ? message : 'Failed to reconnect sandbox. Please try again.' },
            { status: 500 },
        );
    }
    });
}
