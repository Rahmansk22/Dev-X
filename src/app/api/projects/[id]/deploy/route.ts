import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { VercelDeploymentAdapter } from '@/deployment/adapters/vercel-adapter';

/**
 * POST /api/projects/[id]/deploy
 * 
 * Deploy project files from DB to Vercel via REST API.
 * Like Lovable/Replit — one click, get a permanent .vercel.app URL.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const t0 = Date.now();
  try {
    const userId = await getCurrentUserId();
    const params = await context.params;
    const projectId = params.id;
    const body = await request.json().catch(() => ({}));

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get project + latest files from fragment
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const latestFragment = await prisma.fragment.findFirst({
      where: { message: { projectId } },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestFragment?.files) {
      return NextResponse.json({ success: false, error: 'No files found. Generate the app first.' }, { status: 400 });
    }

    const files = latestFragment.files as Record<string, string>;
    const fileCount = Object.keys(files).length;

    if (fileCount === 0) {
      return NextResponse.json({ success: false, error: 'Project has no files to deploy.' }, { status: 400 });
    }

    // 2. Get Vercel token
    const apiKey =
      typeof body?.apiKey === 'string' && body.apiKey.trim().length > 0
        ? body.apiKey.trim()
        : process.env.VERCEL_TOKEN;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'VERCEL_TOKEN is not configured. Add it to your .env file.' },
        { status: 400 },
      );
    }

    console.log(`[Deploy] 🚀 Deploying ${fileCount} files for "${project.name}" to Vercel...`);

    // 3. Deploy via Vercel API
    const adapter = new VercelDeploymentAdapter({
      provider: 'vercel',
      projectId: project.id,
      apiKey,
    });

    const result = await adapter.deployFiles(files, project.name);

    // 4. Save deployment record to DB
    await prisma.deployment.create({
      data: {
        projectId: project.id,
        version: 1,
        provider: 'vercel',
        status: result.status === 'success' ? 'success' : 'failed',
        deploymentUrl: result.url || null,
        deploymentId: result.deploymentId || null,
        duration: result.duration ? Math.round(result.duration / 1000) : null,
        error: result.error || null,
        metadata: {
          logs: result.logs,
          previewUrl: result.previewUrl,
          fileCount,
        },
      },
    });

    // Also save to the Deploy table for quick access
    await prisma.deploy.create({
      data: {
        userId,
        projectId: project.id,
        url: result.url || null,
        status: result.status === 'success' ? 'SUCCESS' : 'FAILED',
        error: result.error || null,
      },
    });

    const totalMs = Date.now() - t0;
    console.log(`[Deploy] ${result.status === 'success' ? '✅' : '❌'} Done in ${totalMs}ms — ${result.url || 'no URL'}`);

    return NextResponse.json({
      success: result.status === 'success',
      url: result.url || null,
      previewUrl: result.previewUrl || null,
      deploymentId: result.deploymentId,
      status: result.status,
      duration: totalMs,
      error: result.error || null,
    });
  } catch (error: any) {
    console.error('[Deploy] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
