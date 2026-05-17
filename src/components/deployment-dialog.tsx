// src/components/deployment-dialog.tsx
// One-click deployment UI component

"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface DeploymentDialogProps {
  appId: string;
  buildId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeploySuccess?: (url: string) => void;
}

export const DeploymentDialog: React.FC<DeploymentDialogProps> = ({
  appId,
  buildId,
  isOpen,
  onOpenChange,
  onDeploySuccess,
}) => {
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const [region, setRegion] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [sourceDir, setSourceDir] = useState(".");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const deployMutation = useMutation(trpcAny.deployments.deploy.mutationOptions() as any);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const result: any = await (deployMutation as any).mutateAsync({
        appId,
        buildId,
        provider: "vercel",
        sourceDir: sourceDir || ".",
        region: region || undefined,
        customDomain: customDomain || undefined,
      });

      setDeploymentResult(result);

      if (result.success && result.url) {
        onDeploySuccess?.(result.url);
      }
    } catch (error) {
      setDeploymentResult({
        success: false,
        error: (error as Error).message,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const resetForm = () => {
    setDeploymentResult(null);
    setRegion("");
    setCustomDomain("");
    setSourceDir(".");
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "flex" : "hidden"} items-center justify-center bg-black/50`}>
      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">One-Click Deployment</h2>
          <p className="text-sm text-gray-600">Deploy your app to production with a single click</p>
        </div>

        <div className="p-6 space-y-4">
          {!deploymentResult ? (
            <>
              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Deployment Provider</label>
                <Input value="Vercel" disabled />
              </div>

              {/* Source Directory */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Directory</label>
                <Input
                  placeholder="."
                  value={sourceDir}
                  onChange={(e) => setSourceDir(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Uses server-side VERCEL_TOKEN. Default is workspace root.
                </p>
              </div>

              {/* Region */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Region (Optional)</label>
                <Input
                  placeholder="e.g., us-east-1, eu-west-1"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>

              {/* Custom Domain */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Domain (Optional)</label>
                <Input
                  placeholder="e.g., myapp.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
              </div>

              {/* Deploy Button */}
              <Button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="w-full"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  "Deploy Now"
                )}
              </Button>
            </>
          ) : (
            // Deployment Result
            <div className="space-y-3">
              {deploymentResult.success ? (
                <>
                  <Card className="p-4 border-green-200 bg-green-50">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900">Deployment Successful!</p>
                        <p className="text-sm text-green-700 mt-1">
                          Your app is now live and accessible.
                        </p>
                      </div>
                    </div>
                  </Card>

                  {deploymentResult.url && (
                    <Card className="p-3 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-1">Live URL:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm flex-1 truncate">{deploymentResult.url}</code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(deploymentResult.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  )}

                  {deploymentResult.logs.length > 0 && (
                    <Card className="p-3 bg-gray-50">
                      <p className="text-xs font-medium text-gray-700 mb-2">Deployment Logs:</p>
                      <div className="text-xs font-mono text-gray-600 max-h-40 overflow-auto">
                        {deploymentResult.logs.map((log: string, i: number) => (
                          <div key={i}>{log}</div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900">Deployment Failed</p>
                        <p className="text-sm text-red-700 mt-1">{deploymentResult.error}</p>
                      </div>
                    </div>
                  </Card>

                  <Button variant="outline" onClick={resetForm} className="w-full">
                    Try Again
                  </Button>
                </>
              )}

              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          {deploymentResult && (
            <Button variant="outline" onClick={resetForm} className="flex-1">
              Try Again
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DeploymentDialog;
