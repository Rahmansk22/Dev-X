"use client";

import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Edit,
  Trash2,
  FolderOpen,
  Clock,
  Layers,
  ChevronRight,
  Activity,
  Zap,
  Shield,
  Layout,
  Check,
  X,
} from "lucide-react";

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectNodeCard = ({ project, index, onMenuOpen, router }: {
  project: any;
  index: number;
  onMenuOpen: (projectId: string, projectName: string, rect: DOMRect) => void;
  router: any;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -10 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative h-[380px] perspective-[1000px]"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onClick={() => router.push(`/projects/${project.id}`)}
        className="relative z-10 h-full p-8 rounded-[2.5rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 backdrop-blur-3xl transition-all duration-700 hover:border-blue-500/40 hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        {/* HUD */}
        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
          <Layout className="size-32" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between relative z-10" style={{ transform: "translateZ(30px)" }}>
          <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/50 transition-all shadow-xl">
            <FolderOpen className="size-6 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </div>
          {/* 3-dot menu — passes its screen rect up to the portal */}
          <button
            ref={menuBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              if (menuBtnRef.current) {
                onMenuOpen(project.id, project.name, menuBtnRef.current.getBoundingClientRect());
              }
            }}
            className="p-3 rounded-xl hover:bg-white/10 text-gray-600 hover:text-white transition-all"
          >
            <MoreVertical className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 relative z-10" style={{ transform: "translateZ(50px)" }}>
          <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1 italic uppercase tracking-tighter">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 font-medium">
            Next.js application architected via autonomous inference. Hardened global mesh deployment active.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Zap className="size-3 text-blue-400" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">V8-Ignite</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Shield className="size-3 text-emerald-400" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Hardened</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase tracking-widest italic">
            <Clock className="size-3.5" />
            <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">Mesh Stable</span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProjectsList() {
  const router = useRouter();
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const trpcUnavailable = !trpcAny?.projects?.getMany || !trpcAny?.projects?.deleteProject;

  const queryClient = useQueryClient();

  const { data: projectsRaw, isLoading } = useQuery(
    trpcUnavailable
      ? { queryKey: ["projects", "disabled"], queryFn: async () => [], enabled: false }
      : trpcAny.projects.getMany.queryOptions()
  );

  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];

  // ── Dropdown state ──
  const [activeMenu, setActiveMenu] = useState<{ id: string; name: string; rect: DOMRect } | null>(null);

  // ── Delete dialog state ──
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);

  // ── Rename dialog state ──
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameProject, setRenameProject] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Focus input when rename dialog opens
  useEffect(() => {
    if (showRenameDialog && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [showRenameDialog]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handler = (e: MouseEvent) => {
      const dropdown = document.getElementById("project-card-dropdown");
      if (dropdown && !dropdown.contains(e.target as Node)) setActiveMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeMenu]);

  // ── Delete mutation (optimistic) ──
  const deleteProjectMutation = useMutation(
    trpcUnavailable
      ? { mutationFn: async (_: { id: string }) => { throw new Error("tRPC unavailable"); } }
      : ({
        ...trpcAny.projects.deleteProject.mutationOptions(),
        // Optimistically remove the card immediately
        onMutate: async ({ id }: { id: string }) => {
          await queryClient.cancelQueries({ queryKey: trpcAny.projects.getMany.queryOptions().queryKey });
          const previous = queryClient.getQueryData(trpcAny.projects.getMany.queryOptions().queryKey);
          queryClient.setQueryData(
            trpcAny.projects.getMany.queryOptions().queryKey,
            (old: any[]) => (Array.isArray(old) ? old.filter((p: any) => p.id !== id) : old)
          );
          return { previous };
        },
        onError: (_err: any, _vars: any, context: any) => {
          // Roll back on failure
          if (context?.previous !== undefined) {
            queryClient.setQueryData(trpcAny.projects.getMany.queryOptions().queryKey, context.previous);
          }
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: trpcAny.projects.getMany.queryOptions().queryKey });
          setActiveMenu(null);
          setShowDeleteDialog(false);
          setSelectedProject(null);
        },
      } as any)
  );

  // ── Rename mutation ──
  const renameProjectMutation = useMutation(
    trpcUnavailable || !trpcAny?.projects?.updateProject
      ? { mutationFn: async (_: { id: string; name: string }) => { throw new Error("tRPC unavailable"); } }
      : ({
        ...trpcAny.projects.updateProject.mutationOptions(),
        // Optimistically update name immediately
        onMutate: async ({ id, name }: { id: string; name: string }) => {
          await queryClient.cancelQueries({ queryKey: trpcAny.projects.getMany.queryOptions().queryKey });
          const previous = queryClient.getQueryData(trpcAny.projects.getMany.queryOptions().queryKey);
          queryClient.setQueryData(
            trpcAny.projects.getMany.queryOptions().queryKey,
            (old: any[]) =>
              Array.isArray(old) ? old.map((p: any) => (p.id === id ? { ...p, name } : p)) : old
          );
          return { previous };
        },
        onError: (_err: any, _vars: any, context: any) => {
          if (context?.previous !== undefined) {
            queryClient.setQueryData(trpcAny.projects.getMany.queryOptions().queryKey, context.previous);
          }
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: trpcAny.projects.getMany.queryOptions().queryKey });
          setShowRenameDialog(false);
          setRenameProject(null);
          setRenameValue("");
        },
      } as any)
  );

  // ── Handlers ──
  const handleMenuOpen = (projectId: string, projectName: string, rect: DOMRect) => {
    if (activeMenu?.id === projectId) {
      setActiveMenu(null);
    } else {
      setActiveMenu({ id: projectId, name: projectName, rect });
    }
  };

  const handleRenameClick = (projectId: string, projectName: string) => {
    setRenameProject({ id: projectId, name: projectName });
    setRenameValue(projectName);
    setActiveMenu(null);
    setShowRenameDialog(true);
  };

  const handleConfirmRename = async () => {
    if (!renameProject || !renameValue.trim() || renameValue.trim() === renameProject.name) {
      setShowRenameDialog(false);
      return;
    }
    await renameProjectMutation.mutateAsync({ id: renameProject.id, name: renameValue.trim() });
  };

  const handleDeleteClick = (projectId: string, projectName: string) => {
    setSelectedProject({ id: projectId, name: projectName });
    setActiveMenu(null);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedProject) {
      await deleteProjectMutation.mutateAsync({ id: selectedProject.id });
    }
  };

  const displayedProjects = projects.slice(0, 6);
  const hasMoreProjects = projects.length > 6;

  if (isLoading) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-500/5 border border-blue-500/10 backdrop-blur-3xl"
          >
            <Activity className="size-4 text-blue-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Creation Engine</span>
          </motion.div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
              Your<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500"> Projects.</span>
            </h2>
            <div className="flex items-center gap-4 text-gray-500 font-bold uppercase tracking-[0.2em] text-[11px]">
              <Layers className="size-4 text-blue-500" />
              <span>{projects.length} Active Environments</span>
              <div className="size-1 rounded-full bg-gray-800" />
              <span className="text-emerald-500 italic">All Systems Operational</span>
            </div>
          </div>
        </div>

        {hasMoreProjects && (
          <button
            onClick={() => router.push("/projects")}
            className="group flex items-center gap-4 px-10 py-5 rounded-[2rem] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-[10px] italic transition-all hover:bg-white/10 hover:border-blue-500/50 shadow-2xl"
          >
            Explore Repository
            <ChevronRight className="size-4 group-hover:translate-x-2 transition-transform text-blue-500" />
          </button>
        )}
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative rounded-[4rem] border border-white/5 bg-[#050505]/50 backdrop-blur-3xl p-24 text-center overflow-hidden group shadow-2xl"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-12">
            <motion.div
              animate={{ rotateY: 360, rotateX: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="size-32 border-4 border-blue-500/30 rounded-3xl flex items-center justify-center relative shadow-[0_0_50px_rgba(59,130,246,0.3)]"
            >
              <Zap className="size-16 text-blue-500 animate-pulse" />
              <div className="absolute inset-0 border-2 border-white/10 rounded-3xl scale-125 rotate-45" />
            </motion.div>
            <div className="space-y-6">
              <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Zero Nodes Initialized.</h3>
              <p className="text-xl text-gray-500 max-w-xl mx-auto leading-relaxed italic font-medium">
                Your architectural journey begins with a single prompt. Synthesize your first node to activate the global mesh.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {displayedProjects.map((project: any, index: number) => (
              <ProjectNodeCard
                key={project.id}
                project={project}
                index={index}
                onMenuOpen={handleMenuOpen}
                router={router}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* ── Portal Dropdown Menu ── */}
      {activeMenu && typeof window !== "undefined" && createPortal(
        <div
          id="project-card-dropdown"
          style={{
            position: "fixed",
            top: activeMenu.rect.bottom + 8,
            left: activeMenu.rect.right - 224,
            zIndex: 9999,
            width: 224,
          }}
          className="py-2 rounded-2xl bg-[#0d0d0d] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-3xl"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
          <button
            onClick={() => handleRenameClick(activeMenu.id, activeMenu.name)}
            className="w-full px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-4 transition-all italic"
          >
            <Edit className="size-4" />
            Rename Protocol
          </button>
          <div className="h-px mx-3 my-1 bg-white/5" />
          <button
            onClick={() => handleDeleteClick(activeMenu.id, activeMenu.name)}
            className="w-full px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 flex items-center gap-4 transition-all italic"
          >
            <Trash2 className="size-4" />
            Terminate Node
          </button>
        </div>,
        document.body
      )}

      {/* ── Rename Dialog ── */}
      <AnimatePresence>
        {showRenameDialog && renameProject && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
              onClick={() => { setShowRenameDialog(false); setRenameValue(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md p-8 rounded-[2rem] bg-[#0a0a0a] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

              <div className="size-16 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <Edit className="size-8 text-blue-400" />
              </div>

              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter italic text-center">Rename Protocol</h2>
              <p className="text-sm text-gray-500 italic text-center mb-6">Reassign the node identity within the global mesh.</p>

              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmRename();
                  if (e.key === "Escape") { setShowRenameDialog(false); setRenameValue(""); }
                }}
                maxLength={100}
                placeholder="Enter new node name..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all mb-6"
              />

              <div className="flex gap-4">
                <button
                  onClick={handleConfirmRename}
                  disabled={renameProjectMutation.isPending || !renameValue.trim()}
                  className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl italic"
                >
                  <Check className="size-3" />
                  {renameProjectMutation.isPending ? "Saving..." : "Confirm"}
                </button>
                <button
                  onClick={() => { setShowRenameDialog(false); setRenameValue(""); }}
                  disabled={renameProjectMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all italic"
                >
                  <X className="size-3" />
                  Abort
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ── */}
      <AnimatePresence>
        {showDeleteDialog && selectedProject && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
              onClick={() => setShowDeleteDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md p-8 rounded-[2rem] bg-[#0a0a0a] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <div className="size-16 mx-auto mb-6 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                <Trash2 className="size-8 text-red-600" />
              </div>
              <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tighter italic">Terminate Node?</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to decouple <span className="text-white font-bold underline decoration-red-600/50">{selectedProject.name}</span> from the global mesh? This action is deterministic and irreversible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl italic"
                  disabled={deleteProjectMutation.isPending}
                >
                  {deleteProjectMutation.isPending ? "Terminating..." : "Confirm Termination"}
                </button>
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] border border-white/10 transition-all italic"
                  disabled={deleteProjectMutation.isPending}
                >
                  Abort
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProjectsList;
