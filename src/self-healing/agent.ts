// src/self-healing/agent.ts
// Senior-level, production-grade self-healing agent for SaaS build/deploy error recovery

import { EventEmitter } from "events";
import prisma from "@/lib/db";
import { Sandbox } from "e2b";
import { runInstallAndBuild } from "@/lib/build-executor";
import { deployApp } from "@/deployment/integration";

const activeDeployHeals = new Set<string>();

export type BuildEvent = {
  type: "build" | "deploy";
  appId: string;
  userId: string;
  log: string;
  status: "success" | "error";
  timestamp: number;
  error?: string;
};

export interface SelfHealingAgentOptions {
  onError: (event: BuildEvent) => Promise<void>;
  onAutoFix?: (event: BuildEvent, fixResult: string) => Promise<void>;
}

export class SelfHealingAgent extends EventEmitter {
  private options: SelfHealingAgentOptions;

  constructor(options: SelfHealingAgentOptions) {
    super();
    this.options = options;
  }

  async monitor(event: BuildEvent) {
    if (event.status === "error") {
      await this.options.onError(event);
      const fixResult = await this.autoFix(event);
      if (this.options.onAutoFix) {
        await this.options.onAutoFix(event, fixResult);
      }
    }
  }

  async autoFix(event: BuildEvent): Promise<string> {
    if (event.type === "build") {
      const project = await prisma.project.findUnique({
        where: { id: event.appId },
        select: { id: true, sandboxId: true },
      });

      if (!project?.sandboxId) {
        return `Project ${event.appId} has no sandbox attached. Cannot self-heal build.`;
      }

      try {
        console.log(`[Self-Healing] Connecting to E2B sandbox ${project.sandboxId} for app ${event.appId}...`);
        const sandbox = await Sandbox.connect(project.sandboxId);
        const buildResult = await runInstallAndBuild(sandbox, event.appId);
        const installExit = buildResult.install.exitCode ?? 1;
        const buildExit = buildResult.build.exitCode ?? 1;

        if (installExit !== 0 || buildExit !== 0) {
          return `Build failed in E2B sandbox for project ${event.appId}. Install exit=${installExit}, Build exit=${buildExit}`;
        }
        return `Build succeeded in E2B sandbox for project ${event.appId}.`;
      } catch (err: any) {
        console.error(`[Self-Healing] Sandbox build error:`, err);
        return `Failed to connect or build in E2B sandbox: ${err.message}`;
      }
    } else if (event.type === "deploy") {
      const token = process.env.VERCEL_TOKEN;
      if (!token) {
        return `VERCEL_TOKEN is required for self-healing deployment workflow`;
      }

      if (activeDeployHeals.has(event.appId)) {
        return `Already attempting a self-healing deployment for project ${event.appId}. Aborting recursion loop.`;
      }

      activeDeployHeals.add(event.appId);

      try {
        console.log(`[Self-Healing] Redeploying app ${event.appId} via Vercel REST API...`);
        const deployment = await deployApp(
          event.appId,
          event.userId,
          `deploy_heal_${Date.now()}`,
          {
            provider: "vercel",
            projectId: event.appId,
            apiKey: token,
          },
          process.cwd(),
          event.appId
        );

        if (deployment.result.status !== "success") {
          return `Deployment failed during self-healing: ${deployment.result.error}`;
        }
        return `Deployment succeeded during self-healing: ${deployment.result.url}`;
      } catch (err: any) {
        console.error(`[Self-Healing] Sandbox deploy error:`, err);
        return `Failed to deploy in self-healing: ${err.message}`;
      } finally {
        activeDeployHeals.delete(event.appId);
      }
    }
    return "No auto-fix applied.";
  }
}

