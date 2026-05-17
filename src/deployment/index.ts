// src/deployment/index.ts
// Main exports for deployment module

export { DeploymentManager } from "./deployment-manager";
export { VercelDeploymentAdapter } from "./adapters/vercel-adapter";
export { NetlifyDeploymentAdapter } from "./adapters/netlify-adapter";
export { initializeDeploymentManager, deployApp, getDeploymentStatus, rollbackDeployment } from "./integration";
export type { DeploymentProvider, DeploymentStatus, DeploymentConfig, DeploymentResult, Deployment, DeploymentHookOptions } from "./types";
