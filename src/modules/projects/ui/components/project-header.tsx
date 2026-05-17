"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ExternalLink, Share2, MoreHorizontal, CrownIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useTRPC } from "@/trpc/client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Fragment } from "@prisma/client";

interface Props {
  projectId: string;
  activeFragment: Fragment | null;
}

interface Project {
  name: string;
}

export const ProjectHeader = ({
  projectId,
  activeFragment
}: Props) => {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" }) ?? false;
  const [mounted, setMounted] = useState(false);

  const trpc = useTRPC();
  const trpcAny = trpc as any;

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: project } = useQuery<Project>(
    trpcAny.projects.getOne.queryOptions({ id: projectId })
  );

  if (!mounted) {
    return <header className="h-14.25 bg-[#0a0a0a]" />;
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between px-4 py-2.5 sticky top-0 z-50 min-h-0 w-full"
      style={{
        backgroundColor: '#0a0a0a',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* 1. LEFT: Project Info */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#111] border border-white/10 shadow-[0_0_16px_rgba(59,130,246,0.1)]"
          >
            <Image src="/logo.svg" alt="Dev X" width={18} height={18} />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#22c55e] border-[1.5px] border-[#0a0a0a] shadow-[0_0_6px_#22c55e]" />
        </div>

        <div className="hidden sm:flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#f0f0f0] truncate max-w-30">
              {project?.name ?? "Project"}
            </span>
            <div className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/15">
              Live
            </div>
          </div>
          <Link href="/" className="flex items-center text-[10px] gap-1 text-[#64748b] hover:text-blue-300 transition-colors">
            <ChevronLeftIcon size={10} /> Dashboard
          </Link>
        </div>
      </div>

      <div className="flex-1" />

      {/* 2. RIGHT: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href="/pricing"
          className="h-8 px-3 rounded-xl inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide border transition-all text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
        >
          <CrownIcon size={12} fill="currentColor" />
          {hasProAccess ? "Manage" : "Upgrade"}
        </Link>

        <div className="flex items-center gap-1">
          {[Share2, MoreHorizontal].map((Icon, i) => (
            <button key={i} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 transition-all">
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>
    </motion.header>
  );
};
