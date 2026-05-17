'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertCircle,
  Copy,
  Undo2,
} from 'lucide-react';

export interface VersionSnapshot {
  version: number;
  timestamp: Date;
  description?: string;
  buildSuccess: boolean;
  errorCount?: number;
}

export interface VersionHistoryProps {
  versions: VersionSnapshot[];
  currentVersion: number;
  onRollback?: (targetVersion: number) => void;
  onViewDiff?: (fromVersion: number, toVersion: number) => void;
}

export function VersionHistory({
  versions,
  currentVersion,
  onRollback,
  onViewDiff,
}: VersionHistoryProps) {
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version History</CardTitle>
        <CardDescription>
          {sortedVersions.length} versions • Current: V{currentVersion}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {sortedVersions.map((version) => (
            <div
              key={version.version}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition"
            >
              {/* Status Icon */}
              <div className="shrink-0">
                {version.buildSuccess ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>

              {/* Version Info */}
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  Version {version.version}
                  {version.version === currentVersion && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {format(new Date(version.timestamp), 'MMM d, yyyy HH:mm')}
                  {version.description && ` • ${version.description}`}
                </div>
              </div>

              {/* Errors Badge */}
              {!version.buildSuccess && version.errorCount && (
                <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  {version.errorCount} errors
                </div>
              )}

              {/* Actions */}
              <div className="shrink-0 flex gap-1">
                {version.version !== currentVersion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRollback?.(version.version)}
                    title="Rollback to this version"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                )}
                {version.version < currentVersion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onViewDiff?.(version.version, currentVersion)
                    }
                    title="View differences"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
