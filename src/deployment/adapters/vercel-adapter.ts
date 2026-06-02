// src/deployment/adapters/vercel-adapter.ts
// Vercel deployment via REST API — deploys files directly from DB (no CLI needed)

import { DeploymentConfig, DeploymentResult } from "../types";
import prisma from "@/lib/db";

export class VercelDeploymentAdapter {
  constructor(private config: DeploymentConfig) {}

  /**
   * Deploy files directly via Vercel REST API.
   * Like Lovable/Replit — no CLI, no local filesystem, just files from DB.
   */
  async deployFiles(
    files: Record<string, string>,
    projectName: string
  ): Promise<DeploymentResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    try {
      const token = this.config.apiKey || process.env.VERCEL_TOKEN;
      if (!token) {
        throw new Error("Missing VERCEL_TOKEN. Add it to your environment variables.");
      }

      // Sanitize project name for Vercel (lowercase, alphanumeric + hyphens only)
      const safeName = projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 52) || "devx-app";

      logs.push(`[Vercel] Deploying ${Object.keys(files).length} files as "${safeName}"...`);

      // Build the Vercel API payload
      const vercelFiles = Object.entries(files).map(([filePath, content]) => ({
        file: filePath,
        data: Buffer.from(content, "utf-8").toString("base64"),
        encoding: "base64" as const,
      }));

      // Create deployment via Vercel API
      const response = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: safeName,
          files: vercelFiles,
          target: "production",
          projectSettings: {
            framework: "nextjs",
            buildCommand: "next build",
            outputDirectory: ".next",
            installCommand: "npm install",
            nodeVersion: "20.x",
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        logs.push(`[Vercel] API error (${response.status}): ${errBody.slice(0, 500)}`);
        throw new Error(`Vercel API returned ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const deploymentId = data.id || "unknown";
      const deployUrl = data.url
        ? `https://${data.url}`
        : data.alias?.[0]
          ? `https://${data.alias[0]}`
          : null;

      logs.push(`[Vercel] Deployment created: ${deploymentId}`);
      logs.push(`[Vercel] URL: ${deployUrl || "pending..."}`);

      // Poll for deployment readiness (max 120s)
      const finalUrl = await this.pollDeployment(deploymentId, token, logs);

      return {
        deploymentId,
        status: "success",
        url: finalUrl || deployUrl || `https://${safeName}.vercel.app`,
        previewUrl: deployUrl || undefined,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        logs,
      };
    } catch (error) {
      logs.push(`[Vercel] Error: ${(error as Error).message}`);
      return {
        deploymentId: "unknown",
        status: "failed",
        error: (error as Error).message,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        logs,
      };
    }
  }

  /**
   * Poll Vercel deployment status until READY or ERROR.
   */
  private async pollDeployment(
    deploymentId: string,
    token: string,
    logs: string[]
  ): Promise<string | null> {
    const maxAttempts = 40; // 40 × 3s = 120s max
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      try {
        const res = await fetch(
          `https://api.vercel.com/v13/deployments/${deploymentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) continue;
        const data = await res.json();

        if (data.readyState === "READY") {
          const url = data.url ? `https://${data.url}` : null;
          logs.push(`[Vercel] ✅ Deployment READY: ${url}`);
          return url;
        }

        if (data.readyState === "ERROR") {
          logs.push(`[Vercel] ❌ Deployment FAILED`);
          throw new Error("Vercel build failed. Check the Vercel dashboard for details.");
        }

        logs.push(`[Vercel] ⏳ Status: ${data.readyState} (${i + 1}/${maxAttempts})`);
      } catch (e) {
        if ((e as Error).message.includes("build failed")) throw e;
        // Network glitch, retry
      }
    }

    logs.push(`[Vercel] ⚠️ Deployment still building after 120s — URL may take a moment`);
    return null;
  }

  /**
   * Legacy CLI-based deploy (kept for backward compatibility)
   * Automatically redirects to REST API database file deployment.
   */
  async deploy(buildDir: string, projectName: string): Promise<DeploymentResult> {
    try {
      // Fetch latest fragment files from DB for this project
      const latestFragment = await prisma.fragment.findFirst({
        where: { message: { projectId: this.config.projectId } },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestFragment?.files) {
        throw new Error("No files found in database for this project. Generate the app first.");
      }

      const files = latestFragment.files as Record<string, string>;
      return await this.deployFiles(files, projectName);
    } catch (error: any) {
      return {
        deploymentId: "unknown",
        status: "failed",
        error: error.message,
        startTime: Date.now(),
        endTime: Date.now(),
        logs: [`[Vercel] Error during DB-based deploy redirect: ${error.message}`],
      };
    }
  }
}
