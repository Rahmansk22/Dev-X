// src/deployment/adapters/vercel-adapter.ts
// Vercel deployment adapter

import { DeploymentConfig, DeploymentResult } from "../types";
import { spawn } from "child_process";
import path from "path";

export class VercelDeploymentAdapter {
  constructor(private config: DeploymentConfig) {}

  async deploy(buildDir: string, projectName: string): Promise<DeploymentResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    try {
      logs.push(`[Vercel] Starting deployment for ${projectName}...`);
      const token = this.config.apiKey || process.env.VERCEL_TOKEN;

      if (!token) {
        throw new Error("Missing Vercel token. Set VERCEL_TOKEN on the server.");
      }

      const workspaceDir = process.cwd();
      const deployDir = path.isAbsolute(buildDir)
        ? buildDir
        : path.resolve(workspaceDir, buildDir || ".");

      logs.push(`[Vercel] Using deploy directory: ${deployDir}`);
      const cliResult = await this.runVercelDeploy(deployDir, token, logs);
      logs.push(`[Vercel] Deployment complete: ${cliResult.url}`);

      return {
        deploymentId: cliResult.deploymentId,
        status: "success",
        url: cliResult.url,
        previewUrl: cliResult.url,
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

  private runVercelDeploy(
    deployDir: string,
    token: string,
    logs: string[]
  ): Promise<{ deploymentId: string; url: string }> {
    return new Promise((resolve, reject) => {
      const args = [
        "vercel",
        "deploy",
        "--prod",
        "--yes",
        "--token",
        token,
      ];

      const child = spawn("npx", args, {
        cwd: deployDir,
        env: {
          ...process.env,
          VERCEL_TOKEN: token,
        },
        shell: process.platform === "win32",
      });

      let output = "";
      let errorOutput = "";

      child.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        output += text;
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed) logs.push(`[Vercel] ${trimmed}`);
        }
      });

      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        errorOutput += text;
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed) logs.push(`[Vercel][stderr] ${trimmed}`);
        }
      });

      child.on("error", (error) => {
        reject(new Error(`Failed to run Vercel CLI: ${error.message}`));
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `Vercel deploy failed (exit ${code}). ${errorOutput || output || "No output available."}`
            )
          );
          return;
        }

        const combinedOutput = `${output}\n${errorOutput}`;
        const urlMatch = combinedOutput.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/g);

        if (!urlMatch || urlMatch.length === 0) {
          reject(new Error("Deployment succeeded but no Vercel URL was found in CLI output."));
          return;
        }

        const url = urlMatch[urlMatch.length - 1];
        const deploymentId = url.replace("https://", "").replace(".vercel.app", "");
        resolve({ deploymentId, url });
      });
    });
  }
}
