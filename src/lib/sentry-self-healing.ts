// src/lib/sentry-self-healing.ts
// Sentry integration with self-healing agent for error tracking

import * as Sentry from "@sentry/nextjs";
import { detectErrors, getErrorSeverity } from "@/self-healing/integration";

/**
 * Capture and track build errors in Sentry with self-healing context
 */
export function captureBuildError(
  appId: string,
  userId: string,
  error: Error | string,
  context?: Record<string, any>
) {
  const errorMessage = typeof error === "string" ? error : error.message;
  const detectedErrors = detectErrors(errorMessage);
  const severity = getErrorSeverity(errorMessage);

  Sentry.captureException(error, {
    tags: {
      appId,
      userId,
      errorSeverity: severity,
      detectedPatterns: detectedErrors.map((e) => e.id).join(","),
    },
    contexts: {
      build: {
        appId,
        userId,
        errorMessage,
        detectedErrors: detectedErrors.map((e) => ({
          id: e.id,
          name: e.name,
          severity: e.severity,
        })),
        autoFixEnabled: true,
      },
      ...context,
    },
    level: severity === "critical" ? "error" : "warning",
  });
}

/**
 * Capture deployment errors in Sentry
 */
export function captureDeployError(
  appId: string,
  userId: string,
  error: Error | string,
  context?: Record<string, any>
) {
  const errorMessage = typeof error === "string" ? error : error.message;
  const detectedErrors = detectErrors(errorMessage);
  const severity = getErrorSeverity(errorMessage);

  Sentry.captureException(error, {
    tags: {
      appId,
      userId,
      errorSeverity: severity,
      deploymentError: "true",
    },
    contexts: {
      deployment: {
        appId,
        userId,
        errorMessage,
        detectedErrors: detectedErrors.map((e) => ({
          id: e.id,
          name: e.name,
        })),
      },
      ...context,
    },
    level: "error",
  });
}

/**
 * Track auto-fix attempts in Sentry
 */
export function trackAutoFixAttempt(
  appId: string,
  userId: string,
  fixType: string,
  result: "success" | "failed",
  context?: Record<string, any>
) {
  Sentry.captureMessage(`Auto-fix attempted: ${fixType}`, {
    tags: {
      appId,
      userId,
      fixType,
      result,
    },
    contexts: {
      autoFix: {
        appId,
        userId,
        fixType,
        result,
        timestamp: new Date().toISOString(),
      },
      ...context,
    },
    level: result === "success" ? "info" : "warning",
  });
}

/**
 * Send breadcrumb for build/deploy events
 */
export function addBuildBreadcrumb(
  appId: string,
  event: "build_started" | "build_failed" | "deploy_started" | "deploy_failed",
  context?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message: event,
    category: "build-deploy",
    level: "info",
    data: {
      appId,
      ...context,
    },
  });
}
