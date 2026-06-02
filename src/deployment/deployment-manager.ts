// src/deployment/deployment-manager.ts
// Main deployment orchestration

import { VercelDeploymentAdapter } from "./adapters/vercel-adapter";
import { NetlifyDeploymentAdapter } from "./adapters/netlify-adapter";
import { DeploymentConfig, DeploymentResult, DeploymentHookOptions, Deployment } from "./types";
import { EventEmitter } from "events";

export class DeploymentManager extends EventEmitter {
  private hooks: DeploymentHookOptions = {};
  private static deploymentResults = new Map<string, DeploymentResult>();

  constructor(hooks?: DeploymentHookOptions) {
    super();
    this.hooks = hooks || {};
    // Prevent process crashes on "error" emissions when no external listeners are attached
    this.on("error", (deployment, error) => {
      console.warn(`[DeploymentManager] Emitted error event: ${error} for deployment ${deployment?.id}`);
    });
  }

  async deploy(
    appId: string,
    userId: string,
    buildId: string,
    config: DeploymentConfig,
    buildDir: string,
    projectName: string
  ): Promise<Deployment> {
    const deployment: Deployment = {
      id: `deploy_${Date.now()}`,
      appId,
      userId,
      buildId,
      config,
      result: {
        deploymentId: "",
        status: "deploying",
        logs: [],
        startTime: Date.now(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Call onStart hook
      if (this.hooks.onStart) {
        await this.hooks.onStart(deployment);
      }
      this.emit("start", deployment);

      // Get adapter based on provider
      const adapter = this.getAdapter(config);

      // Execute deployment
      const result = await adapter.deploy(buildDir, projectName);

      deployment.result = result;
      DeploymentManager.deploymentResults.set(deployment.id, result);
      if (result.deploymentId) {
        DeploymentManager.deploymentResults.set(result.deploymentId, result);
      }

      if (result.status === "success") {
        deployment.result.status = "success";

        // Call onSuccess hook
        if (this.hooks.onSuccess && result.url) {
          await this.hooks.onSuccess(deployment, result.url);
        }
        this.emit("success", deployment, result.url);
      } else {
        deployment.result.status = "failed";

        // Call onError hook
        if (this.hooks.onError && result.error) {
          await this.hooks.onError(deployment, result.error);
        }
        this.emit("error", deployment, result.error);
      }

      deployment.updatedAt = new Date();
      return deployment;
    } catch (error) {
      deployment.result.status = "failed";
      deployment.result.error = (error as Error).message;
      DeploymentManager.deploymentResults.set(deployment.id, deployment.result);

      if (this.hooks.onError) {
        await this.hooks.onError(deployment, (error as Error).message);
      }
      this.emit("error", deployment, (error as Error).message);

      deployment.updatedAt = new Date();
      return deployment;
    }
  }

  private getAdapter(config: DeploymentConfig) {
    switch (config.provider) {
      case "vercel":
        return new VercelDeploymentAdapter(config);
      case "netlify":
        return new NetlifyDeploymentAdapter(config);
      default:
        throw new Error(`Unsupported deployment provider: ${config.provider}`);
    }
  }

  async getDeploymentStatus(_deploymentId: string): Promise<DeploymentResult | null> {
    return DeploymentManager.deploymentResults.get(_deploymentId) ?? null;
  }

  async rollback(_deploymentId: string): Promise<void> {
    const existing = DeploymentManager.deploymentResults.get(_deploymentId);
    if (!existing) {
      throw new Error(`Deployment ${_deploymentId} not found`);
    }

    const rolledBack: DeploymentResult = {
      ...existing,
      status: "cancelled",
      error: undefined,
      endTime: Date.now(),
      logs: [...(existing.logs || []), `[rollback] Deployment ${_deploymentId} marked as rolled back.`],
    };

    DeploymentManager.deploymentResults.set(_deploymentId, rolledBack);
    if (rolledBack.deploymentId) {
      DeploymentManager.deploymentResults.set(rolledBack.deploymentId, rolledBack);
    }
  }
}

export const deploymentManager = new DeploymentManager();
