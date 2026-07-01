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

// ─── User Message ─────────────────────────────────────────────────────────────

interface UserMessageProps {
  content: string;
  createdAt: Date;
}

const UserMessage = ({ content, createdAt }: UserMessageProps) => (
  <div className="flex justify-end pb-6 px-4">
    <div className="flex flex-col items-end max-w-[85%] gap-1.5 group/user-msg">
      <div className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase tabular-nums opacity-0 group-hover/user-msg:opacity-100 transition-opacity duration-300">
        {formatDistanceToNow(createdAt, { addSuffix: true })}
      </div>
      <div
        className="px-4 py-2.5 rounded-2xl bg-white/[0.05] text-white text-[13px] font-normal leading-relaxed tracking-tight relative overflow-hidden"
      >
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
      "group relative overflow-hidden flex items-center justify-between p-3.5 rounded-xl border w-full transition-all duration-200 text-left mt-3",
      isActiveFragment
        ? "border-white/10 bg-white/[0.03]"
        : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
    )}
  >
    <div className="flex items-center gap-3 relative z-10">
      <div className={cn(
        "p-2 rounded-lg border transition-colors duration-300",
        isActiveFragment
          ? "bg-white/5 border-white/10 text-white"
          : "bg-white/5 border-white/5 text-gray-500 group-hover:text-gray-300"
      )}>
        <TerminalIcon size={14} strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-[12px] text-white tracking-tight">
          {fragment.title || "Production Build"}
        </span>
        <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none">
          <PlayIcon size={7} className="fill-current" />
          <span>Deploy Interactive Interface</span>
        </div>
      </div>
    </div>
    <ChevronRightIcon
      size={14}
      className={cn(
        "transition-all duration-300 relative z-10",
        isActiveFragment ? "text-white" : "text-gray-700 group-hover:text-white group-hover:translate-x-0.5"
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
    <div className="flex flex-col gap-1.5 w-full mt-2 pl-1">
      <div className="flex flex-col gap-1">
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
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors group/item">
                  <button
                    onClick={() => onFileClick?.(action.file)}
                    className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                  >
                    <div className="shrink-0 size-7 rounded bg-white/[0.02] border border-white/[0.06] flex items-center justify-center relative">
                      {getIconForFile(action.file)}
                      {isGenerating && isLast && (
                        <span className="absolute -top-0.5 -right-0.5 size-1 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[12px] font-medium text-white/90 truncate">
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
                        isExpanding ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
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

                <AnimatePresence>
                  {isExpanding && action.content && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-9 mr-2 my-1"
                    >
                      <div className="bg-black/40 rounded-xl border border-white/[0.04] p-3 font-mono text-[10px] leading-relaxed relative group/code shadow-inner">
                        <pre className="text-gray-300 max-h-[120px] overflow-auto scrollbar-hide selection:bg-white/10">
                          <code>{action.content}</code>
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!isGenerating && visibleFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3"
        >
          <ShieldCheckIcon size={14} className="text-gray-400 shrink-0" />
          <span className="text-[11px] text-gray-400 leading-none">
            Architecture verified and synced cleanly.
          </span>
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
      icon: <BrainIcon size={14} className="text-gray-400 shrink-0" />,
      color: "",
      label: "Thinking"
    };
  }
  if (text.includes("read") || text.includes("sourc") || text.includes("view")) {
    return {
      icon: <BookOpenIcon size={14} className="text-gray-400 shrink-0" />,
      color: "",
      label: "Reading File"
    };
  }
  if (text.includes("search") || text.includes("find") || text.includes("locat")) {
    return {
      icon: <SearchIcon size={14} className="text-gray-400 shrink-0" />,
      color: "",
      label: "Searching"
    };
  }
  if (text.includes("update") || text.includes("refactor") || text.includes("writ") || text.includes("generat") || text.includes("edit") || text.includes("creat")) {
    return {
      icon: <PencilIcon size={14} className="text-gray-400 shrink-0" />,
      color: "",
      label: "Editing"
    };
  }
  if (text.includes("run") || text.includes("install") || text.includes("npm") || text.includes("command")) {
    return {
      icon: <TerminalIcon size={14} className="text-gray-400 shrink-0" />,
      color: "",
      label: "Running Command"
    };
  }
  if (text.includes("verify") || text.includes("validat") || text.includes("check") || text.includes("test")) {
    return {
      icon: <CheckCircle2Icon size={14} className="text-gray-400 shrink-0" />,
      color: "",
      label: "Testing"
    };
  }
  if (text.includes("success") || text.includes("complete") || text.includes("stabiliz") || text.includes("ready") || text.includes("live")) {
    return {
      icon: <CheckCircle2Icon size={14} className="text-gray-400 shrink-0" />,
      color: "",
      label: "Success"
    };
  }
  if (text.includes("error") || text.includes("fail") || text.includes("crash")) {
    return {
      icon: <AlertTriangleIcon size={14} className="text-gray-400 shrink-0" />,
      color: "",
      label: "Error"
    };
  }
  
  return {
    icon: <CpuIcon size={14} className="text-gray-400 shrink-0" />,
    color: "",
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
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#ffffff', '#cccccc', '#999999', '#666666'];

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
    <div className="flex justify-start pb-8 px-4">
      <div className="flex flex-col items-start w-full max-w-[95%] gap-2.5">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center p-1 relative">
              <img src="/logo.svg" className="size-full object-contain" alt="DevX Engine Logo" />
              {isGenerating && <div className="absolute -top-0.5 -right-0.5 size-1.5 bg-gray-400 rounded-full animate-pulse" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-none">DEV-X ENGINE</span>
              <span className="text-[8px] font-medium text-gray-500 uppercase tracking-tighter tabular-nums pt-1">
                {isGenerating ? "Thinking..." : formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* ── TEXT CONTENT ── */}
        {narrationText && narrationText.trim().length > 0 && !isBoilerplate && (
          <div className="w-full text-[13px] text-gray-300 leading-relaxed font-normal mt-1 px-1">
            <div className="relative z-10 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-white/80 hover:prose-a:text-white prose-code:text-white prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{narrationText}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* ── THINKING BLOCK ── */}
        {mergedSteps.length > 0 && (
          <div className="w-full mt-2 pl-1 select-none">
            {/* Collapsible Trigger */}
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-2 py-1 text-gray-500 hover:text-gray-300 transition-colors text-[11px] font-mono"
            >
              <CpuIcon size={12} className={cn("text-gray-500 shrink-0", isGenerating && "animate-spin")} />
              <span>{isGenerating ? "Thinking..." : "Thoughts"}</span>
              <span className="text-gray-600">({mergedSteps.length})</span>
              <ChevronRightIcon
                size={11}
                className={cn(
                  "transition-transform duration-200 text-gray-600",
                  showThinking ? "rotate-90" : "rotate-0"
                )}
              />
            </button>

            {/* Steps Panel */}
            <AnimatePresence initial={false}>
              {showThinking && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-l border-white/10 ml-1.5 pl-3.5 mt-2 space-y-1.5"
                >
                  {mergedSteps.map((step) => {
                    return (
                      <div key={step.id} className="flex items-start gap-2 text-[11.5px] text-gray-400">
                        <span className="text-gray-600 select-none">•</span>
                        <span className="leading-relaxed">
                          {stripEmojis(step.title)}
                          {step.details && (
                            <span className="text-gray-500 font-mono ml-1.5">({step.details})</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
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

