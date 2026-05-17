// src/self-healing/agent.ts
// Senior-level, production-grade self-healing agent for SaaS build/deploy error recovery

import { EventEmitter } from "events";
import { spawn } from "child_process";

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
    // Example: Retry build/deploy, clean cache, or apply known fixes
    // This is a placeholder for extensible auto-fix logic
    if (event.type === "build") {
      // Retry build (simulate with a shell command)
      return await this.runCommand(`npm run build --workspace=${event.appId}`);
    } else if (event.type === "deploy") {
      // Retry deploy (simulate with a shell command)
      return await this.runCommand(`npm run deploy --workspace=${event.appId}`);
    }
    return "No auto-fix applied.";
  }

  private runCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, { shell: true });
      let output = "";
      child.stdout.on("data", (data) => (output += data.toString()));
      child.stderr.on("data", (data) => (output += data.toString()));
      child.on("close", (code) => {
        if (code === 0) resolve(output);
        else reject(output);
      });
    });
  }
}

// Usage example (to be integrated with your build/deploy pipeline):
// const agent = new SelfHealingAgent({
//   onError: async (event) => {
//     // Log error, notify user, etc.
//   },
//   onAutoFix: async (event, fixResult) => {
//     // Log fix attempt, notify user, etc.
//   },
// });
// agent.monitor(buildEvent);
