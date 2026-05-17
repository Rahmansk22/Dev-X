import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { detectErrors, getErrorSeverity } from '@/self-healing/integration';

/**
 * POST /api/projects/[id]/verify - Verify build
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const params = await context.params;
    const projectId = params.id;
    const body = await request.json().catch(() => ({}));

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 },
      );
    }

    const latestBuild = await prisma.buildHistory.findFirst({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
    });

    const logFromRequest =
      typeof body?.log === 'string'
        ? body.log
        : typeof body?.buildLog === 'string'
          ? body.buildLog
          : '';
    const log = logFromRequest || latestBuild?.buildLog || '';

    const detected = log ? detectErrors(log) : [];
    const severity = log ? getErrorSeverity(log) : 'info';

    return NextResponse.json({
      success: true,
      projectId,
      verified: detected.length === 0,
      severity,
      source: logFromRequest ? 'request-payload' : latestBuild ? 'latest-build-history' : 'none',
      issues: detected.map((item) => ({
        id: item.id,
        name: item.name,
        severity: item.severity,
        suggestedFix: item.suggestedFix,
      })),
      message:
        detected.length === 0
          ? 'No verification issues detected'
          : `Detected ${detected.length} issue(s)`,
    });
  } catch (error: any) {
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 400;
    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }
}
