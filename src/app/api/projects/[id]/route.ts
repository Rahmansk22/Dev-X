import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * GET /api/projects/[id] - Get specific project
 */
export async function GET(
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
        _count: {
          select: {
            snapshots: true,
            buildHistory: true,
            deployments: true,
            messages: true,
          },
        },
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
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        currentVersion: project.currentVersion,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        stats: {
          totalVersions: project._count.snapshots,
          successfulBuilds: undefined,
          failedBuilds: undefined,
          totalEdits: project._count.messages,
        },
      },
    });
  } catch (error: any) {
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }
}
