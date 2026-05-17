import "dotenv/config";
import { serve } from "inngest/next";
import { inngest } from "./client";
import { codeAgentFunction } from "./functions";
import {
  analyzeRequestFunction,
  generateQuestionsFunction,
  buildContextFunction,
  smartRouterFunction,
} from "./analyzer-functions";
import { buildWithSelfHealing, deployWithSelfHealing } from "./functions/self-healing";
import { oneClickDeploy, deploymentRollback } from "./functions/deployment";

export default serve({
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
