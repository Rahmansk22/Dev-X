// src/inngest/functions/deployment.ts
// Inngest function for one-click deployment pipeline

import { inngest } from "../client";
import { deployApp, rollbackDeployment, getDeploymentStatus } from "@/deployment/integration";
import type { DeploymentProvider } from "@/deployment";

/**
 * One-click deployment function
 */
export const oneClickDeploy = inngest.createFunction(
  {
    id: "one-click-deploy",
    name: "One-Click Deployment",
  },
  { event: "app/deploy-request" },
  async ({ event, step }) => {
    const { appId, userId, buildId, provider, apiKey, config } = event.data;

    // Step 1: Validate configuration
    const validation = await step.run("validate-config", async () => {
      if (!apiKey || !provider) {
        throw new Error("Missing deployment configuration");
      }
      return { valid: true };
    });

    if (!validation.valid) {
      throw new Error("Invalid deployment configuration");
    }

    // Step 2: Deploy app
    const deployment = await step.run("deploy-app", async () => {
      return await deployApp(
        appId,
        userId,
        buildId,
        {
          provider: provider as DeploymentProvider,
          projectId: appId,
          apiKey,
          ...config,
        },
        "/build",
        appId
      );
    });

    // Step 3: Monitor deployment
    const status = await step.run("monitor-deployment", async () => {
      // Check deployment status until complete
      return deployment.result.status;
    });

    // Step 4: Send notification
    if (status === "success") {
      await step.run("notify-success", async () => {
        // Send success notification to user
        console.log(`Deployment ${deployment.id} successful: ${deployment.result.url}`);
      });
    } else {
      await step.run("notify-failure", async () => {
        // Send failure notification to user
        console.log(`Deployment ${deployment.id} failed: ${deployment.result.error}`);
      });
    }

    return deployment;
  }
);

/**
 * Deployment rollback function
 */
export const deploymentRollback = inngest.createFunction(
  {
    id: "deployment-rollback",
    name: "Deployment Rollback",
  },
  { event: "app/rollback-request" },
  async ({ event, step }) => {
    const { deploymentId } = event.data;

    // Step 1: Initiate rollback
    const rollbackResult = await step.run("initiate-rollback", async () => {
      console.log(`Rolling back deployment ${deploymentId}`);
      await rollbackDeployment(deploymentId);
      return { success: true };
    });

    // Step 2: Verify rollback
    const verification = await step.run("verify-rollback", async () => {
      const status = await getDeploymentStatus(deploymentId);
      return {
        deploymentId,
        status: status?.status || "unknown",
        success: status?.status === "cancelled",
      };
    });

    return {
      ...rollbackResult,
      verification,
    };
  }
);
