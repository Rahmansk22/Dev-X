'use client';

import React, { useState, useEffect } from 'react';
import { ProjectCard, ProjectCardProps } from '@/components/ui/project-card';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function DashboardPage() {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: 'pro' }) ?? false;
  const [projects, setProjects] = useState<ProjectCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setFormData({ name: '', description: '' });
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExport = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
      });
      const data = await res.json();
      // Trigger download
      const element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)),
      );
      element.setAttribute('download', `${projectId}.json`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Failed to export project:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/projects/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          fetchProjects();
        }
      } catch (error) {
        console.error('Failed to import project:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Projects</h1>
            <p className="text-slate-600 mt-2">
              Manage your generated applications
            </p>
            <p className="text-xs mt-2 font-semibold uppercase tracking-wider text-slate-500">
              Current plan: {hasProAccess ? 'Pro' : 'Free'}
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/pricing">
                {hasProAccess ? 'Manage Billing' : 'Upgrade Plan'}
              </Link>
            </Button>

            {/* Import */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  input?.click();
                }}
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </label>

            {/* Create Project Dialog */}
            <div className="relative inline-block">
              <Button 
                className="gap-2"
                onClick={() => {
                  const dialog = document.getElementById('create-dialog');
                  if (dialog) dialog.style.display = 'block';
                }}
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
              <div
                id="create-dialog"
                className="fixed inset-0 bg-black/50 items-center justify-center z-50 hidden"
                style={{ display: 'none' }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    (e.target as HTMLElement).style.display = 'none';
                  }
                }}
              >
                <div className="bg-white rounded-lg p-6 max-w-md w-full flex flex-col">
                  <h2 className="text-lg font-bold mb-2">Create New Project</h2>
                  <p className="text-sm text-slate-600 mb-4">
                    Start by naming your new AI-generated application
                  </p>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Project name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFormData({ name: '', description: '' });
                          (document.getElementById('create-dialog') as HTMLElement).style.display = 'none';
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateProject}
                        disabled={isCreating || !formData.name.trim()}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">No projects yet</p>
            <p className="text-slate-500 text-sm">
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                {...project}
                onSelect={(id) => {
                  // Navigate to project detail
                  window.location.href = `/dashboard/projects/${id}`;
                }}
                onDeploy={(id) => {
                  // Trigger deploy
                  console.log('Deploy', id);
                }}
                onExport={(id) => handleExport(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
