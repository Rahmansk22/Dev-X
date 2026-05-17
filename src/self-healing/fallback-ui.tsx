// src/self-healing/fallback-ui.tsx
// React component for displaying fallback UI when builds fail

"use client";

import React from "react";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface FallbackUIProps {
  appId: string;
  userId: string;
  error: string;
  onRetry: () => void;
  isRetrying?: boolean;
  isDarkMode?: boolean;
}

export const FallbackUI: React.FC<FallbackUIProps> = ({
  appId,
  userId,
  error,
  onRetry,
  isRetrying = false,
  isDarkMode = false,
}) => {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-6 p-6 ${
        isDarkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900"
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="rounded-full bg-red-100 p-3">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">Build Failed</h2>
          <p className="text-sm text-gray-600 mt-1">
            We encountered an error while building your app
          </p>
        </div>

        <Card className={`w-full p-4 ${isDarkMode ? "bg-slate-800" : "bg-gray-50"}`}>
          <p className="text-xs font-mono text-left overflow-auto max-h-32">
            {error}
          </p>
        </Card>

        <div className="flex gap-3 w-full">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex-1 gap-2"
            variant="default"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Retry Build
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              // Navigate to project details or support
              window.location.href = `/projects/${appId}`;
            }}
          >
            <ExternalLink className="h-4 w-4" />
            View Details
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          App ID: {appId} | User ID: {userId}
        </p>
      </div>
    </div>
  );
};

export default FallbackUI;
