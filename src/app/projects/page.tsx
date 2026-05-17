"use client";

import { useTRPC } from "@/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MoreVertical, 
  Edit, 
  Trash2,
  FolderOpen,
  Clock,
  Layers,
  ChevronRight,
  ArrowLeft,
  Crown
} from "lucide-react";

export default function ProjectsPage() {
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const trpcUnavailable = !trpcAny?.projects?.getMany || !trpcAny?.projects?.deleteProject;
  
  const { data: projectsRaw, isLoading } = useQuery(
    trpcUnavailable
      ? {
          queryKey: ["projects", "disabled"],
          queryFn: async () => [],
          enabled: false,
        }
      : trpcAny.projects.getMany.queryOptions()
  );
  
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const { user } = useUser();
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" }) ?? false;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);

  const deleteProjectMutation = useMutation(
    trpcUnavailable
      ? {
          mutationFn: async (_: { id: string }) => {
            throw new Error("tRPC context is unavailable.");
          },
        }
      : ({
          ...trpcAny.projects.deleteProject.mutationOptions(),
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["projects"] });
            await queryClient.refetchQueries({ queryKey: ["projects"] });
            setActiveDropdown(null);
            setShowDeleteDialog(false);
            setSelectedProject(null);
          },
        } as any)
  );

  const handleDeleteClick = (projectId: string, projectName: string) => {
    setSelectedProject({ id: projectId, name: projectName });
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedProject) {
      await deleteProjectMutation.mutateAsync({ id: selectedProject.id });
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setSelectedProject(null);
  };

  if (!user) return null;

  return (
    <div className="w-full min-h-screen bg-black">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 backdrop-blur-md">
              <div className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                All Projects
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                Your Creations
              </h2>
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <Layers className="size-4" />
                <span>{projects.length} Total Workspaces</span>
                <span className="text-gray-800">•</span>
                <span className="text-blue-400/80 font-mono text-sm">e2b-sandbox-v4</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/pricing')}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400 font-semibold transition-all hover:bg-amber-500/10 hover:border-amber-500/30"
            >
              <Crown className="size-4" />
              {hasProAccess ? "Manage Billing" : "Upgrade Plan"}
            </button>
            <button
              onClick={() => router.push('/')}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold transition-all hover:bg-white/10 hover:border-white/20"
            >
              <ArrowLeft className="size-4" />
              Back Home
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#050505]/50 backdrop-blur-xl p-20 text-center">
            <div className="relative z-10 flex flex-col items-center">
              <h3 className="text-3xl font-extrabold text-white mb-2">No Projects</h3>
              <p className="text-blue-300 text-lg max-w-md">
                Start creating your projects from the home page.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: { id: string; name: string; createdAt: string }, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                {/* Card Container */}
                <div
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="relative z-10 h-full p-6 rounded-4xl bg-linear-to-b from-white/3 to-transparent hover:from-blue-500/5 hover:to-blue-500/1 border border-white/5 backdrop-blur-3xl transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] cursor-pointer group"
                >
                  {/* Header: Title and Options */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-white/3 border border-white/5 group-hover:border-blue-500/20 group-hover:bg-blue-500/5 transition-colors">
                      <FolderOpen className="size-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === project.id ? null : project.id);
                        }}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-600 hover:text-white transition-colors"
                      >
                        <MoreVertical className="size-5" />
                      </button>

                      {activeDropdown === project.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // handleEdit
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                          >
                            <Edit className="size-4" />
                            Rename
                          </button>
                          <div className="h-px mx-2 my-1 bg-white/5" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(project.id, project.name);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body: Name and Description */}
                  <div className="space-y-2 mb-8">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 font-light">
                      Next.js application architected via autonomous inference. Optimized for performance and scale.
                    </p>
                  </div>

                  {/* Footer: Meta Info */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="size-3.5" />
                      <span>
                        {formatDistanceToNow(new Date(project.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Sync Active</span>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && selectedProject && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md p-8 rounded-[2.5rem] bg-[#050505] border border-white/10 shadow-2xl text-center"
          >
            <div className="size-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Trash2 className="size-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Delete Project?</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-semibold underline decoration-red-500/50">{selectedProject.name}</span>? This action is irreversible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/20"
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? "Executing..." : "Confirm Delete"}
              </button>
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition-all"
                disabled={deleteProjectMutation.isPending}
              >
                Abort
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
