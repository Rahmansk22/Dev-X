"use client";

import { Fragment, MessageType, MessageRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import confetti from "canvas-confetti";
import {
  ChevronRightIcon,
  Code2Icon,
  CopyIcon,
  CheckIcon,
  PlayIcon,
  CheckCircle2Icon,
  PackageIcon,
  Settings2Icon,
  LayoutIcon,
  FileCode2Icon,
  FileTextIcon,
  DatabaseIcon,
  GlobeIcon,
  ComponentIcon,
  TerminalIcon,
  HistoryIcon,
  CpuIcon,
  BinaryIcon,
  PaletteIcon,
  WrenchIcon,
  Loader2Icon,
  ShieldCheckIcon,
  LayersIcon,
  ExternalLinkIcon,
  RefreshCcwIcon,
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIconForFile(filePath: string) {
  const name = filePath.split("/").pop()?.toLowerCase() ?? "";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  const iconProps = { size: 14, className: "shrink-0" };

  if (name === "package.json") return <PackageIcon {...iconProps} className="text-amber-400" />;
  if (name.includes("tsconfig")) return <Settings2Icon {...iconProps} className="text-blue-400" />;
  if (name.includes("next.config")) return <LayoutIcon {...iconProps} className="text-white" />;
  if (name.includes("tailwind")) return <PaletteIcon {...iconProps} className="text-cyan-400" />;
  if (name.includes("postcss")) return <WrenchIcon {...iconProps} className="text-orange-400" />;
  if (name.includes("globals.css") || ext === "css") return <PaletteIcon {...iconProps} className="text-pink-400" />;
  if (name === "layout.tsx" || name === "layout.jsx") return <LayersIcon {...iconProps} className="text-indigo-400" />;
  if (name === "page.tsx" || name === "page.jsx") return <LayoutIcon {...iconProps} className="text-emerald-400" />;
  if (name.includes("component") || ext === "tsx" || ext === "jsx") return <ComponentIcon {...iconProps} className="text-sky-400" />;
  if (ext === "ts" || ext === "js") return <BinaryIcon {...iconProps} className="text-blue-500" />;
  if (ext === "json") return <FileCode2Icon {...iconProps} className="text-yellow-500" />;
  if (name.includes("readme") || name.includes(".md")) return <FileTextIcon {...iconProps} className="text-slate-400" />;
  if (name.includes(".env")) return <ShieldCheckIcon {...iconProps} className="text-emerald-500" />;
  if (filePath.startsWith("app/api/")) return <GlobeIcon {...iconProps} className="text-violet-400" />;
  if (filePath.startsWith("lib/")) return <DatabaseIcon {...iconProps} className="text-orange-300" />;
  if (filePath.startsWith("components/")) return <ComponentIcon {...iconProps} className="text-blue-300" />;
  if (filePath.startsWith("hooks/")) return <HistoryIcon {...iconProps} className="text-pink-300" />;

  return <FileCode2Icon {...iconProps} className="text-slate-500" />;
}

function getActionLabel(filePath: string): string {
  const name = filePath.split("/").pop()?.toLowerCase() ?? "";
  if (name === "package.json") return "Initializing workspace dependencies";
  if (name.includes("tsconfig")) return "Configuring TypeScript environment";
  if (name.includes("next.config")) return "Optimizing Next.js configuration";
  if (name.includes("tailwind")) return "Generating design tokens & Tailwind config";
  if (name.includes("postcss")) return "Processing CSS toolchain (PostCSS)";
  if (name.includes("globals.css")) return "Injecting global design system styles";
  if (name === "layout.tsx") return "Assembling root application layout";
  if (name === "page.tsx") return "Constructing primary viewport gateway";
  if (name.includes(".env")) return "Sourcing environment security variables";
  if (filePath.startsWith("app/api/")) return "Architecting serverless API endpoint";
  if (filePath.startsWith("components/")) return "Engineering reusable UI component";
  if (filePath.startsWith("lib/")) return "Developing core utility logic";
  if (filePath.startsWith("hooks/")) return "Composing functional React hooks";
  return "Compiling source file";
}

// ─── User Message ─────────────────────────────────────────────────────────────

interface UserMessageProps {
  content: string;
  createdAt: Date;
}

const UserMessage = ({ content, createdAt }: UserMessageProps) => (
  <div className="flex justify-end pb-8 px-4">
    <div className="flex flex-col items-end max-w-[85%] gap-2">
      <div className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase tabular-nums">
        {formatDistanceToNow(createdAt, { addSuffix: true })}
      </div>
      <div
        className="px-5 py-4 rounded-3xl rounded-br-none text-white text-[15px] font-medium leading-relaxed tracking-tight"
        style={{
          background: "linear-gradient(165deg, #2563eb, #1e40af)",
          boxShadow: "0 8px 32px -8px rgba(37,99,235,0.4)",
        }}
      >
        {content}
      </div>
    </div>
  </div>
);

// ─── Fragment Card ─────────────────────────────────────────────────────────────

interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}

const FragmentCard = ({ fragment, isActiveFragment, onFragmentClick }: FragmentCardProps) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    onClick={() => onFragmentClick(fragment)}
    className={cn(
      "group relative overflow-hidden flex items-center justify-between p-5 rounded-[2rem] border w-full transition-all duration-500 text-left mt-6",
      isActiveFragment
        ? "border-blue-500/30 bg-blue-500/[0.08] shadow-[0_0_40px_rgba(59,130,246,0.1)]"
        : "border-white/5 bg-white/[0.02] hover:border-blue-500/20 hover:bg-blue-500/[0.04]"
    )}
  >
    <div className="flex items-center gap-4 relative z-10">
      <div className={cn(
        "p-3.5 rounded-2xl border transition-colors duration-500",
        isActiveFragment
          ? "bg-blue-500/20 border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
          : "bg-white/5 border-white/8 text-gray-500 group-hover:text-blue-400"
      )}>
        <TerminalIcon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-bold text-[15px] text-white tracking-tight">
          {fragment.title || "Production Build"}
        </span>
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
          <PlayIcon size={10} className="fill-current" />
          <span>Deploy Interactive Interface</span>
        </div>
      </div>
    </div>
    <ChevronRightIcon
      size={20}
      className={cn(
        "transition-all duration-500 relative z-10",
        isActiveFragment ? "text-blue-400" : "text-gray-700 group-hover:text-blue-400 group-hover:translate-x-1"
      )}
    />

    {/* Decorative blur */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] pointer-events-none" />
  </motion.button>
);

// ─── Emergent Chat Activity ───────────────────────────────────────────────────

interface EmergentActivityProps {
  fileActions: any[];
  isGenerating: boolean;
  onFileClick?: (path: string) => void;
}

const INIT_STEPS = [
  { icon: CpuIcon, text: "Logic Synthesis & Requirements Analysis", color: "text-blue-400" },
  { icon: LayersIcon, text: "Structural Architecture Mapping", color: "text-indigo-400" },
  { icon: GlobeIcon, text: "Environment Virtualization (Sandbox Build)", color: "text-emerald-400" },
];

const LoadingPulse = () => (
  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1 h-1 rounded-full bg-blue-400"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
    <span className="text-[9px] font-black uppercase text-blue-400 ml-1 tracking-widest">Synchronizing</span>
  </div>
);

const EmergentActivity = ({ fileActions, isGenerating, onFileClick }: EmergentActivityProps) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState<number>(0);

  const uniqueFiles = useMemo(() => {
    const seen = new Set<string>();
    return fileActions.filter((a) => {
      if (seen.has(a.file)) return false;
      seen.add(a.file);
      return true;
    });
  }, [fileActions]);

  // 🔴 PROGRESSIVE REVEAL: Show files one-by-one with a stagger delay
  // Even if all files arrive at once, they animate in sequentially
  useEffect(() => {
    if (uniqueFiles.length > revealedCount) {
      const timer = setTimeout(() => {
        setRevealedCount((prev) => Math.min(prev + 1, uniqueFiles.length));
      }, 100); // 100ms delay between each file reveal
      return () => clearTimeout(timer);
    }
  }, [uniqueFiles.length, revealedCount]);

  // When generation is done and all files are shown, ensure all are revealed
  useEffect(() => {
    if (!isGenerating && uniqueFiles.length > 0) {
      setRevealedCount(uniqueFiles.length);
    }
  }, [isGenerating, uniqueFiles.length]);

  const visibleFiles = uniqueFiles.slice(0, revealedCount);

  return (
    <div className="flex flex-col gap-6 w-full mt-6 perspective-1000">
      {/* 🛠️ System Intelligence Layer */}
      <AnimatePresence mode="popLayout">
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-3 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12">
              <CpuIcon size={48} className="text-blue-500" />
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="size-2 rounded-full bg-blue-500 animate-ping" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Dev X Architecture Synthesis</span>
              {uniqueFiles.length > 0 && (
                <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 tabular-nums">
                  {revealedCount}/{uniqueFiles.length} files
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INIT_STEPS.map((step, i) => (
                <motion.div
                  key={step.text}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-2xl"
                >
                  <step.icon size={16} className={cn(step.color, "opacity-80")} />
                  <span className="text-[10px] text-gray-400 font-bold leading-tight uppercase tracking-wide">{step.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📦 Object Manufacturing Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 relative">
        <AnimatePresence mode="popLayout">
          {visibleFiles.map((action, i) => {
            const isExpanding = expandedFile === action.file;
            const isLast = i === visibleFiles.length - 1;

            return (
              <motion.div
                key={action.file}
                layout
                initial={{ opacity: 0, x: -20, rotateY: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  layout: { duration: 0.4 }
                }}
                className={cn(
                  "group/card relative rounded-[1.5rem] border transition-all duration-300",
                  isExpanding
                    ? "col-span-full border-blue-500/40 bg-blue-500/[0.08] shadow-[0_20px_60px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
                    : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.05] shadow-lg"
                )}
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <button
                    onClick={() => onFileClick?.(action.file)}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="relative">
                      <div className="shrink-0 size-11 rounded-2xl bg-[#0d0d0d] border border-white/[0.08] flex items-center justify-center relative z-10 shadow-inner overflow-hidden group-hover/card:border-blue-500/40 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                        {getIconForFile(action.file)}
                      </div>
                      {isGenerating && isLast && (
                        <motion.div
                          className="absolute -top-1 -right-1 size-3 bg-blue-500 rounded-full border-2 border-black"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.05em] truncate">
                          {action.file.split('/').pop()}
                        </span>
                        <div className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-white/[0.05] text-gray-500 border border-white/[0.03]">
                          {action.file.includes('component') ? 'UI_OBJ' : 'LOGIC_NODE'}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-600 font-mono truncate max-w-[180px]">
                        {action.file}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedFile(isExpanding ? null : action.file);
                      }}
                      className={cn(
                        "size-8 rounded-xl flex items-center justify-center transition-all",
                        isExpanding ? "bg-blue-500/20 text-blue-400" : "bg-white/[0.03] text-gray-600 hover:text-white"
                      )}
                    >
                      <Code2Icon size={14} />
                    </button>
                    <button
                      onClick={() => onFileClick?.(action.file)}
                      className="size-8 rounded-xl bg-white/[0.03] text-gray-600 hover:text-white flex items-center justify-center transition-all"
                    >
                      <ExternalLinkIcon size={14} />
                    </button>
                  </div>
                </div>

                {/* 📝 Code Mirror Micro-View */}
                <AnimatePresence>
                  {isExpanding && action.content && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-blue-500/10"
                    >
                      <div className="p-4 pt-2">
                        <div className="bg-black/95 rounded-xl border border-white/5 p-3 font-mono text-[10px] leading-relaxed relative group/code">
                          <pre className="text-blue-300/80 max-h-[120px] overflow-auto scrollbar-hide selection:bg-blue-500/30">
                            <code>{action.content}</code>
                          </pre>
                          <div className="absolute top-2 right-2 flex items-center gap-2">
                            <div className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest">
                              Live Stream
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 🛡️ Verification Signal */}
      {!isGenerating && visibleFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-[2.5rem] bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-blue-500/[0.02] translate-x-12 translate-y-12 rotate-45 pointer-events-none" />
          <div className="size-14 rounded-[1.5rem] bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-700">
            <ShieldCheckIcon size={28} className="text-blue-400" />
          </div>
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1">Architecture Stabilized</span>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-sm">
              Production-grade Dev X synthesis complete. Your application core has been verified and instantiated in the edge sandbox.
            </p>
          </div>
          <div className="sm:ml-auto flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest">
            <CheckIcon size={12} />
            Verified
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Assistant Message ─────────────────────────────────────────────────────────

interface AssistantMessageProps {
  content: string;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  onFileClick?: (path: string) => void;
  type: MessageType;
  isGenerating?: boolean;
  fileActions?: any[];
}

const AssistantMessage = ({
  content,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  onFileClick,
  type,
  isGenerating = false,
  fileActions = [],
}: AssistantMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  }, [content]);

  const isAnalyzing = type === "ANALYSIS";
  const isResult = type === "RESULT";

  // 🎉 PARTY CONFETTI: Celebrate when app generation completes!
  const hasCelebrated = useRef(false);
  useEffect(() => {
    if (isResult && fragment && !isGenerating && !hasCelebrated.current) {
      hasCelebrated.current = true;
      // Fire confetti from both sides with colorful bursts
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#ff0000', '#ff6600', '#ffcc00', '#33cc33', '#0099ff', '#9933ff', '#ff33cc', '#00ffcc'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.6 },
          colors,
          zIndex: 9999,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.6 },
          colors,
          zIndex: 9999,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      // Initial big burst from center
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5, x: 0.5 },
        colors,
        zIndex: 9999,
        startVelocity: 45,
        gravity: 0.8,
        scalar: 1.2,
        ticks: 200,
      });

      // Then continuous side bursts
      frame();
    }
  }, [isResult, fragment, isGenerating]);

  return (
    <div className="flex justify-start pb-10 px-4">
      <div className="flex flex-col items-start w-full max-w-[95%] gap-3">

        {/* Identity & Status */}
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center p-1.5 relative">
              <CpuIcon size={16} className="text-blue-400" />
              {isGenerating && (
                <div className="absolute -top-0.5 -right-0.5 size-2 bg-blue-500 rounded-full border-2 border-black animate-pulse" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none">DEV-X ENGINE</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter tabular-nums pt-1">
                {isGenerating ? "Processing Stream" : formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* ── ANALYSIS & PROGRESS ── */}
        {(isAnalyzing || (isResult && fileActions.length > 0)) && (
          <div className="w-full">
            <EmergentActivity fileActions={fileActions} isGenerating={isGenerating} onFileClick={onFileClick} />
          </div>
        )}

        {/* ── TEXT CONTENT ── */}
        {!isAnalyzing && content && content !== "Generating your app..." && content !== "App generated!" && (
          <div
            className="px-5 py-4 rounded-3xl rounded-bl-none shadow-2xl text-[15px] font-medium leading-relaxed border border-white/5 group relative w-full mt-2"
            style={{ backgroundColor: "#0c0c0c", color: "#d1d5db" }}
          >
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              {copied
                ? <CheckIcon size={14} className="text-green-500" />
                : <CopyIcon size={14} />
              }
            </button>
            {content}
          </div>
        )}

        {/* ── DEPLOYMENT CARD ── */}
        {fragment && isResult && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}
      </div>
    </div>
  );
};

// ─── Export ────────────────────────────────────────────────────────────────────

interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  onFileClick?: (path: string) => void;
  type: MessageType;
  isGenerating?: boolean;
  fileActions?: any[];
}

export const MessageCard = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  onFileClick,
  type,
  isGenerating = false,
  fileActions = [],
}: MessageCardProps) => {
  if (role === "ASSISTANT") {
    return (
      <AssistantMessage
        content={content}
        fragment={fragment}
        createdAt={createdAt}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        onFileClick={onFileClick}
        type={type}
        isGenerating={isGenerating}
        fileActions={fileActions}
      />
    );
  }

  return <UserMessage content={content} createdAt={createdAt} />;
};

export default MessageCard;
