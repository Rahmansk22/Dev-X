/**
 * PROJECT DATABASE SERVICE - SIMPLIFIED
 * Basic database operations for projects
 */

import prisma from '@/lib/db';

export interface CreateProjectDTO {
  userId: string;
  name: string;
  description?: string;
}

/**
 * Create new project
 */
export async function createProject(data: CreateProjectDTO) {
  try {
    return await (prisma.project as any).create({
      data: {
        userId: data.userId,
        name: data.name,
      },
    });
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Get all projects for user
 */
export async function getUserProjects(userId: string) {
  try {
    const projects = await (prisma.project as any).findMany({
      where: { userId },
    });

    return projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      stats: {
        totalVersions: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
        totalEdits: 0,
      },
    }));
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw error;
  }
}

/**
 * Get single project with full details
 */
export async function getProject(projectId: string) {
  try {
    return await (prisma.project as any).findUnique({
      where: { id: projectId },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

/**
 * Record build attempt
 */
export async function recordBuild(data: {
  projectId: string;
  success: boolean;
  buildLog?: string;
  errors?: any[];
  warnings?: any[];
  buildTime?: number;
  routesGenerated?: number;
}) {
  try {
    return await (prisma as any).buildHistory.create({
      data: {
        projectId: data.projectId,
        success: data.success,
        buildLog: data.buildLog,
        errors: data.errors,
        warnings: data.warnings,
        buildTime: data.buildTime,
        routesGenerated: data.routesGenerated,
      },
    });
  } catch (error) {
    console.error('Error recording build:', error);
    throw error;
  }
}

/**
 * Record deployment
 */
export async function recordDeployment(data: {
  projectId: string;
  version: number;
  provider: string;
  status: string;
  deploymentUrl?: string;
  deploymentId?: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: string;
}) {
  try {
    return await (prisma as any).deployment.create({
      data: {
        projectId: data.projectId,
        version: data.version,
        provider: data.provider,
        status: data.status,
        deploymentUrl: data.deploymentUrl,
        deploymentId: data.deploymentId,
        duration: data.duration,
        metadata: data.metadata,
        error: data.error,
      },
    });
  } catch (error) {
    console.error('Error recording deployment:', error);
    throw error;
  }
}
