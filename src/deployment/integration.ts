// src/deployment/integration.ts
// Deployment integration with tRPC and Inngest

import { DeploymentManager } from "./deployment-manager";
import { DeploymentConfig } from "./types";
import { handleDeployEvent } from "@/self-healing/integration";

export function initializeDeploymentManager() {
  return new DeploymentManager({
    onStart: async (deployment) => {
      console.log(`[Deployment] Started: ${deployment.id}`);
      // Log to database, send notification, etc.
    },

    onSuccess: async (deployment, url) => {
      console.log(`[Deployment] Success: ${url}`);

      // Log deployment event with self-healing
      await handleDeployEvent(
        deployment.appId,
        deployment.userId,
        `Deployment successful: ${url}`,
        "success"
      );

      // Notify user
      // await notifyUser(deployment.userId, {
      //   type: "deployment_success",
      //   appId: deployment.appId,
      //   url,
      // });
    },

    onError: async (deployment, error) => {
      console.log(`[Deployment] Error: ${error}`);

      // CRITICAL GUARD: Prevent infinite self-healing loops for failed auto-fix deployment runs
      if (deployment.buildId?.startsWith("deploy_heal_")) {
        console.warn(`[Deployment] Self-healing deployment failed for app ${deployment.appId}. Aborting recursion loop.`);
        return;
      }

      // Log deployment error with self-healing
      await handleDeployEvent(
        deployment.appId,
        deployment.userId,
        `Deployment failed: ${error}`,
        "error",
        error
      );

      // Notify user
      // await notifyUser(deployment.userId, {
      //   type: "deployment_failed",
      //   appId: deployment.appId,
      //   error,
      // });
    },
  });
}

export async function deployApp(
  appId: string,
  userId: string,
  buildId: string,
  config: DeploymentConfig,
  buildDir: string,
  projectName: string
) {
  const manager = initializeDeploymentManager();
  return await manager.deploy(appId, userId, buildId, config, buildDir, projectName);
}

export async function getDeploymentStatus(deploymentId: string) {
  const manager = initializeDeploymentManager();
  return await manager.getDeploymentStatus(deploymentId);
}

export async function rollbackDeployment(deploymentId: string) {
  const manager = initializeDeploymentManager();
  return await manager.rollback(deploymentId);
}
