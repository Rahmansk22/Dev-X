import { getCurrentUserId } from '@/lib/auth';
import {
  getUserProjects,
  createProject as createProjectDB,
} from '@/lib/projects-db-simple';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/projects - List all projects for user
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const projects = await getUserProjects(userId);

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 },
    );
  }
}

/**
 * POST /api/projects - Create new project
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { name, description } = await request.json();

    const project = await createProjectDB({
      userId,
      name,
      description,
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
