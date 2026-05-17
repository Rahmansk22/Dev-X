// src/components/build-monitor.tsx
// React component for monitoring builds with self-healing UI

"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { FallbackUI } from "@/self-healing/fallback-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";

interface BuildMonitorProps {
  appId: string;
  code: string;
  onBuildSuccess?: () => void;
  onBuildError?: (error: string) => void;
}

export const BuildMonitor: React.FC<BuildMonitorProps> = ({
  appId,
  code,
  onBuildSuccess,
  onBuildError,
}) => {
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const trpcUnavailable = !trpcAny?.builds?.triggerBuild || !trpcAny?.builds?.retryBuild;
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [buildSuccess, setBuildSuccess] = useState(false);
  const [detectedErrors, setDetectedErrors] = useState<any[]>([]);

  const triggerBuildMutation = useMutation(
    trpcUnavailable
      ? {
          mutationFn: async () => {
            throw new Error('Build procedures are unavailable in current tRPC context.');
          },
        }
      : (trpcAny.builds.triggerBuild.mutationOptions() as any)
  );
  const retryBuildMutation = useMutation(
    trpcUnavailable
      ? {
          mutationFn: async () => {
            throw new Error('Build procedures are unavailable in current tRPC context.');
          },
        }
      : (trpcAny.builds.retryBuild.mutationOptions() as any)
  );

  const triggerBuild = async () => {
    setIsBuilding(true);
    setBuildError(null);
    setBuildSuccess(false);

    try {
      const result: any = await (triggerBuildMutation as any).mutateAsync({
        appId,
        code,
      });

      if (result.success) {
        setBuildSuccess(true);
        onBuildSuccess?.();
      } else {
        setBuildError(result.error || "Unknown build error");
        setDetectedErrors(result.detectedErrors || []);
        onBuildError?.(result.error || "Unknown build error");
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setBuildError(errorMessage);
      onBuildError?.(errorMessage);
    } finally {
      setIsBuilding(false);
    }
  };

  const retryBuild = async () => {
    setIsBuilding(true);
    setBuildError(null);
    setBuildSuccess(false);

    try {
      const result: any = await (retryBuildMutation as any).mutateAsync({
        appId,
        buildId: `build_${appId}`,
      });

      if (result.success) {
        setBuildSuccess(true);
        setDetectedErrors([]);
        onBuildSuccess?.();
      } else {
        setBuildError(result.error || "Build retry failed");
        onBuildError?.(result.error || "Build retry failed");
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setBuildError(errorMessage);
      onBuildError?.(errorMessage);
    } finally {
      setIsBuilding(false);
    }
  };

  // Show fallback UI if build failed
  if (buildError) {
    return (
      <div className="space-y-4">
        <FallbackUI
          appId={appId}
          userId="current_user"
          error={buildError}
          onRetry={retryBuild}
          isRetrying={isBuilding}
        />

        {/* Show detected error patterns */}
        {detectedErrors.length > 0 && (
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold text-sm">Detected Issues:</h3>
            <div className="space-y-1">
              {detectedErrors.map((error) => (
                <div
                  key={error.id}
                  className="text-xs p-2 bg-amber-50 rounded border border-amber-200"
                >
                  <p className="font-medium text-amber-900">{error.name}</p>
                  <p className="text-amber-800">{error.suggestedFix}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Show build success state
  if (buildSuccess) {
    return (
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Build Successful</p>
            <p className="text-sm text-green-700">Your app is ready to deploy</p>
          </div>
          <Button
            onClick={() => setBuildSuccess(false)}
            variant="ghost"
            size="sm"
            className="ml-auto"
          >
            Build Again
          </Button>
        </div>
      </Card>
    );
  }

  // Show build in progress state
  if (isBuilding) {
    return (
      <Card className="p-6 border-blue-200 bg-blue-50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          <div>
            <p className="font-semibold text-blue-900">Building App...</p>
            <p className="text-sm text-blue-700">Compiling and optimizing your code</p>
          </div>
        </div>
      </Card>
    );
  }

  // Show initial state with trigger button
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Ready to Build</p>
            <p className="text-sm text-gray-600">App ID: {appId}</p>
          </div>
          <Button onClick={triggerBuild} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Build Now
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BuildMonitor;
