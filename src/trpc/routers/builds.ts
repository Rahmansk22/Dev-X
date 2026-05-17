// src/trpc/routers/builds.ts
// tRPC router for build management with self-healing integration

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/db";
import { Sandbox } from "e2b";
import { runInstallAndBuild } from "@/lib/build-executor";
import { getBuildLogs } from "@/lib/build-logs";
import {
  handleBuildEvent,
  detectErrors,
  getErrorSeverity,
} from "@/self-healing/integration";

export const buildsRouter = createTRPCRouter({
  /**
   * Trigger a build with self-healing
   */
  triggerBuild: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const { appId, code } = input;
      const userId = ctx.auth.userId;

      try {
        const project = await prisma.project.findFirst({
          where: { id: appId, userId },
          select: { id: true, sandboxId: true },
        });

        if (!project) {
          return {
            success: false,
            appId,
            error: "Project not found",
            detectedErrors: [],
            severity: "critical" as const,
            message: "Build failed. Project not found.",
          };
        }

        if (!project.sandboxId) {
          return {
            success: false,
            appId,
            error: "Project sandbox is not initialized",
            detectedErrors: [],
            severity: "critical" as const,
            message: "Build failed. No sandbox is attached to this project.",
          };
        }

        const buildResult = await buildApp(project.sandboxId, appId, code);

        // Log successful build
        await handleBuildEvent(appId, userId, buildResult.output, "success");

        await prisma.buildHistory.create({
          data: {
            projectId: appId,
            success: true,
            buildLog: buildResult.output,
            errors: [],
            warnings: buildResult.warnings,
            buildTime: buildResult.buildTime,
            routesGenerated: buildResult.routesGenerated,
          },
        });

        return {
          success: true,
          appId,
          buildId: generateBuildId(),
          buildTime: buildResult.buildTime,
          routesGenerated: buildResult.routesGenerated,
          message: "Build completed successfully",
        };
      } catch (error) {
        const errorMessage = (error as Error).message;

        // Log failed build with self-healing
        await handleBuildEvent(appId, userId, errorMessage, "error", errorMessage);

        // Detect errors for UI feedback
        const errors = detectErrors(errorMessage);
        const serializedErrors = errors.map((e) => ({
          id: e.id,
          name: e.name,
          severity: e.severity,
          suggestedFix: e.suggestedFix,
        }));
        const severity = getErrorSeverity(errorMessage);

        await prisma.buildHistory.create({
          data: {
            projectId: appId,
            success: false,
            buildLog: errorMessage,
            errors: serializedErrors,
            warnings: [],
            buildTime: undefined,
            routesGenerated: 0,
          },
        }).catch(() => {
          // Build history persistence is best-effort.
        });

        return {
          success: false,
          appId,
          error: errorMessage,
          detectedErrors: errors.map((e) => ({
            id: e.id,
            name: e.name,
            severity: e.severity,
            suggestedFix: e.suggestedFix,
          })),
          severity,
          message: "Build failed. Auto-recovery initiated.",
        };
      }
    }),

  /**
   * Get build history with error tracking
   */
  getBuildHistory: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const { appId, limit } = input;
      const userId = ctx.auth.userId;

      const project = await prisma.project.findFirst({
        where: { id: appId, userId },
        select: { id: true },
      });

      if (!project) {
        return {
          appId,
          builds: [],
          total: 0,
        };
      }

      const [builds, total] = await Promise.all([
        prisma.buildHistory.findMany({
          where: { projectId: appId },
          orderBy: { timestamp: "desc" },
          take: limit,
        }),
        prisma.buildHistory.count({ where: { projectId: appId } }),
      ]);

      return {
        appId,
        builds,
        total,
      };
    }),

  /**
   * Retry a failed build
   */
  retryBuild: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
        buildId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const { appId, buildId } = input;
      const userId = ctx.auth.userId;

      try {
        const project = await prisma.project.findFirst({
          where: { id: appId, userId },
          select: { id: true, sandboxId: true },
        });

        if (!project?.sandboxId) {
          return {
            success: false,
            appId,
            error: "Project sandbox is not initialized",
            message: "Build retry failed.",
          };
        }

        const buildResult = await buildApp(project.sandboxId, appId, "");

        await handleBuildEvent(appId, userId, buildResult.output, "success");

        await prisma.buildHistory.create({
          data: {
            projectId: appId,
            success: true,
            buildLog: buildResult.output,
            errors: [],
            warnings: buildResult.warnings,
            buildTime: buildResult.buildTime,
            routesGenerated: buildResult.routesGenerated,
          },
        });

        return {
          success: true,
          appId,
          buildId: generateBuildId(),
          message: "Build retry completed successfully",
        };
      } catch (error) {
        const errorMessage = (error as Error).message;

        await handleBuildEvent(appId, userId, errorMessage, "error", errorMessage);

        const errors = detectErrors(errorMessage);
        const serializedErrors = errors.map((e) => ({
          id: e.id,
          name: e.name,
          severity: e.severity,
          suggestedFix: e.suggestedFix,
        }));
        await prisma.buildHistory.create({
          data: {
            projectId: appId,
            success: false,
            buildLog: errorMessage,
            errors: serializedErrors,
            warnings: [],
            routesGenerated: 0,
          },
        }).catch(() => {
          // Best-effort only.
        });

        return {
          success: false,
          appId,
          error: errorMessage,
          message: "Build retry failed.",
        };
      }
    }),
});

// Build helper functions
function generateBuildId(): string {
  return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function buildApp(sandboxId: string, appId: string, _code: string): Promise<{
  output: string;
  buildTime: number;
  routesGenerated: number;
  warnings: string[];
}> {
  const start = Date.now();
  const sandbox = await Sandbox.connect(sandboxId);
  const runResult = await runInstallAndBuild(sandbox, appId);
  const logs = getBuildLogs(appId);
  const output = logs
    .map((entry) => {
      const header = `[${entry.step}] exit=${entry.exitCode}`;
      const body = [entry.stdout, entry.stderr].filter(Boolean).join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n");

  const installExit = runResult.install.exitCode ?? 1;
  const buildExit = runResult.build.exitCode ?? 1;

  if (installExit !== 0 || buildExit !== 0) {
    throw new Error(output || "Build failed");
  }

  const routesGenerated = (output.match(/\broute\b|\bapp\/api\//gi) || []).length;
  const warnings = output
    .split("\n")
    .filter((line) => /warning/i.test(line))
    .slice(0, 50);

  return {
    output,
    buildTime: Math.max(1, Math.round((Date.now() - start) / 1000)),
    routesGenerated,
    warnings,
  };
}
