import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * POST /api/projects/[id]/export - Export project
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const params = await context.params;
    const projectId = params.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        messages: {
          include: { fragment: true },
          orderBy: { createdAt: 'asc' },
        },
        snapshots: { orderBy: { timestamp: 'desc' } },
        deployments: { orderBy: { deployedAt: 'desc' } },
        buildHistory: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          currentVersion: project.currentVersion,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        messages: project.messages,
        snapshots: project.snapshots,
        deployments: project.deployments,
        buildHistory: project.buildHistory,
      },
      exportedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 400;
    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }
}
