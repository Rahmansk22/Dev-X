# One-Click Deployment System

## Overview

Complete one-click deployment system for your SaaS. Users can deploy their generated apps to production with a single click, supporting multiple providers (Vercel, Netlify, AWS, Railway, Heroku).

## Features

- ✅ **One-Click Deployment** - Deploy with minimal configuration
- ✅ **Multi-Provider Support** - Vercel, Netlify, AWS, Railway, Heroku
- ✅ **Self-Healing Integration** - Auto-recovery for failed deployments
- ✅ **Real-Time Logs** - Stream deployment logs to user
- ✅ **Deployment Status Tracking** - Monitor active deployments
- ✅ **Rollback Capability** - Revert to previous deployments
- ✅ **Custom Domains** - Assign custom domains to deployments
- ✅ **Environment Configuration** - Set env vars per deployment

## Architecture

### Core Components

```
src/deployment/
├── types.ts                  # Type definitions
├── deployment-manager.ts     # Main orchestrator
├── integration.ts            # Integration hooks
├── hooks.ts                  # React hooks
├── adapters/
│   ├── vercel-adapter.ts    # Vercel provider
│   └── netlify-adapter.ts   # Netlify provider
└── index.ts                  # Exports
```

### Integration Points

```
src/trpc/routers/deployments.ts    # tRPC endpoints
src/components/deployment-dialog.tsx # UI component
src/inngest/functions/deployment.ts  # Inngest pipeline
```

## Usage

### 1. One-Click Deploy Button

```tsx
import { DeploymentDialog } from "@/components/deployment-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProjectActions() {
  const [deployOpen, setDeployOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDeployOpen(true)}>
        🚀 Deploy to Production
      </Button>

      <DeploymentDialog
        appId="app_123"
        buildId="build_456"
        isOpen={deployOpen}
        onOpenChange={setDeployOpen}
        onDeploySuccess={(url) => {
          window.open(url, "_blank");
        }}
      />
    </>
  );
}
```

### 2. Custom Deployment Hook

```tsx
import { useDeployment } from "@/deployment/hooks";

function MyDeploymentComponent() {
  const { deploy, isDeploying, deploymentUrl, logs } = useDeployment({
    appId: "app_123",
    buildId: "build_456",
    onSuccess: (url) => console.log("Deployed:", url),
    onError: (error) => console.error("Failed:", error),
  });

  const handleDeploy = async () => {
    await deploy("vercel", "YOUR_API_KEY", {
      region: "us-east-1",
    });
  };

  return (
    <>
      <button onClick={handleDeploy} disabled={isDeploying}>
        {isDeploying ? "Deploying..." : "Deploy"}
      </button>
      {deploymentUrl && <p>Live: {deploymentUrl}</p>}
    </>
  );
}
```

### 3. Inngest Pipeline

```ts
import { inngest } from "@/inngest";

// Trigger deployment via Inngest
await inngest.send({
  name: "app/deploy-request",
  data: {
    appId: "app_123",
    userId: "user_456",
    buildId: "build_789",
    provider: "vercel",
    apiKey: process.env.VERCEL_API_KEY,
    config: {
      region: "us-east-1",
      customDomain: "myapp.com",
    },
  },
});
```

## Deployment Flow

```
User clicks "Deploy"
    ↓
DeploymentDialog opens
    ↓
User selects provider & enters API key
    ↓
tRPC deployments.deploy mutation called
    ↓
DeploymentManager initialized
    ↓
Provider adapter selected (Vercel/Netlify/etc)
    ↓
Deployment executed
    ├─ Upload build files
    ├─ Trigger build
    ├─ Wait for deployment
    └─ Get live URL
    ↓
onSuccess hook called
    ├─ Log to self-healing
    ├─ Notify user
    └─ Show live URL
    ↓
User can visit live URL or rollback
```

## Provider Integration

### Vercel

```ts
const deployment = await deploy(
  "app_123",
  "user_456",
  "build_789",
  {
    provider: "vercel",
    projectId: "app_123",
    apiKey: process.env.VERCEL_TOKEN,
  },
  "/build",
  "my-app",
);
```

### Netlify

```ts
const deployment = await deploy(
  "app_123",
  "user_456",
  "build_789",
  {
    provider: "netlify",
    projectId: "app_123",
    apiKey: process.env.NETLIFY_TOKEN,
  },
  "/build",
  "my-app",
);
```

## Configuration

### Environment Variables

Set these in your `.env.local`:

```env
VERCEL_TOKEN=your_vercel_token
NETLIFY_TOKEN=your_netlify_token
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret
```

### Custom Domains

Enable custom domain support:

```ts
const deployment = await deploy(
  appId,
  userId,
  buildId,
  {
    provider: "vercel",
    projectId: appId,
    apiKey,
    customDomain: "myapp.com", // Enable custom domain
  },
  buildDir,
  projectName,
);
```

## Monitoring & Observability

### Deployment Events

```ts
const manager = initializeDeploymentManager();

manager.on("start", (deployment) => {
  // Track deployment start
});

manager.on("success", (deployment, url) => {
  // Track successful deployment
});

manager.on("error", (deployment, error) => {
  // Track failed deployment
});
```

### Self-Healing Integration

Failed deployments are automatically logged with the self-healing agent:

```ts
await handleDeployEvent(appId, userId, logs, "error", error);
```

## Extending with New Providers

Create a new adapter:

```ts
// src/deployment/adapters/custom-adapter.ts
export class CustomDeploymentAdapter {
  async deploy(
    buildDir: string,
    projectName: string,
  ): Promise<DeploymentResult> {
    // Implementation
  }
}
```

Register in `DeploymentManager`:

```ts
case "custom":
  return new CustomDeploymentAdapter(config);
```

## API Reference

### DeploymentManager

```ts
deploy(appId, userId, buildId, config, buildDir, projectName): Promise<Deployment>
getDeploymentStatus(deploymentId): Promise<DeploymentResult | null>
rollback(deploymentId): Promise<void>
```

### tRPC Endpoints

- `deployments.deploy` - Trigger deployment
- `deployments.getStatus` - Get deployment status
- `deployments.rollback` - Rollback deployment
- `deployments.getProviders` - List available providers

### React Hooks

- `useDeployment()` - Manage deployment state
- `useDeploymentProviders()` - Fetch available providers

---

**Production-ready one-click deployment system.**
