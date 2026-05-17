// src/deployment/adapters/netlify-adapter.ts
// Netlify deployment adapter

import { DeploymentConfig, DeploymentResult } from "../types";
import { spawn } from "child_process";
import path from "path";

export class NetlifyDeploymentAdapter {
  constructor(private config: DeploymentConfig) {}

  async deploy(buildDir: string, projectName: string): Promise<DeploymentResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    try {
      logs.push(`[Netlify] Starting deployment for ${projectName}...`);

      const token = this.config.apiKey || process.env.NETLIFY_AUTH_TOKEN;
      if (!token) {
        throw new Error("Missing Netlify token. Set NETLIFY_AUTH_TOKEN on the server.");
      }

      const workspaceDir = process.cwd();
      const deployDir = path.isAbsolute(buildDir)
        ? buildDir
        : path.resolve(workspaceDir, buildDir || ".");

      logs.push(`[Netlify] Using deploy directory: ${deployDir}`);
      const deployment = await this.runNetlifyDeploy(deployDir, token, logs);
      logs.push(`[Netlify] Deployment finalized: ${deployment.url}`);

      return {
        deploymentId: deployment.id,
        status: "success",
        url: deployment.url,
        previewUrl: deployment.url,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        logs,
      };
    } catch (error) {
      logs.push(`[Netlify] Error: ${(error as Error).message}`);
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

  private runNetlifyDeploy(
    deployDir: string,
    token: string,
    logs: string[]
  ): Promise<{ id: string; url: string }> {
    return new Promise((resolve, reject) => {
      const args = [
        "netlify",
        "deploy",
        "--prod",
        "--dir",
        deployDir,
        "--auth",
        token,
        "--json",
      ];

      const child = spawn("npx", args, {
        cwd: deployDir,
        env: {
          ...process.env,
          NETLIFY_AUTH_TOKEN: token,
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
          if (trimmed) logs.push(`[Netlify] ${trimmed}`);
        }
      });

      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        errorOutput += text;
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed) logs.push(`[Netlify][stderr] ${trimmed}`);
        }
      });

      child.on("error", (error) => {
        reject(new Error(`Failed to run Netlify CLI: ${error.message}`));
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(
            `Netlify deploy failed (exit ${code}). ${errorOutput || output || "No output available."}`
          ));
          return;
        }

        const combined = `${output}\n${errorOutput}`;
        const jsonMatch = combined.match(/\{[\s\S]*\}/g);
        const urlMatch = combined.match(/https:\/\/[a-zA-Z0-9.-]+\.netlify\.app/g);

        let deploymentId = `netlify_${Date.now()}`;
        let url = urlMatch ? urlMatch[urlMatch.length - 1] : "";

        if (jsonMatch && jsonMatch.length > 0) {
          const raw = jsonMatch[jsonMatch.length - 1];
          try {
            const parsed = JSON.parse(raw);
            deploymentId = parsed?.id || parsed?.deploy_id || deploymentId;
            url = parsed?.ssl_url || parsed?.url || parsed?.deploy_url || url;
          } catch {
            // Fall through to regex-derived URL.
          }
        }

        if (!url) {
          reject(new Error("Deployment succeeded but no Netlify URL was found in CLI output."));
          return;
        }

        resolve({ id: deploymentId, url });
      });
    });
  }
}
