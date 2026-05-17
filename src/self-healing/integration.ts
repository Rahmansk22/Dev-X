// src/self-healing/integration.ts
// Integration hooks for tRPC, Inngest, and API endpoints

import { SelfHealingAgent, BuildEvent } from "./agent";
import { errorDetector, ErrorDetector } from "./error-detector";
import { autoFixer, AutoFixer } from "./auto-fixer";

/**
 * Initialize the self-healing agent integrated with your SaaS backend
 */
export function initializeSelfHealingAgent() {
  const agent = new SelfHealingAgent({
    onError: async (event: BuildEvent) => {
      // Log error to database or logging service (e.g., Sentry)
      console.error(`[Self-Healing] Build error for app ${event.appId}:`, event.error);

      // Detect error pattern
      const pattern = errorDetector.detect(event.log);
      if (pattern) {
        console.log(`[Self-Healing] Detected pattern: ${pattern.name}`);
      }

      // Notify user (e.g., via Inngest, real-time event, or push notification)
      // await notifyUser(event.userId, {
      //   type: "build_failed",
      //   appId: event.appId,
      //   message: pattern?.suggestedFix || "Build failed. Attempting automatic recovery...",
      // });
    },

    onAutoFix: async (event: BuildEvent, fixResult: string) => {
      console.log(`[Self-Healing] Auto-fix applied for app ${event.appId}:`, fixResult);

      // Update database with fix attempt
      // await db.buildEvents.update({
      //   where: { id: event.id },
      //   data: { fixAttempt: fixResult, fixAttemptedAt: new Date() },
      // });

      // Notify user of recovery attempt
      // await notifyUser(event.userId, {
      //   type: "auto_fix_attempted",
      //   appId: event.appId,
      //   message: fixResult,
      // });
    },
  });

  return agent;
}

/**
 * Hook into your build/deploy pipeline to emit events
 */
export async function handleBuildEvent(
  appId: string,
  userId: string,
  buildLog: string,
  status: "success" | "error",
  error?: string
) {
  const agent = initializeSelfHealingAgent();

  const event: BuildEvent = {
    type: "build",
    appId,
    userId,
    log: buildLog,
    status,
    timestamp: Date.now(),
    error,
  };

  await agent.monitor(event);
}

/**
 * Hook into your deploy pipeline
 */
export async function handleDeployEvent(
  appId: string,
  userId: string,
  deployLog: string,
  status: "success" | "error",
  error?: string
) {
  const agent = initializeSelfHealingAgent();

  const event: BuildEvent = {
    type: "deploy",
    appId,
    userId,
    log: deployLog,
    status,
    timestamp: Date.now(),
    error,
  };

  await agent.monitor(event);
}

/**
 * Get error severity for UI/notification decisions
 */
export function getErrorSeverity(log: string): "critical" | "warning" | "info" {
  return errorDetector.getSeverity(log);
}

/**
 * Detect and classify errors in a log
 */
export function detectErrors(log: string) {
  return errorDetector.detectAll(log);
}
