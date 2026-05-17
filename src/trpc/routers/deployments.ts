// src/trpc/routers/deployments.ts
// tRPC router for one-click deployments

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { deployApp, getDeploymentStatus, rollbackDeployment } from "@/deployment/integration";
import type { DeploymentProvider } from "@/deployment";
import fs from "fs";
import path from "path";

export const deploymentsRouter = createTRPCRouter({
  /**
   * One-click deployment
   */
  deploy: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
        buildId: z.string(),
        provider: z.literal("vercel"),
        apiKey: z.string().optional(),
        sourceDir: z.string().optional(),
        region: z.string().optional(),
        environment: z.record(z.string(), z.string()).optional(),
        customDomain: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const { appId, buildId, provider, apiKey, sourceDir, region, environment, customDomain } = input;
      const userId = ctx.auth.userId;
      const resolvedApiKey = apiKey || process.env.VERCEL_TOKEN;
      const workspaceRoot = process.cwd();
      const requestedSource = sourceDir || ".";
      const resolvedSourceDir = path.resolve(workspaceRoot, requestedSource);

      if (!resolvedSourceDir.startsWith(workspaceRoot)) {
        return {
          success: false,
          error: "Invalid sourceDir path.",
          message: "Deployment source path is outside the workspace.",
        };
      }

      if (!fs.existsSync(resolvedSourceDir)) {
        return {
          success: false,
          error: "Deployment source directory does not exist.",
          message: "Unable to locate deployment source directory.",
        };
      }

      if (provider === "vercel" && !resolvedApiKey) {
        return {
          success: false,
          error: "VERCEL_TOKEN is not configured on the server.",
          message: "Deployment unavailable until VERCEL_TOKEN is configured.",
        };
      }

      try {
        const deployment = await deployApp(appId, userId, buildId, {
          provider: provider as DeploymentProvider,
          projectId: appId,
          apiKey: resolvedApiKey as string,
          region,
          environment,
          customDomain,
        }, resolvedSourceDir, appId);

        return {
          success: deployment.result.status === "success",
          deploymentId: deployment.id,
          url: deployment.result.url,
          previewUrl: deployment.result.previewUrl,
          status: deployment.result.status,
          error: deployment.result.error,
          logs: deployment.result.logs,
          message: deployment.result.status === "success" ? "Deployment successful!" : "Deployment failed.",
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          message: "Failed to initiate deployment.",
        };
      }
    }),

  /**
   * Get deployment status
   */
  getStatus: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
      })
    )
    .query(async ({ input }: any) => {
      const { deploymentId } = input;

      try {
        const status = await getDeploymentStatus(deploymentId);
        return {
          success: status !== null,
          deploymentId,
          status: status?.status,
          url: status?.url,
          error: status?.error,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Rollback deployment
   */
  rollback: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      const { deploymentId } = input;

      try {
        await rollbackDeployment(deploymentId);
        return {
          success: true,
          message: "Rollback initiated successfully.",
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * List deployment providers
   */
  listDeploymentProviders: protectedProcedure.query(() => {
    return {
      providers: [
        {
          id: "vercel",
          name: "Vercel",
          description: "Deploy to Vercel",
          icon: "⚡",
        },
      ],
    };
  }),
});
