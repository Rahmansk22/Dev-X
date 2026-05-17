import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { deployApp } from '@/deployment/integration';

/**
 * POST /api/projects/[id]/deploy - Deploy project
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
    const provider =
      body?.provider === 'railway' ||
      body?.provider === 'fly' ||
      body?.provider === 'netlify'
        ? body.provider
        : 'vercel';

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 },
      );
    }

    const workspaceRoot = process.cwd();
    const requestedSource = typeof body?.sourceDir === 'string' ? body.sourceDir : '.';
    const resolvedSourceDir = path.resolve(workspaceRoot, requestedSource);

    if (!resolvedSourceDir.startsWith(workspaceRoot)) {
      return NextResponse.json(
        { success: false, error: 'Invalid source directory path' },
        { status: 400 },
      );
    }

    if (!fs.existsSync(resolvedSourceDir)) {
      return NextResponse.json(
        { success: false, error: 'Deployment source directory does not exist' },
        { status: 400 },
      );
    }

    const apiKey =
      typeof body?.apiKey === 'string' && body.apiKey.trim().length > 0
        ? body.apiKey.trim()
        : process.env.VERCEL_TOKEN;

    if (provider === 'vercel' && !apiKey) {
      return NextResponse.json(
        { success: false, error: 'VERCEL_TOKEN is not configured on the server' },
        { status: 400 },
      );
    }

    const deployment = await deployApp(
      project.id,
      userId,
      typeof body?.buildId === 'string' && body.buildId.trim().length > 0
        ? body.buildId
        : `manual-${Date.now()}`,
      {
        provider,
        projectId: project.id,
        apiKey: apiKey || '',
        region: typeof body?.region === 'string' ? body.region : undefined,
        customDomain: typeof body?.customDomain === 'string' ? body.customDomain : undefined,
        environment:
          body?.environment && typeof body.environment === 'object'
            ? body.environment
            : undefined,
      },
      resolvedSourceDir,
      project.name,
    );

    return NextResponse.json({
      success: deployment.result.status === 'success',
      message:
        deployment.result.status === 'success'
          ? 'Deployment completed'
          : 'Deployment failed',
      projectId: project.id,
      provider,
      data: {
        deploymentId: deployment.id,
        status: deployment.result.status,
        url: deployment.result.url,
        previewUrl: deployment.result.previewUrl,
        error: deployment.result.error,
        logs: deployment.result.logs,
      },
    });
  } catch (error: any) {
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 400;
    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }
}
