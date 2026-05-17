import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * POST /api/projects/import - Import project from backup
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();
    const payload = body?.data ?? body;

    const importedProject = payload?.project;
    if (!importedProject || typeof importedProject?.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid import payload: missing project.name' },
        { status: 400 },
      );
    }

    const importedMessages = Array.isArray(payload?.messages) ? payload.messages : [];
    const importedSnapshots = Array.isArray(payload?.snapshots) ? payload.snapshots : [];
    const importedDeployments = Array.isArray(payload?.deployments) ? payload.deployments : [];
    const importedBuildHistory = Array.isArray(payload?.buildHistory) ? payload.buildHistory : [];

    const created = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          userId,
          name: `${importedProject.name} (Imported)`,
          description:
            typeof importedProject.description === 'string'
              ? importedProject.description
              : null,
          status:
            typeof importedProject.status === 'string'
              ? importedProject.status
              : 'active',
          currentVersion:
            typeof importedProject.currentVersion === 'number'
              ? importedProject.currentVersion
              : 1,
        },
      });

      if (importedSnapshots.length > 0) {
        await tx.projectSnapshot.createMany({
          data: importedSnapshots.map((snapshot: any) => ({
            projectId: createdProject.id,
            version: typeof snapshot.version === 'number' ? snapshot.version : 1,
            description:
              typeof snapshot.description === 'string' ? snapshot.description : null,
            files: snapshot.files ?? {},
            buildSuccess: Boolean(snapshot.buildSuccess),
            buildLog: typeof snapshot.buildLog === 'string' ? snapshot.buildLog : null,
            errorCount: typeof snapshot.errorCount === 'number' ? snapshot.errorCount : 0,
            totalEdits: typeof snapshot.totalEdits === 'number' ? snapshot.totalEdits : 0,
            authorEmail:
              typeof snapshot.authorEmail === 'string' ? snapshot.authorEmail : null,
          })),
          skipDuplicates: true,
        });
      }

      if (importedDeployments.length > 0) {
        await tx.deployment.createMany({
          data: importedDeployments.map((deployment: any) => ({
            projectId: createdProject.id,
            version: typeof deployment.version === 'number' ? deployment.version : 1,
            provider: typeof deployment.provider === 'string' ? deployment.provider : 'vercel',
            status: typeof deployment.status === 'string' ? deployment.status : 'pending',
            deploymentUrl:
              typeof deployment.deploymentUrl === 'string' ? deployment.deploymentUrl : null,
            deploymentId:
              typeof deployment.deploymentId === 'string' ? deployment.deploymentId : null,
            duration: typeof deployment.duration === 'number' ? deployment.duration : null,
            metadata: deployment.metadata ?? null,
            error: typeof deployment.error === 'string' ? deployment.error : null,
          })),
          skipDuplicates: true,
        });
      }

      if (importedBuildHistory.length > 0) {
        await tx.buildHistory.createMany({
          data: importedBuildHistory.map((build: any) => ({
            projectId: createdProject.id,
            success: Boolean(build.success),
            buildLog: typeof build.buildLog === 'string' ? build.buildLog : null,
            errors: build.errors ?? null,
            warnings: build.warnings ?? null,
            buildTime: typeof build.buildTime === 'number' ? build.buildTime : null,
            routesGenerated:
              typeof build.routesGenerated === 'number' ? build.routesGenerated : null,
          })),
          skipDuplicates: true,
        });
      }

      for (const message of importedMessages) {
        const createdMessage = await tx.message.create({
          data: {
            projectId: createdProject.id,
            content:
              typeof message?.content === 'string'
                ? message.content
                : JSON.stringify(message?.content ?? ''),
            role: message?.role === 'ASSISTANT' ? 'ASSISTANT' : 'USER',
            type:
              message?.type === 'ERROR' ||
              message?.type === 'QUESTION' ||
              message?.type === 'ANALYSIS'
                ? message.type
                : 'RESULT',
            fileActions: message?.fileActions ?? null,
            isAnalyzed: Boolean(message?.isAnalyzed),
            isDetailed: Boolean(message?.isDetailed),
            questionsAsked: message?.questionsAsked ?? null,
            contextData: message?.contextData ?? null,
            confidenceScore:
              typeof message?.confidenceScore === 'number'
                ? message.confidenceScore
                : 0,
          },
        });

        if (message?.fragment) {
          await tx.fragment.create({
            data: {
              messageId: createdMessage.id,
              sandboxUrl:
                typeof message.fragment.sandboxUrl === 'string'
                  ? message.fragment.sandboxUrl
                  : '',
              title:
                typeof message.fragment.title === 'string'
                  ? message.fragment.title
                  : 'Imported Fragment',
              files: message.fragment.files ?? {},
              summary:
                typeof message.fragment.summary === 'string'
                  ? message.fragment.summary
                  : null,
            },
          });
        }
      }

      return createdProject;
    });

    return NextResponse.json({
      success: true,
      message: 'Project import completed',
      projectId: created.id,
    });
  } catch (error: any) {
    const status = String(error?.message || '').includes('Unauthorized') ? 401 : 400;
    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }
}
