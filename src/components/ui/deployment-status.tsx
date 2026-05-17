'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle,
  Loader,
  Copy,
} from 'lucide-react';

export interface DeploymentStatus {
  id: string;
  provider: 'vercel' | 'railway' | 'fly' | 'netlify';
  status: 'pending' | 'success' | 'failed';
  deployedAt: Date;
  deploymentUrl?: string;
  duration?: number;
  error?: string;
}

export interface DeploymentStatusProps {
  deployments: DeploymentStatus[];
  isDeploying?: boolean;
  onDeploy?: (provider: 'vercel' | 'railway' | 'fly' | 'netlify') => void;
}

export function DeploymentStatusCard({
  deployments,
  isDeploying,
  onDeploy,
}: DeploymentStatusProps) {
  const latestDeployment = deployments[deployments.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Status</CardTitle>
        <CardDescription>
          {deployments.length} deployment{deployments.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        {latestDeployment && (
          <div className="p-3 rounded-lg bg-slate-50 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {latestDeployment.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : latestDeployment.status === 'pending' ? (
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-semibold text-sm">
                    {latestDeployment.provider.toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-600">
                    {latestDeployment.status === 'success'
                      ? `Live • ${latestDeployment.duration}s`
                      : latestDeployment.status === 'pending'
                        ? 'Deploying...'
                        : 'Failed'}
                  </div>
                </div>
              </div>
              {latestDeployment.deploymentUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      latestDeployment.deploymentUrl || '',
                    );
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>

            {latestDeployment.deploymentUrl && (
              <div className="mt-2 text-xs text-blue-600 truncate">
                {latestDeployment.deploymentUrl}
              </div>
            )}

            {latestDeployment.error && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                {latestDeployment.error}
              </div>
            )}
          </div>
        )}

        {/* Deploy Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {(['vercel', 'railway', 'fly', 'netlify'] as const).map(
            (provider) => (
              <Button
                key={provider}
                variant="outline"
                size="sm"
                onClick={() => onDeploy?.(provider)}
                disabled={isDeploying}
                className="capitalize"
              >
                {isDeploying ? (
                  <>
                    <Loader className="w-3 h-3 mr-1 animate-spin" />
                    {provider}
                  </>
                ) : (
                  provider
                )}
              </Button>
            ),
          )}
        </div>

        {/* Deployment History */}
        {deployments.length > 1 && (
          <div className="pt-2 border-t">
            <div className="text-sm font-semibold mb-2">Recent Deployments</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {deployments.slice(-5).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-xs text-slate-600 p-1"
                >
                  <span>
                    {d.provider.toUpperCase()}{' '}
                    {d.status === 'success' ? '✓' : '✗'}
                  </span>
                  <span>{new Date(d.deployedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
