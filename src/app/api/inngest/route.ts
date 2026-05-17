// Allow long-running AI model calls (up to 5 minutes)
export const maxDuration = 300;

import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { codeAgentFunction } from "@/inngest/functions";
import {
  analyzeRequestFunction,
  generateQuestionsFunction,
  buildContextFunction,
  smartRouterFunction,
} from "@/inngest/analyzer-functions";
import { buildWithSelfHealing, deployWithSelfHealing } from "@/inngest/functions/self-healing";
import { oneClickDeploy, deploymentRollback } from "@/inngest/functions/deployment";

function safeServe(options: Parameters<typeof serve>[0]) {
  const handler = serve(options);
  // Wrap each method to catch JSON parse errors
  const wrap = (fn: any) => async (req: Request, ...args: any[]) => {
    try {
      return await fn(req, ...args);
    } catch (err: any) {
      // Suppress JSON parse errors - they're expected for signature verification
      if (err instanceof SyntaxError && err.message.includes("JSON")) {
        console.debug("[Inngest] Suppressed JSON parse error - likely empty body for signature check");
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw err;
    }
  };
  return {
    GET: handler.GET ? wrap(handler.GET) : undefined,
    POST: handler.POST ? wrap(handler.POST) : undefined,
    PUT: handler.PUT ? wrap(handler.PUT) : undefined,
  };
}

export const { GET, POST, PUT } = safeServe({
  client: inngest,
  functions: [
    codeAgentFunction,
    smartRouterFunction,
    analyzeRequestFunction,
    generateQuestionsFunction,
    buildContextFunction,
    buildWithSelfHealing,
    deployWithSelfHealing,
    oneClickDeploy,
    deploymentRollback,
  ],
});
