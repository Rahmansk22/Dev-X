// src/deployment/hooks.ts
// Custom React hooks for deployment functionality

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

interface UseDeploymentOptions {
  appId: string;
  buildId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for managing deployment state and actions
 */
export function useDeployment(options: UseDeploymentOptions) {
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const queryClient = useQueryClient();
  const { appId, buildId, onSuccess, onError } = options;
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const deployMutation = useMutation(trpcAny.deployments.deploy.mutationOptions() as any);
  const rollbackMutation = useMutation(trpcAny.deployments.rollback.mutationOptions() as any);

  const deploy = useCallback(
    async (config?: any) => {
      setIsDeploying(true);
      setError(null);
      setDeploymentUrl(null);
      setLogs([]);

      try {
        const result: any = await (deployMutation as any).mutateAsync({
          appId,
          buildId,
          provider: "vercel",
          apiKey: config?.apiKey,
          sourceDir: config?.sourceDir,
          region: config?.region,
          environment: config?.environment,
          customDomain: config?.customDomain,
        });

        if (result.success && result.url) {
          setDeploymentUrl(result.url);
          setLogs(result.logs || []);
          onSuccess?.(result.url);
        } else {
          const errorMsg = result.error || "Deployment failed";
          setError(errorMsg);
          setLogs(result.logs || []);
          onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = (err as Error).message;
        setError(errorMsg);
        onError?.(errorMsg);
        throw err;
      } finally {
        setIsDeploying(false);
      }
    },
    [appId, buildId, deployMutation, onSuccess, onError]
  );

  const getStatus = useCallback(
    async (deploymentId: string) => {
      try {
        return await queryClient.fetchQuery(
          trpcAny.deployments.getStatus.queryOptions({ deploymentId })
        );
      } catch (err) {
        console.error("Failed to get deployment status:", err);
        throw err;
      }
    },
    [queryClient, trpcAny]
  );

  const rollback = useCallback(
    async (deploymentId: string) => {
      try {
        const result: any = await (rollbackMutation as any).mutateAsync({
          deploymentId,
        });
        return result;
      } catch (err) {
        console.error("Failed to rollback deployment:", err);
        throw err;
      }
    },
    [rollbackMutation]
  );

  return {
    isDeploying,
    error,
    deploymentUrl,
    logs,
    deploy,
    getStatus,
    rollback,
  };
}

/**
 * Hook for fetching available deployment providers
 */
export function useDeploymentProviders() {
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const [providers, setProviders] = useState<any[]>([]);
  const { data, isLoading } = useQuery(
    trpcAny.deployments.listDeploymentProviders.queryOptions() as any
  ) as { data: any; isLoading: boolean };

  // Update providers when data changes
  useEffect(() => {
    if (data?.providers) setProviders(data.providers);
  }, [data]);

  return {
    providers,
    isLoading,
    fetchProviders: () => {}, // No-op, data is fetched automatically
  };
}
