'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuildStatusCard } from '@/components/ui/build-status';
import { DeploymentStatusCard } from '@/components/ui/deployment-status';
import { VersionHistory } from '@/components/ui/version-history';
import {
  ArrowLeft,
  Code,
  Zap,
  Rocket,
  Clock,
  Download,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const trpcUnavailable =
    !trpcAny?.projects?.getOne ||
    !trpcAny?.messages?.getMany ||
    !trpcAny?.projects?.deleteProject;
  const queryClient = useQueryClient();
  const projectId = useMemo(() => {
    const id = params?.id;
    if (Array.isArray(id)) return id[0] ?? '';
    return id ?? '';
  }, [params?.id]);

  const projectQuery = useQuery(
    projectId && !trpcUnavailable
      ? trpcAny.projects.getOne.queryOptions({ id: projectId })
      : {
          queryKey: ['projects.getOne', { id: '' }],
          queryFn: async () => null,
          enabled: false,
        }
  );

  const messagesQuery = useQuery(
    projectId && !trpcUnavailable
      ? trpcAny.messages.getMany.queryOptions({ projectId })
      : {
          queryKey: ['messages.getMany', { projectId: '' }],
          queryFn: async () => [],
          enabled: false,
        }
  );

  const historyQuery = useQuery({
    queryKey: ['project-history', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/history`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to load project history');
      }
      return data.data as {
        snapshots: any[];
        buildHistory: any[];
        deployments: any[];
      };
    },
  });

  const deleteProjectMutation = useMutation({
    ...(trpcUnavailable
      ? {
          mutationFn: async () => {
            throw new Error('Projects procedures are unavailable in current tRPC context.');
          },
        }
      : trpcAny.projects.deleteProject.mutationOptions()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowDeleteDialog(false);
      router.push('/dashboard');
    },
  });

  const deployMutation = useMutation({
    mutationFn: async (provider: 'vercel' | 'railway' | 'fly' | 'netlify') => {
      const res = await fetch(`/api/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Deployment failed');
      }
      return data;
    },
    onSuccess: async () => {
      await historyQuery.refetch();
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (targetVersion: number) => {
      const res = await fetch(`/api/projects/${projectId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Rollback failed');
      }
      return data;
    },
    onSuccess: async () => {
      await Promise.all([historyQuery.refetch(), projectQuery.refetch()]);
    },
  });

  const project = projectQuery.data as any;
  const historyData = historyQuery.data;
  const latestBuild = historyData?.buildHistory?.[0];
  const deployments = (historyData?.deployments ?? []).map((d: any) => ({
    id: d.id,
    provider: d.provider,
    status:
      d.status === 'pending'
        ? ('pending' as const)
        : d.status === 'success'
          ? ('success' as const)
          : ('failed' as const),
    deployedAt: new Date(d.deployedAt),
    deploymentUrl: d.deploymentUrl || undefined,
    duration: d.duration || undefined,
    error: d.error || undefined,
  }));

  const versions = (historyData?.snapshots ?? []).map((s: any) => ({
    version: s.version,
    timestamp: new Date(s.timestamp),
    description: s.description || undefined,
    buildSuccess: Boolean(s.buildSuccess),
    errorCount: s.errorCount || 0,
  }));

  const buildStatus = {
    status: latestBuild
      ? (latestBuild.success ? ('success' as const) : ('failed' as const))
      : ('idle' as const),
    buildTime: latestBuild?.buildTime || undefined,
    routesGenerated: latestBuild?.routesGenerated || undefined,
    errorCount: Array.isArray(latestBuild?.errors) ? latestBuild.errors.length : 0,
    warnings: Array.isArray(latestBuild?.warnings) ? latestBuild.warnings.length : 0,
    lastBuild: latestBuild?.timestamp ? new Date(latestBuild.timestamp) : undefined,
    buildLog: latestBuild?.buildLog || undefined,
  };

  const latestFragment = [...((messagesQuery.data as any[]) ?? [])]
    .reverse()
    .find((m: any) => m?.fragment?.files);
  const latestFiles = (latestFragment?.fragment?.files || {}) as Record<string, string>;
  const preferredPath =
    (latestFiles['app/page.tsx'] && 'app/page.tsx') ||
    (latestFiles['src/app/page.tsx'] && 'src/app/page.tsx') ||
    Object.keys(latestFiles)[0] ||
    null;
  const displayedCode = preferredPath ? latestFiles[preferredPath] : null;

  if (!projectId) {
    return <div className="p-8">Invalid project id.</div>;
  }

  if (projectQuery.isLoading) {
    return <div className="p-8">Loading project...</div>;
  }

  if (projectQuery.isError || !project) {
    return <div className="p-8">Project not found.</div>;
  }

  const handleExport = async () => {
    const res = await fetch(`/api/projects/${projectId}/export`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to export project');
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-slate-600">{project.description || 'No description'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="gap-2" onClick={() => deployMutation.mutate('vercel')} disabled={deployMutation.isPending}>
              <Rocket className="w-4 h-4" />
              {deployMutation.isPending ? 'Deploying...' : 'Deploy'}
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              Delete Project
            </Button>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-[90vw] border flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-2 text-foreground">Delete Project</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() =>
                  deleteProjectMutation.mutate({ id: projectId } as any)
                }
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-5 py-2 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80 transition-colors"
                disabled={deleteProjectMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Zap className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="w-4 h-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent
            value="overview"
            className="space-y-6 mt-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BuildStatusCard
                status={buildStatus}
                onBuild={() => router.push(`/projects/${projectId}`)}
                onRetry={() => router.push(`/projects/${projectId}`)}
              />
              <DeploymentStatusCard
                deployments={deployments}
                onDeploy={(provider) =>
                  deployMutation.mutate(provider)
                }
              />
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="mt-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Generated Code</h2>
                <Button variant="outline" size="sm">
                  View in Editor
                </Button>
              </div>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-auto max-h-96">
                {displayedCode ? (
                  <pre>{displayedCode}</pre>
                ) : (
                  <pre>{'No generated code found for this project yet.'}</pre>
                )}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <VersionHistory
              versions={versions}
              currentVersion={project.currentVersion || 1}
              onRollback={(version) =>
                rollbackMutation.mutate(version)
              }
              onViewDiff={(from, to) =>
                console.log('Diff', from, to)
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
