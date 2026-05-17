'use client';

import React, { useState } from 'react';
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
  RotateCw,
  FileJson,
} from 'lucide-react';

export interface BuildStatus {
  status: 'idle' | 'building' | 'success' | 'failed';
  buildTime?: number;
  routesGenerated?: number;
  errorCount?: number;
  warnings?: number;
  lastBuild?: Date;
  buildLog?: string;
}

export interface BuildStatusProps {
  status: BuildStatus;
  onBuild?: () => void;
  onRetry?: () => void;
  onExport?: () => void;
}

export function BuildStatusCard({
  status,
  onBuild,
  onRetry,
  onExport,
}: BuildStatusProps) {
  const [showLog, setShowLog] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Status</CardTitle>
        <CardDescription>
          {status.lastBuild
            ? `Last build: ${new Date(status.lastBuild).toLocaleString()}`
            : 'No builds yet'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
          <div className="flex items-center gap-2">
            {status.status === 'building' && (
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            )}
            {status.status === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {status.status === 'failed' && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <div className="font-semibold capitalize">{status.status}</div>
              {status.status === 'building' && (
                <div className="text-xs text-slate-600">Compiling...</div>
              )}
            </div>
          </div>

          {status.buildTime && status.status === 'success' && (
            <div className="text-sm text-slate-600">{status.buildTime}s</div>
          )}
        </div>

        {/* Metrics */}
        {status.status === 'success' && (
          <div className="grid grid-cols-3 gap-2">
            {status.routesGenerated && (
              <div className="text-center p-2 rounded-lg bg-blue-50">
                <div className="font-bold text-blue-900">
                  {status.routesGenerated}
                </div>
                <div className="text-xs text-blue-700">Routes</div>
              </div>
            )}
            {status.errorCount !== undefined && (
              <div className="text-center p-2 rounded-lg bg-red-50">
                <div className="font-bold text-red-900">{status.errorCount}</div>
                <div className="text-xs text-red-700">Errors</div>
              </div>
            )}
            {status.warnings !== undefined && (
              <div className="text-center p-2 rounded-lg bg-yellow-50">
                <div className="font-bold text-yellow-900">
                  {status.warnings}
                </div>
                <div className="text-xs text-yellow-700">Warnings</div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {status.status === 'failed' && (
          <div className="p-2 rounded-lg bg-red-50 border border-red-200">
            <div className="text-sm text-red-700 font-medium">Build Failed</div>
            <div className="text-xs text-red-600 mt-1">
              {status.errorCount} error{status.errorCount !== 1 ? 's' : ''} detected
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {status.status === 'idle' || status.status === 'success' ? (
            <Button onClick={onBuild} className="flex-1">
              Build
            </Button>
          ) : status.status === 'building' ? (
            <Button disabled className="flex-1">
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Building...
            </Button>
          ) : (
            <Button
              onClick={onRetry}
              variant="destructive"
              className="flex-1"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}

          {status.status === 'success' && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowLog(!showLog)}
              >
                Log
              </Button>
              <Button
                variant="outline"
                onClick={onExport}
              >
                <FileJson className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Build Log */}
        {showLog && status.buildLog && (
          <div className="p-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-auto max-h-48">
            {status.buildLog}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
