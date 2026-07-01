"use client";

import { Fragment, MessageType, MessageRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import fireConfetti from "canvas-confetti";
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

  ShieldCheckIcon,
  LayersIcon,
  ExternalLinkIcon,
  RefreshCcwIcon,
  BrainIcon,
  BookOpenIcon,
  SearchIcon,
  PencilIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

// ─── EMOJI STRIPPER FOR PREMIUM SAAS LOOK ─────────────────────────────────────
function stripEmojis(text: string): string {
  if (!text) return "";
  return text
    // Remove standard Unicode emoji ranges
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '')
    // Remove specific checkmarks, icons, indicators commonly used in build logs
    .replace(/^[✓✗✓▶⏭️🚨🔥📦🚀🤖⚙️🛠️📂💾🖥️⚡🛡️✅⚠️❌🗑️✓\-•\s]+/, '')
    .trim();
}

// ─── User Message ─────────────────────────────────────────────────────────────

interface UserMessageProps {
  content: string;
  createdAt: Date;
}

const UserMessage = ({ content, createdAt }: UserMessageProps) => (
  <div className="flex justify-end pb-8 px-4">
    <div className="flex flex-col items-end max-w-[85%] gap-2 group/user-msg">
      <div className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase tabular-nums opacity-0 group-hover/user-msg:opacity-100 transition-opacity duration-300">
        {formatDistanceToNow(createdAt, { addSuffix: true })}
      </div>
      <div
        className="px-4 py-2.5 rounded-[1.25rem] rounded-br-[0.35rem] text-blue-50/90 text-[13px] font-normal leading-relaxed tracking-tight relative overflow-hidden backdrop-blur-md border border-blue-500/10"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(30,64,175,0.03) 100%)",
          boxShadow: "0 4px 24px -8px rgba(37,99,235,0.1), inset 0 1px 1px rgba(255,255,255,0.05)",
        }}
      >
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/user-msg:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative z-10">{content}</div>
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
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={() => onFragmentClick(fragment)}
    className={cn(
      "group relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border w-full transition-all duration-300 text-left mt-4",
      isActiveFragment
        ? "border-blue-500/30 bg-blue-500/[0.04] shadow-[0_0_30px_rgba(59,130,246,0.06)]"
        : "border-white/5 bg-white/[0.01] hover:border-blue-500/20 hover:bg-blue-500/[0.02]"
    )}
  >
    <div className="flex items-center gap-3 relative z-10">
      <div className={cn(
        "p-2.5 rounded-xl border transition-colors duration-300",
        isActiveFragment
          ? "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          : "bg-white/5 border-white/8 text-gray-500 group-hover:text-blue-400"
      )}>
        <TerminalIcon size={16} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-[13px] text-white tracking-tight">
          {fragment.title || "Production Build"}
        </span>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">
          <PlayIcon size={8} className="fill-current" />
          <span>Deploy Interactive Interface</span>
        </div>
      </div>
    </div>
    <ChevronRightIcon
      size={16}
      className={cn(
        "transition-all duration-300 relative z-10",
        isActiveFragment ? "text-blue-400" : "text-gray-700 group-hover:text-blue-400 group-hover:translate-x-0.5"
      )}
    />
  </motion.button>
);

// ─── Emergent Chat Activity ───────────────────────────────────────────────────
interface EmergentActivityProps {
  fileActions: any[];
  isGenerating: boolean;
  onFileClick?: (path: string) => void;
}

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

  useEffect(() => {
    if (uniqueFiles.length > revealedCount) {
      const timer = setTimeout(() => {
        setRevealedCount((prev) => Math.min(prev + 1, uniqueFiles.length));
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [uniqueFiles.length, revealedCount]);

  useEffect(() => {
    if (!isGenerating && uniqueFiles.length > 0) {
      setRevealedCount(uniqueFiles.length);
    }
  }, [isGenerating, uniqueFiles.length]);

  const visibleFiles = uniqueFiles.slice(0, revealedCount);

  return (
    <div className="flex flex-col gap-2 w-full mt-3 pl-1">
      {/* 📦 Minimal, Clean Artifact Flow */}
      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {visibleFiles.map((action, i) => {
            const isExpanding = expandedFile === action.file;
            const isLast = i === visibleFiles.length - 1;

            return (
              <motion.div
                key={action.file}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group/item">
                  <button
                    onClick={() => onFileClick?.(action.file)}
                    className="flex items-center gap-3 text-left min-w-0 flex-1"
                  >
                    <div className="shrink-0 size-8 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center relative shadow-sm group-hover/item:border-blue-500/30 transition-colors">
                      {getIconForFile(action.file)}
                      {isGenerating && isLast && (
                        <span className="absolute -top-0.5 -right-0.5 size-1.5 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[12px] font-semibold text-white/95 truncate">
                        {action.file.split('/').pop()}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono truncate max-w-[220px] hidden sm:inline">
                        {action.file}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0 opacity-40 group-hover/item:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedFile(isExpanding ? null : action.file);
                      }}
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center transition-all",
                        isExpanding ? "bg-blue-500/10 text-blue-400" : "text-gray-400 hover:text-white"
                      )}
                    >
                      <Code2Icon size={12} />
                    </button>
                    <button
                      onClick={() => onFileClick?.(action.file)}
                      className="size-7 rounded-lg text-gray-400 hover:text-white flex items-center justify-center transition-all"
                    >
                      <ExternalLinkIcon size={12} />
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
                      className="overflow-hidden ml-11 mr-2 my-1"
                    >
                      <div className="bg-black/40 rounded-xl border border-white/[0.04] p-3 font-mono text-[10px] leading-relaxed relative group/code shadow-inner">
                        <pre className="text-blue-300/80 max-h-[120px] overflow-auto scrollbar-hide selection:bg-blue-500/30">
                          <code>{action.content}</code>
                        </pre>
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest leading-none">
                          Live Stream
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
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 py-2.5 px-3 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 flex items-center gap-3"
        >
          <ShieldCheckIcon size={14} className="text-blue-400 shrink-0" />
          <span className="text-[11px] text-gray-400 leading-none">
            Architecture verified and synced cleanly at the edge.
          </span>
          <div className="ml-auto text-[8px] font-bold text-blue-400 uppercase tracking-widest leading-none">
            Ready
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Step Details Parser for Premium Agent Timeline ───
function getStepDetails(title: string) {
  const text = title.toLowerCase();
  
  if (text.includes("think") || text.includes("understand") || text.includes("inspect") || text.includes("analyz") || text.includes("review") || text.includes("prepar")) {
    return {
      icon: <BrainIcon size={14} className="text-purple-400 shrink-0 animate-pulse" />,
      color: "border-purple-500/20 bg-purple-500/5 text-purple-300",
      label: "Thinking"
    };
  }
  if (text.includes("read") || text.includes("sourc") || text.includes("view")) {
    return {
      icon: <BookOpenIcon size={14} className="text-blue-400 shrink-0" />,
      color: "border-blue-500/20 bg-blue-500/5 text-blue-300",
      label: "Reading File"
    };
  }
  if (text.includes("search") || text.includes("find") || text.includes("locat")) {
    return {
      icon: <SearchIcon size={14} className="text-cyan-400 shrink-0" />,
      color: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
      label: "Searching"
    };
  }
  if (text.includes("update") || text.includes("refactor") || text.includes("writ") || text.includes("generat") || text.includes("edit") || text.includes("creat")) {
    return {
      icon: <PencilIcon size={14} className="text-amber-400 shrink-0" />,
      color: "border-amber-500/20 bg-amber-500/5 text-amber-300",
      label: "Editing"
    };
  }
  if (text.includes("run") || text.includes("install") || text.includes("npm") || text.includes("command")) {
    return {
      icon: <TerminalIcon size={14} className="text-slate-400 shrink-0" />,
      color: "border-slate-500/20 bg-slate-500/5 text-slate-300",
      label: "Running Command"
    };
  }
  if (text.includes("verify") || text.includes("validat") || text.includes("check") || text.includes("test")) {
    return {
      icon: <CheckCircle2Icon size={14} className="text-emerald-400 shrink-0 animate-bounce" />,
      color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
      label: "Testing"
    };
  }
  if (text.includes("success") || text.includes("complete") || text.includes("stabiliz") || text.includes("ready") || text.includes("live")) {
    return {
      icon: <CheckCircle2Icon size={14} className="text-green-400 shrink-0" />,
      color: "border-green-500/20 bg-green-500/5 text-green-300",
      label: "Success"
    };
  }
  if (text.includes("error") || text.includes("fail") || text.includes("crash")) {
    return {
      icon: <AlertTriangleIcon size={14} className="text-rose-400 shrink-0 animate-bounce" />,
      color: "border-rose-500/20 bg-rose-500/5 text-rose-300",
      label: "Error"
    };
  }
  
  return {
    icon: <CpuIcon size={14} className="text-blue-400 shrink-0" />,
    color: "border-blue-500/20 bg-blue-500/5 text-blue-300",
    label: "Thinking"
  };
}

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
  const [showThinking, setShowThinking] = useState(isGenerating);

  // Keep timeline open while actively generating
  useEffect(() => {
    if (isGenerating) {
      setShowThinking(true);
    }
  }, [isGenerating]);

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
        fireConfetti({
          particleCount: 4,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.6 },
          colors,
          zIndex: 9999,
        });
        fireConfetti({
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
      fireConfetti({
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

      frame();
    }
  }, [isResult, fragment, isGenerating]);

  const lines = useMemo(() => {
    return content ? content.split("\n").filter(line => line.trim().length > 0) : [];
  }, [content]);

  const narrationText = useMemo(() => {
    return lines.length > 0 ? lines[0] : "";
  }, [lines]);

  const thinkingSteps = useMemo(() => {
    return lines.length > 1 ? lines.slice(1) : [];
  }, [lines]);

  const isBoilerplate = useMemo(() => {
    const trimmed = narrationText.trim();
    return trimmed === "Generating your app..." || trimmed === "App generated!" || trimmed === "Here is your custom application!";
  }, [narrationText]);

  // Construct a merged chronological list of pipeline statuses AND actual real-time file actions
  const mergedSteps = useMemo(() => {
    const earlyStatuses: string[] = [];
    const lateStatuses: string[] = [];

    thinkingSteps.forEach(stepText => {
      const lower = stepText.toLowerCase();
      const isLate = 
        lower.includes("writing") || 
        lower.includes("quality checks") || 
        lower.includes("deploying") || 
        lower.includes("starting the development") || 
        lower.includes("compiling") || 
        lower.includes("server started") || 
        lower.includes("live and ready");

      if (isLate) {
        lateStatuses.push(stepText);
      } else {
        earlyStatuses.push(stepText);
      }
    });

    const steps: Array<{
      id: string;
      title: string;
      details?: string;
      badge?: string | null;
      isFile?: boolean;
      isSuccess?: boolean;
      isWarning?: boolean;
      isCurrent?: boolean;
    }> = [];

    earlyStatuses.forEach((text, idx) => {
      steps.push({
        id: `early-${idx}`,
        title: text,
        isCurrent: isGenerating && idx === earlyStatuses.length - 1 && fileActions.length === 0 && lateStatuses.length === 0
      });
    });

    fileActions.forEach((action, idx) => {
      const isEdit = action.type === "edit";
      const actionName = isEdit ? "Edit" : "Create";
      const filename = action.file.split('/').pop() || "";
      steps.push({
        id: `file-${action.file}-${idx}`,
        title: actionName,
        details: filename,
        badge: action.details ? (action.details.startsWith("+") ? action.details : `+${action.details}`) : null,
        isFile: true,
        isSuccess: true,
        isCurrent: isGenerating && idx === fileActions.length - 1 && lateStatuses.length === 0
      });
    });

    lateStatuses.forEach((text, idx) => {
      const isLive = text.includes("live and ready");
      steps.push({
        id: `late-${idx}`,
        title: text,
        isSuccess: isLive,
        isCurrent: isGenerating && idx === lateStatuses.length - 1
      });
    });

    return steps;
  }, [thinkingSteps, fileActions, isGenerating]);

  const latestStepText = useMemo(() => {
    if (mergedSteps.length === 0) return "";
    const last = mergedSteps[mergedSteps.length - 1];
    if (last.isFile) return `${last.title} ${last.details} ${last.badge || ""}`;
    return stripEmojis(last.title);
  }, [mergedSteps]);

  useEffect(() => {
    // Scroll handling for mergedSteps if needed in the future
  }, [mergedSteps.length]);

  return (
    <div className="flex justify-start pb-10 px-4">
      <div className="flex flex-col items-start w-full max-w-[95%] gap-3">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/25 flex items-center justify-center p-1.5 relative shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <img src="/logo.svg" className="size-full object-contain" alt="DevX Engine Logo" />
              {isGenerating && <div className="absolute -top-0.5 -right-0.5 size-2 bg-blue-400 rounded-full border-2 border-black animate-ping" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none">DEV-X ENGINE</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter tabular-nums pt-1">
                {isGenerating ? "Thinking..." : formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* ── TEXT CONTENT ── */}
        {narrationText && narrationText.trim().length > 0 && !isBoilerplate && (
          <div className="w-full text-[13px] text-gray-300/90 leading-relaxed font-normal mt-1 px-1">
            <div className="relative z-10 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-code:text-blue-200 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{narrationText}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* ── THINKING BLOCK (Lovable/Emergent style) ── */}
        {mergedSteps.length > 0 && (
          <div className="w-full mt-2 relative z-20">
            {/* Shimmer keyframe injected once */}
            <style>{`
              @keyframes devx-shimmer {
                0%   { background-position: 200% center; }
                100% { background-position: -200% center; }
              }
              .devx-shimmer {
                background: linear-gradient(
                  90deg,
                  rgba(255,255,255,0.03) 0%,
                  rgba(99,102,241,0.12) 30%,
                  rgba(168,85,247,0.10) 50%,
                  rgba(99,102,241,0.12) 70%,
                  rgba(255,255,255,0.03) 100%
                );
                background-size: 200% 100%;
                animation: devx-shimmer 2s ease-in-out infinite;
              }
              @keyframes devx-shimmer-bar {
                0%   { background-position: 200% center; }
                100% { background-position: -200% center; }
              }
              .devx-shimmer-bar {
                background: linear-gradient(
                  90deg,
                  rgba(255,255,255,0.05) 0%,
                  rgba(99,102,241,0.18) 40%,
                  rgba(168,85,247,0.14) 60%,
                  rgba(255,255,255,0.05) 100%
                );
                background-size: 200% 100%;
                animation: devx-shimmer-bar 1.6s ease-in-out infinite;
              }
            `}</style>

            {/* Collapsible Trigger */}
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="group flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.04] active:bg-white/[0.06] transition-all text-left w-full select-none"
            >
              {/* Icon with spin while generating */}
              <div className="relative size-5 flex items-center justify-center shrink-0">
                {isGenerating ? (
                  <>
                    <div className="absolute inset-0 rounded bg-indigo-500/20 blur-sm animate-pulse" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="relative"
                    >
                      <CpuIcon size={12} className="text-indigo-400" />
                    </motion.div>
                  </>
                ) : (
                  <CpuIcon size={12} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-[11px] font-bold tracking-wider uppercase",
                isGenerating ? "text-indigo-300" : "text-gray-500 group-hover:text-gray-300"
              )}>
                {isGenerating ? "Thinking" : "Thoughts"}
              </span>

              {/* Step count badge */}
              <div className={cn(
                "px-1.5 py-0.5 rounded-md text-[8px] font-black leading-none transition-all",
                isGenerating
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                  : "bg-white/5 text-slate-500"
              )}>
                {mergedSteps.length}
              </div>

              {/* Live ticker */}
              {isGenerating && (
                <span className="text-[9px] text-indigo-400/70 font-mono truncate max-w-[160px] ml-1 animate-pulse">
                  {latestStepText || "Orchestrating..."}
                </span>
              )}

              {/* Chevron */}
              <ChevronRightIcon
                size={11}
                className={cn(
                  "ml-auto text-gray-600 transition-transform duration-300",
                  showThinking ? "rotate-90" : "rotate-0"
                )}
              />
            </button>

            {/* Steps Panel */}
            <AnimatePresence initial={false}>
              {showThinking && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    "mt-2 rounded-2xl border overflow-hidden",
                    isGenerating
                      ? "border-indigo-500/15 bg-[#0d0d14]"
                      : "border-white/[0.05] bg-[#0a0a0f]"
                  )}>
                    {/* Top shimmer stripe */}
                    {isGenerating && (
                      <div className="h-px w-full devx-shimmer" />
                    )}

                    <div className="flex flex-col divide-y divide-white/[0.04]">
                      {mergedSteps.map((step, idx) => {
                        const stepConfig = getStepDetails(step.title);
                        const isCurrent = step.isCurrent;
                        const isDone = !isCurrent && !isGenerating;
                        const isPending = isGenerating && !isCurrent && idx > mergedSteps.findIndex(s => s.isCurrent);
                        const isShimmering = isCurrent || (isGenerating && idx >= mergedSteps.length - 2);

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.03, ease: "easeOut" }}
                            className={cn(
                              "relative flex items-center gap-3 px-4 py-3 text-[11.5px] transition-all group/step",
                              isCurrent && "devx-shimmer",
                              !isCurrent && !isDone && isGenerating && "opacity-60"
                            )}
                          >
                            {/* Status dot */}
                            <div className="shrink-0 relative">
                              {isCurrent ? (
                                <div className="relative size-4 flex items-center justify-center">
                                  <div className="absolute size-4 rounded-full bg-indigo-500/30 animate-ping" />
                                  <div className="relative size-2 rounded-full bg-indigo-400" />
                                </div>
                              ) : isDone || (!isGenerating) ? (
                                <div className="size-4 flex items-center justify-center">
                                  {step.isSuccess || !isGenerating ? (
                                    <CheckCircle2Icon size={13} className="text-emerald-500/80" />
                                  ) : (
                                    stepConfig.icon
                                  )}
                                </div>
                              ) : (
                                <div className="size-4 flex items-center justify-center opacity-40">
                                  <div className="size-1.5 rounded-full bg-gray-500" />
                                </div>
                              )}
                            </div>

                            {/* Text content */}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              {isShimmering && isGenerating ? (
                                /* Shimmer skeleton for current/near-current steps */
                                <div className="flex items-center gap-2 w-full">
                                  <div
                                    className="devx-shimmer-bar rounded-md h-2.5 flex-1 max-w-[180px]"
                                    style={{ opacity: 0.7 }}
                                  />
                                  {step.details && (
                                    <div
                                      className="devx-shimmer-bar rounded-md h-2 w-16"
                                      style={{ opacity: 0.4 }}
                                    />
                                  )}
                                </div>
                              ) : (
                                <>
                                  <span className={cn(
                                    "font-medium tracking-tight truncate",
                                    isCurrent ? "text-indigo-300" :
                                    isDone ? "text-gray-400" :
                                    "text-gray-600"
                                  )}>
                                    {stripEmojis(step.title)}
                                  </span>
                                  {step.details && (
                                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[140px] shrink-0">
                                      {step.details}
                                    </span>
                                  )}
                                  {step.badge && (
                                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400/80 text-[8px] font-black uppercase tracking-wider leading-none">
                                      {step.badge}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Right badge - type label */}
                            {!isShimmering && (
                              <div className={cn(
                                "shrink-0 text-[8px] font-black uppercase tracking-widest leading-none px-1.5 py-0.5 rounded-md",
                                isCurrent
                                  ? "text-indigo-400/70 bg-indigo-500/10"
                                  : "text-gray-600 bg-white/[0.03]"
                              )}>
                                {stepConfig.label}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}

                      {/* Live activity skeleton rows at bottom when generating */}
                      {isGenerating && (
                        <>
                          <div className="flex items-center gap-3 px-4 py-3 devx-shimmer">
                            <div className="size-4 flex items-center justify-center shrink-0">
                              <div className="size-2 rounded-full bg-indigo-400/40 animate-pulse" />
                            </div>
                            <div className="devx-shimmer-bar rounded-md h-2.5 flex-1 max-w-[220px] opacity-50" />
                            <div className="devx-shimmer-bar rounded-md h-2 w-12 opacity-30" />
                          </div>
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className="size-4 flex items-center justify-center shrink-0">
                              <div className="size-1.5 rounded-full bg-gray-600/30" />
                            </div>
                            <div className="h-2 w-[160px] rounded-md bg-white/[0.03]" />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom shimmer stripe */}
                    {isGenerating && (
                      <div className="h-px w-full devx-shimmer" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}


        {/* ── ANALYSIS & PROGRESS (Files) ── */}
        {fileActions.length > 0 && (
          <div className="w-full mt-2">
            <EmergentActivity fileActions={fileActions} isGenerating={isGenerating} onFileClick={onFileClick} />
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
