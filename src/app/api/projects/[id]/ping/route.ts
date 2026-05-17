import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import SandboxLifecycleManager, { SandboxState } from '@/lib/sandbox-lifecycle-manager';
import { isPreviewUrlReachable } from '@/lib/sandbox-preview';

const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/743f09b8-5f64-45ef-98fe-57ac7e9a16ff';
function emitDebugLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'development') return;
    fetch(DEBUG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            runId: 'wakeup-e2e',
            hypothesisId,
            location: 'ping/route.ts',
            message,
            data,
            timestamp: Date.now(),
        }),
    }).catch(() => { });
}

/**
 * GET /api/projects/[id]/ping
 * 
 * Smart health check that:
 * 1. Validates user access
 * 2. Checks if sandbox exists
 * 3. Checks if dev server is running
 * 4. Returns sandbox state (active, sleeping, dead)
 * 5. Returns fragment age so frontend can decide about wakeup
 * 
 * Response: { isAlive: boolean, state: SandboxState, needsWakeup: boolean, fragmentAgeMs: number }
 */
export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json(
                { isAlive: false, state: 'unauthorized', reason: 'Not authenticated' },
                { status: 401 }
            );
        }

        const params = await context.params;
        const projectId = params.id;

        const project = await prisma.project.findUnique({
            where: { id: projectId, userId },
        });

        if (!project) {
            return NextResponse.json(
                { isAlive: false, state: SandboxState.UNKNOWN, reason: 'Project not found' },
                { status: 404 }
            );
        }

        // Get latest fragment to check age
        const latestFragment = await prisma.fragment.findFirst({
            where: { message: { projectId } },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, sandboxUrl: true }
        });

        const fragmentAgeMs = latestFragment 
            ? new Date().getTime() - new Date(latestFragment.createdAt).getTime()
            : null;

        // Check sandbox state using lifecycle manager
        const state = await SandboxLifecycleManager.checkSandboxState(projectId);
        const hasSandboxId = Boolean(project.sandboxId);
        const hasPreviewUrl = Boolean(latestFragment?.sandboxUrl);
        const sandboxUrl = latestFragment?.sandboxUrl || null;
        const previewReachable =
            state === SandboxState.ACTIVE && sandboxUrl
                ? await isPreviewUrlReachable(sandboxUrl, 5000)
                : false;
        // A sandbox is ACTIVE if the lifecycle check says so — external URL reachability
        // may lag behind (DNS/CDN propagation). Don't require it for isAlive.
        const isAlive = state === SandboxState.ACTIVE;
        const needsWakeup = (hasSandboxId || hasPreviewUrl) && state !== SandboxState.ACTIVE;
        emitDebugLog('H3', 'ping-state-classification', {
            projectId,
            state,
            hasSandboxId,
            hasPreviewUrl,
            sandboxUrl,
            previewReachable,
            needsWakeup,
            fragmentAgeMs,
        });

        return NextResponse.json(
            {
                isAlive,
                state,
                sandboxUrl,
                previewReachable,
                previewUrlAvailable: hasPreviewUrl,
                // UNKNOWN can happen on transient connect failures; if we have either a sandbox
                // reference or a previously issued preview URL, recover by wakeup.
                needsWakeup,
                fragmentAgeMs,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[ping] Error:', error);
        return NextResponse.json(
            { isAlive: false, state: SandboxState.UNKNOWN, reason: 'Error checking status' },
            { status: 500 }
        );
    }
}
