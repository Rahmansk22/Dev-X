// src/self-healing/index.ts
// Main exports

export { SelfHealingAgent } from "./agent";
export type { BuildEvent, SelfHealingAgentOptions } from "./agent";

export { ErrorDetector, COMMON_BUILD_ERRORS, errorDetector } from "./error-detector";
export type { ErrorPattern } from "./error-detector";

export { AutoFixer, autoFixer } from "./auto-fixer";
export type { FixStrategy } from "./auto-fixer";

export { FallbackUI } from "./fallback-ui";

export {
  initializeSelfHealingAgent,
  handleBuildEvent,
  handleDeployEvent,
  getErrorSeverity,
  detectErrors,
} from "./integration";
