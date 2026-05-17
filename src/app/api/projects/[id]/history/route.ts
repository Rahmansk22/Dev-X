import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * GET /api/projects/[id]/history - Get version history
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
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 },
      );
    }

    const [snapshots, buildHistory, deployments] = await Promise.all([
      prisma.projectSnapshot.findMany({
        where: { projectId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.buildHistory.findMany({
        where: { projectId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.deployment.findMany({
        where: { projectId },
        orderBy: { deployedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        snapshots,
        buildHistory,
        deployments,
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

/**
 * POST /api/projects/[id]/rollback - Rollback to version
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const params = await context.params;
    const projectId = params.id;
    const { targetVersion } = await request.json();

    if (typeof targetVersion !== 'number') {
      return NextResponse.json(
        { success: false, error: 'targetVersion must be a number' },
        { status: 400 },
      );
    }

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

    const snapshot = await prisma.projectSnapshot.findUnique({
      where: {
        projectId_version: {
          projectId,
          version: targetVersion,
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: `Version ${targetVersion} not found` },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { currentVersion: targetVersion },
      });

      await tx.buildHistory.create({
        data: {
          projectId,
          success: true,
          buildLog: `Rollback applied to version ${targetVersion}`,
          errors: [],
          warnings: [],
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Rolled back to version ${targetVersion}`,
      data: {
        projectId,
        targetVersion,
        snapshot,
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
