// src/inngest/functions/self-healing.ts
// Inngest function to monitor and handle build/deploy events with self-healing

import { inngest } from "../client";
import prisma from "@/lib/db";
import { Sandbox } from "e2b";
import { runInstallAndBuild } from "@/lib/build-executor";
import { getBuildLogs } from "@/lib/build-logs";
import { deployApp as startDeployment } from "@/deployment/integration";
import {
  handleBuildEvent,
  handleDeployEvent,
  getErrorSeverity,
} from "@/self-healing/integration";

/**
 * Build event handler with self-healing
 */
export const buildWithSelfHealing = inngest.createFunction(
  {
    id: "build-with-self-healing",
    name: "Build with Self-Healing",
  },
  { event: "app/build" },
  async ({ event, step }) => {
    const { appId, userId, code } = event.data;

    // Step 1: Attempt initial build
    const buildResult = await step.run("initial-build", async () => {
      try {
        // Call your build service here
        const output = await buildApp(appId, code);
        return { success: true, output };
      } catch (error) {
        return { success: false, output: (error as Error).message };
      }
    });

    // Step 2: Handle result with self-healing
    if (!buildResult.success) {
      await step.run("handle-build-error", async () => {
        await handleBuildEvent(
          appId,
          userId,
          buildResult.output,
          "error",
          buildResult.output
        );
      });

      // Step 3: Check error severity
      const severity = await step.run("check-severity", async () => {
        return getErrorSeverity(buildResult.output);
      });

      // Step 4: Retry if warning or critical
      if (severity === "critical" || severity === "warning") {
        const retryResult = await step.run("auto-retry-build", async () => {
          try {
            const output = await buildApp(appId, code);
            return { success: true, output };
          } catch (error) {
            return { success: false, output: (error as Error).message };
          }
        });

        if (retryResult.success) {
          await step.run("notify-recovery", async () => {
            // Notify user of successful recovery
            console.log(`App ${appId} recovered after retry`);
          });
        }
      }
    } else {
      await step.run("handle-build-success", async () => {
        await handleBuildEvent(
          appId,
          userId,
          buildResult.output,
          "success"
        );
      });
    }

    return buildResult;
  }
);

/**
 * Deploy event handler with self-healing
 */
export const deployWithSelfHealing = inngest.createFunction(
  {
    id: "deploy-with-self-healing",
    name: "Deploy with Self-Healing",
  },
  { event: "app/deploy" },
  async ({ event, step }) => {
    const { appId, userId, buildId } = event.data;

    // Step 1: Attempt deployment
    const deployResult = await step.run("initial-deploy", async () => {
      try {
        const output = await deployApp(appId, userId, buildId);
        return { success: true, output };
      } catch (error) {
        return { success: false, output: (error as Error).message };
      }
    });

    // Step 2: Handle result with self-healing
    if (!deployResult.success) {
      await step.run("handle-deploy-error", async () => {
        await handleDeployEvent(
          appId,
          userId,
          deployResult.output,
          "error",
          deployResult.output
        );
      });
    } else {
      await step.run("handle-deploy-success", async () => {
        await handleDeployEvent(
          appId,
          userId,
          deployResult.output,
          "success"
        );
      });
    }

    return deployResult;
  }
);

// Build/deploy helpers used by self-healing workflows.
async function buildApp(appId: string, _code: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: appId },
    select: { id: true, sandboxId: true },
  });

  if (!project?.sandboxId) {
    throw new Error(`Project ${appId} has no sandbox attached`);
  }

  const sandbox = await Sandbox.connect(project.sandboxId);
  const runResult = await runInstallAndBuild(sandbox, appId);
  const logs = getBuildLogs(appId);
  const output = logs
    .map((entry) => {
      const body = [entry.stdout, entry.stderr].filter(Boolean).join("\n");
      return `[${entry.step}] exit=${entry.exitCode}\n${body}`;
    })
    .join("\n\n");

  const installExit = runResult.install.exitCode ?? 1;
  const buildExit = runResult.build.exitCode ?? 1;
  if (installExit !== 0 || buildExit !== 0) {
    throw new Error(output || `Build failed for ${appId}`);
  }

  return output || `Build succeeded for ${appId}`;
}

async function deployApp(appId: string, userId: string, buildId: string): Promise<string> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN is required for self-healing deployment workflow");
  }

  const deployment = await startDeployment(
    appId,
    userId,
    buildId,
    {
      provider: "vercel",
      projectId: appId,
      apiKey: token,
    },
    process.cwd(),
    appId
  );

  if (deployment.result.status !== "success") {
    throw new Error(deployment.result.error || `Deployment failed for ${appId}`);
  }

  return deployment.result.url || `Deployment succeeded for ${appId}`;
}
