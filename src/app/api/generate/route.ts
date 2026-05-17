/**
 * POST /api/generate - Trigger app generation workflow
 */

import { inngest } from '@/inngest/client';
import { getCurrentUserId } from '@/lib/auth';
import { createProject } from '@/lib/projects-db-simple';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { projectName, description, userRequest } = await request.json();

    // Create project in DB
    const project = await createProject({
      userId,
      name: projectName,
      description,
    });

    // Trigger Inngest workflow
    const result = await inngest.send({
      name: 'app/generate.requested',
      data: {
        projectId: project.id,
        userId,
        projectName,
        userRequest,
        projectPath: `/tmp/projects/${project.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      eventId: result.ids[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
