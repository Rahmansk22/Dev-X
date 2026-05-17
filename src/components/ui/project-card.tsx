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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  MoreVertical,
  Rocket,
} from 'lucide-react';

export interface ProjectCardProps {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  currentVersion: number;
  stats: {
    totalVersions: number;
    successfulBuilds: number;
    failedBuilds: number;
    totalEdits: number;
  };
  latestDeployment?: {
    deploymentUrl: string;
    provider: string;
    status: string;
    deployedAt: Date;
  };
  onSelect?: (projectId: string) => void;
  onDeploy?: (projectId: string) => void;
  onExport?: (projectId: string) => void;
}

export function ProjectCard({
  id,
  name,
  description,
  status: _status,
  createdAt,
  updatedAt,
  currentVersion,
  stats,
  latestDeployment,
  onSelect,
  onDeploy,
  onExport,
}: ProjectCardProps) {
  const buildSuccessRate =
    stats.totalVersions > 0
      ? Math.round((stats.successfulBuilds / stats.totalVersions) * 100)
      : 0;

  const isDeployed = latestDeployment?.status === 'success';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader
        onClick={() => onSelect?.(id)}
        className="pb-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport?.(id)}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeploy?.(id)}>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Deployment Status */}
        {latestDeployment && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
            <span className="text-sm font-medium">Deployment:</span>
            <div className="flex items-center gap-2">
              {isDeployed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-xs text-slate-600">
                {latestDeployment.provider}
              </span>
            </div>
          </div>
        )}

        {/* Build Success Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Build Success:</span>
          <div className="flex items-center gap-2">
            {buildSuccessRate >= 80 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : buildSuccessRate >= 50 ? (
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs border border-slate-300 rounded-full px-2 py-1">{buildSuccessRate}%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <div className="text-center">
            <div className="text-lg font-bold">{currentVersion}</div>
            <div className="text-xs text-slate-500">Version</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{stats.totalEdits}</div>
            <div className="text-xs text-slate-500">Edits</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{stats.successfulBuilds}</div>
            <div className="text-xs text-slate-500">Success</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{stats.failedBuilds}</div>
            <div className="text-xs text-slate-500">Failed</div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Created {format(new Date(createdAt), 'MMM d, yyyy')}</span>
          <span>Updated {format(new Date(updatedAt), 'MMM d, yyyy')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
