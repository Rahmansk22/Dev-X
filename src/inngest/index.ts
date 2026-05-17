
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
		// Code generation
		codeAgentFunction,
		// Smart routing
		smartRouterFunction,
		// Analysis & context building
		analyzeRequestFunction,
		generateQuestionsFunction,
		buildContextFunction,
		// Self-healing & deployment
		buildWithSelfHealing,
		deployWithSelfHealing,
		oneClickDeploy,
		deploymentRollback,
	],
});

