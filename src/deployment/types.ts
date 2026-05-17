// src/deployment/types.ts
// Deployment types and interfaces

export type DeploymentProvider = "vercel" | "netlify" | "aws" | "railway" | "heroku" | "custom";

export type DeploymentStatus = "idle" | "building" | "deploying" | "success" | "failed" | "cancelled";

export interface DeploymentConfig {
  provider: DeploymentProvider;
  projectId: string;
  apiKey: string;
  region?: string;
  environment?: Record<string, string>;
  customDomain?: string;
}

export interface DeploymentResult {
  deploymentId: string;
  status: DeploymentStatus;
  url?: string;
  previewUrl?: string;
  error?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  logs: string[];
}

export interface Deployment {
  id: string;
  appId: string;
  userId: string;
  buildId: string;
  config: DeploymentConfig;
  result: DeploymentResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeploymentHookOptions {
  onStart?: (deployment: Deployment) => Promise<void>;
  onProgress?: (deployment: Deployment, progress: number) => Promise<void>;
  onSuccess?: (deployment: Deployment, url: string) => Promise<void>;
  onError?: (deployment: Deployment, error: string) => Promise<void>;
}
