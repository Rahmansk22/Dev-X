"use client";
/* eslint-disable react/jsx-no-literals */
import React, { useEffect, Suspense, useState, useCallback } from "react";
import { MessagesContainer } from "../components/messages-container";
import { FragmentWeb } from "../components/fragment-web";
import { Fragment } from "@prisma/client";
import { ProjectHeader } from "../components/project-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CodeIcon, CrownIcon, Loader2, AlertCircle, RefreshCcwIcon, ExternalLinkIcon, Gamepad2Icon, TerminalSquareIcon, Laptop2Icon, LayoutPanelLeftIcon, GlobeIcon, CheckCircle2Icon, RocketIcon, MessageCircleIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileExplorer } from "@/components/file-explorer";
import { UserControl } from "@/components/user-control";
import { useAuth } from "@clerk/nextjs";
import { ErrorBoundary } from "react-error-boundary";
import { motion, AnimatePresence } from "framer-motion";
import type { FallbackProps } from "react-error-boundary";
import { GamesDock } from "../components/games-dock";
import { cn } from "@/lib/utils";

const TXT = {
    EngineThinking: "Engine is thinking... Try a game?",
    ModulesLoading: "Modules Loading",
    DevXInterface: "Dev X Interface v4.2.1 Stable",
    WannaTryGames: "Wanna try games until preview ready?",
    AnalyzingCode: "Analyzing Code... Try a game?",
    AnalyzingSource: "Analyzing Source"
};

function MessagesErrorFallback({ error }: FallbackProps) {
    return <ErrorFallback message="Error loading messages." error={error} />;
}

const LoadingState = ({ message }: { message: string }) => (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground bg-[#080808]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium tracking-wide uppercase opacity-50">{message}</p>
    </div>
);

const ErrorFallback = ({ message, error }: { message: string; error?: any }) => (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-destructive bg-[#080808]">
        <AlertCircle className="h-8 w-8" />
        <p className="text-center text-sm font-medium">{message}</p>
        {error && (
            <pre className="text-[10px] text-left max-w-xs overflow-x-auto bg-red-500/10 rounded-lg p-3 mt-2 border border-red-500/20 text-red-400 font-mono">
                {typeof error === 'string' ? error : error?.message || JSON.stringify(error, null, 2)}
            </pre>
        )}
    </div>
);



interface Props {
    projectId: string;
}

const ProjectView = ({ projectId }: Props) => {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileView, setMobileView] = useState<"chat" | "build">("chat");
    const { has } = useAuth();
    const hasProAccess = has?.({ plan: "pro" }) ?? false;
    const isFreeTier = has?.({ plan: "free_user" }) ?? false;

    const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
    const [tabState, setTabState] = useState<"preview" | "code" | "games">("preview");
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [emergentFiles, setEmergentFiles] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [showGames, setShowGames] = useState(false);
    const [showCodeGames, setShowCodeGames] = useState(false);

    // Deployment state
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
    const [isReRunning, setIsReRunning] = useState(false);

    const trpc = useTRPC();
    const trpcAny = trpc as any;

    useQuery<{ name: string }>(
        trpcAny.projects.getOne.queryOptions({ id: projectId })
    );


    useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile && !activeFragment) setMobileView("chat");
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [activeFragment]);

    // Selection management
    const handleFileSelect = useCallback((path: string) => {
        setTabState("code");
        setSelectedFile(path);
        if (isMobile) setMobileView("build");
    }, [isMobile]);

    const handleDeploy = useCallback(async () => {
        if (!projectId) return;
        setIsDeploying(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'vercel' }),
            });
            const data = await res.json();
            if (data.success && data.url) {
                setDeployedUrl(data.url);
                toast.success('Deployed to Vercel!', {
                    description: data.url,
                    action: {
                        label: 'Open',
                        onClick: () => window.open(data.url, '_blank'),
                    },
                });
            } else {
                toast.error('Deployment failed', {
                    description: data.error || 'Unable to complete deployment.',
                });
            }
        } catch (error) {
            toast.error('Deployment failed', {
                description: (error as Error)?.message || 'Network error during deployment.',
            });
        } finally {
            setIsDeploying(false);
        }
    }, [projectId]);

    const handleReRunPreview = useCallback(async () => {
        if (!projectId) return;
        setIsReRunning(true);
        const toastId = toast.loading("Rebuilding environment & starting fresh dev server...");
        try {
            const res = await fetch(`/api/projects/${projectId}/wakeup`, {
                method: "POST",
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Environment rebuilt successfully!", {
                    id: toastId,
                    description: "Dev server restarted in your app workspace. Syncing changes...",
                });
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                toast.error("Re-run failed", {
                    id: toastId,
                    description: data.error || "Unable to restart the environment.",
                });
            }
        } catch (error) {
            toast.error("Re-run failed", {
                id: toastId,
                description: (error as Error)?.message || "Network error.",
            });
        } finally {
            setIsReRunning(false);
        }
    }, [projectId]);

    // Auto-select first file when activeFragment OR emergentFiles changes
    useEffect(() => {
        const availableFiles = activeFragment?.files ? (activeFragment.files as any) : emergentFiles;
        if (Object.keys(availableFiles).length > 0 && !selectedFile) {
            const firstFile = Object.keys(availableFiles)[0];
            if (firstFile) setSelectedFile(firstFile);
        }
    }, [activeFragment, emergentFiles, selectedFile]);

    const handleRefresh = useCallback(() => {
        if (activeFragment?.sandboxUrl) window.location.reload();
    }, [activeFragment]);

    const handleCopyUrl = useCallback(async () => {
        if (activeFragment?.sandboxUrl) {
            await navigator.clipboard.writeText(activeFragment.sandboxUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [activeFragment]);

    if (!mounted) {
        return <div className="h-screen w-full bg-[#080808]" />;
    }

    const MobileNavigation = (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-[280px]">
            <Button
                asChild
                variant="outline"
                className={cn(
                    "mb-3 h-8 w-full rounded-full text-[10px] font-black uppercase tracking-widest",
                    hasProAccess
                        ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400"
                        : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500"
                )}
            >
                <Link href="/pricing" className="flex items-center justify-center gap-1.5">
                    <CrownIcon size={12} fill="currentColor" />
                    {hasProAccess ? "Pro Active" : isFreeTier ? "Free Plan" : "Manage Billing"}
                </Link>
            </Button>

            <div className="bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {[
                    { id: 'chat', label: 'Console', icon: MessageCircleIcon },
                    { id: 'build', label: 'Preview', icon: SparklesIcon }
                ].map((tab) => {
                    const isActive = mobileView === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setMobileView(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-[1.5rem] transition-all duration-300 relative",
                                isActive ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <tab.icon size={18} className={cn(isActive ? "text-black" : "text-gray-500")} />
                            <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                            {tab.id === 'build' && !activeFragment && Object.keys(emergentFiles).length > 0 && (
                                <div className="absolute top-2 right-4 size-2 rounded-full bg-blue-500 animate-pulse border-2 border-black" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const LeftPanel = (
        <div className="flex flex-col w-full h-full bg-[#000] overflow-hidden">
            <div className="shrink-0">
                <ErrorBoundary fallback={<ErrorFallback message="Project Header Error" />}>
                    <Suspense fallback={<LoadingState message="Restoring Session..." />}>
                        <ProjectHeader
                            projectId={projectId}
                            activeFragment={activeFragment}
                        />
                    </Suspense>
                </ErrorBoundary>

                {isMobile && (
                    <div className="px-3 pb-2 bg-[#000] border-b border-white/10">
                        <Button
                            asChild
                            variant="outline"
                            className={cn(
                                "h-8 w-full rounded-full text-[10px] font-black uppercase tracking-widest",
                                hasProAccess
                                    ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400"
                                    : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500"
                            )}
                        >
                            <Link href="/pricing" className="flex items-center justify-center gap-1.5">
                                <CrownIcon size={12} fill="currentColor" />
                                {hasProAccess ? "Pro Active" : isFreeTier ? "Free Plan" : "Manage Billing"}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative">
                <ErrorBoundary FallbackComponent={MessagesErrorFallback}>
                    <Suspense fallback={<LoadingState message="Parsing Messages..." />}>
                        <MessagesContainer
                            projectId={projectId}
                            activeFragment={activeFragment}
                            setActiveFragment={setActiveFragment}
                            onFileClick={handleFileSelect}
                            onFilesUpdate={setEmergentFiles}
                        />
                    </Suspense>
                </ErrorBoundary>
            </div>
        </div>
    );

    const RightPanel = (
        <Tabs
            className="flex w-full h-full flex-col bg-[#080808] gap-0"
            value={tabState}
            onValueChange={(v) => setTabState(v as any)}
        >
            <div className="shrink-0 flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a] border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <div className="flex items-center p-0.5 bg-black/40 border border-white/5 rounded-lg shadow-inner gap-0.5">
                        {[
                            { id: 'preview', icon: LayoutPanelLeftIcon, label: 'Visual' },
                            { id: 'code', icon: CodeIcon, label: 'Source' },
                        ].map((tab) => {
                            const isActive = tabState === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setTabState(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200",
                                        isActive
                                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm"
                                            : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
                                    )}
                                >
                                    <tab.icon size={12} className={isActive ? "text-blue-400" : "text-gray-600"} />
                                    <span className={cn(isMobile && tab.id !== 'code' ? "hidden sm:block" : "block")}>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* URL Bar beside Console with professional spacing */}
                    <AnimatePresence>
                        {activeFragment && (
                            <motion.div
                                key="active-toolbar"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="hidden xl:flex items-center gap-4 ml-4"
                            >
                                <div className="h-4 w-px bg-white/10 mx-1" />

                                <div className="flex items-center bg-black/40 border border-white/5 rounded-lg px-2 py-1 gap-2 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-2 px-2.5 py-0.5 bg-white/[0.03] rounded border border-white/5">
                                        <GlobeIcon size={10} className="text-blue-500/60" />
                                        <span className="text-[10px] font-mono text-gray-400 truncate max-w-[180px]">
                                            {activeFragment.sandboxUrl?.replace('https://', '')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleRefresh}
                                            className="p-1.5 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-all active:scale-90"
                                            title="Refresh"
                                        >
                                            <RefreshCcwIcon size={11} />
                                        </button>
                                        <button
                                            onClick={handleCopyUrl}
                                            className="p-1.5 hover:bg-white/10 rounded-md text-gray-500 hover:text-blue-400 transition-all active:scale-90"
                                            title="Copy URL"
                                        >
                                            {copied ? <CheckCircle2Icon size={11} className="text-emerald-500" /> : <ExternalLinkIcon size={11} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="h-4 w-px bg-white/10 mx-1" />

                                {/* Deploy Button beside URL */}
                                <motion.button
                                    onClick={handleDeploy}
                                    disabled={isDeploying || !!deployedUrl}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "group relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-500 border overflow-hidden shadow-lg",
                                        isDeploying
                                            ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                                            : deployedUrl
                                                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                                                : "border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:border-blue-500/50 hover:shadow-blue-500/10"
                                    )}
                                >
                                    {isDeploying ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : deployedUrl ? (
                                        <CheckCircle2Icon className="w-3 h-3" />
                                    ) : (
                                        <RocketIcon className="w-3 h-3" />
                                    )}
                                    <span>{isDeploying ? "Provisioning..." : deployedUrl ? "Live on Edge" : "Push to Vercel"}</span>

                                    {isDeploying && (
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 4.5, ease: "easeInOut" }}
                                        />
                                    )}
                                </motion.button>

                                <div className="h-4 w-px bg-white/10 mx-1" />

                                {/* Re-run Environment Button */}
                                <motion.button
                                    onClick={handleReRunPreview}
                                    disabled={isReRunning}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "group relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-500 border overflow-hidden shadow-lg",
                                        isReRunning
                                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                            : "border-emerald-500/30 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
                                    )}
                                >
                                    {isReRunning ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                                    ) : (
                                        <RefreshCcwIcon className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                                    )}
                                    <span>{isReRunning ? "Re-running..." : "Re-run Preview"}</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        asChild
                        variant="outline"
                        className={cn(
                            "rounded-full font-black uppercase tracking-widest",
                            isMobile ? "h-7 px-2 text-[8px]" : "h-7 px-3 text-[9px]",
                            hasProAccess
                                ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400"
                                : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500"
                        )}
                    >
                        <Link href="/pricing" className="flex items-center gap-1.5">
                            <CrownIcon size={11} fill="currentColor" />
                            {isMobile ? (hasProAccess ? "Pro" : "Plan") : (hasProAccess ? "Pro Active" : isFreeTier ? "Free Plan" : "Manage Billing")}
                        </Link>
                    </Button>

                    <div className="scale-95 opacity-90 hover:opacity-100 transition-all duration-300">
                        <UserControl />
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative overflow-hidden">
                <TabsContent value="preview" className="w-full h-full m-0 absolute inset-0">
                    {!activeFragment ? (
                        <div className="w-full h-full flex flex-col transition-all duration-500">
                            <AnimatePresence mode="wait">
                                {showGames ? (
                                    <motion.div
                                        key="games"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col h-full"
                                    >
                                        <div className="shrink-0 py-2 border-b border-white/[0.04] bg-[#0c0c0c] flex items-center justify-center gap-3">
                                            <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{TXT.EngineThinking}</span>
                                        </div>
                                        <div className="flex-1 overflow-auto scrollbar-hide">
                                            <GamesDock onClose={() => setShowGames(false)} />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="loading-buffer"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, filter: "blur(8px)" }}
                                        className="relative flex h-full flex-col overflow-hidden bg-[#0a0a0a]"
                                    >
                                        <style>{`
                                            @keyframes skeleton-shimmer {
                                                0% { background-position: 200% 0; }
                                                100% { background-position: -200% 0; }
                                            }
                                        `}</style>

                                        {/* ONE big terminal with shimmer blocks inside */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex-1 flex flex-col overflow-hidden pointer-events-none opacity-30 m-3 rounded-xl border border-white/[0.08] bg-[#0c0c0c]"
                                        >
                                            {/* Terminal title bar with 3 dots */}
                                            <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02]">
                                                <div className="size-[9px] rounded-full bg-[#ff5f57]" />
                                                <div className="size-[9px] rounded-full bg-[#febc2e]" />
                                                <div className="size-[9px] rounded-full bg-[#28c840]" />
                                                <div className="ml-4 h-3 w-32 rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: 'skeleton-shimmer 2.5s ease-in-out infinite' }} />
                                                <div className="ml-auto flex gap-2">
                                                    {[48, 60, 40].map((w, k) => (
                                                        <div key={k} className="h-3 rounded-sm" style={{ width: `${w}px`, background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${k * 0.15}s` }} />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Terminal body - all shimmer blocks inside */}
                                            <div className="flex-1 flex overflow-hidden">
                                                {/* Sidebar shimmer - full rectangle blocks */}
                                                <div className="shrink-0 flex flex-col gap-2.5 p-3 border-r border-white/[0.06] bg-white/[0.01]" style={{ width: '200px' }}>
                                                    <div className="h-10 w-full rounded-lg border border-white/[0.05] p-2.5" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: 'skeleton-shimmer 2.5s ease-in-out infinite' }}>
                                                        <div className="h-2 w-3/4 rounded bg-white/[0.04]" />
                                                    </div>
                                                    <div className="h-px w-full bg-white/[0.06]" />
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                        <div key={i} className="h-9 w-full rounded-lg border border-white/[0.05] p-2" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.09}s` }}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-3 rounded bg-white/[0.04] shrink-0" />
                                                                <div className="h-2 rounded bg-white/[0.04]" style={{ width: `${50 + (i * 7) % 40}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="h-px w-full bg-white/[0.06]" />
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={`s2-${i}`} className="h-9 w-full rounded-lg border border-white/[0.05] p-2" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${(i + 8) * 0.09}s` }}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-3 rounded bg-white/[0.04] shrink-0" />
                                                                <div className="h-2 rounded bg-white/[0.04]" style={{ width: `${40 + (i * 11) % 45}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Main content area */}
                                                <div className="flex-1 flex flex-col p-5 gap-4 overflow-hidden">
                                                    {/* Top bar */}
                                                    <div className="flex justify-between items-center gap-4">
                                                        <div className="h-5 w-36 rounded-md" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: 'skeleton-shimmer 2.5s ease-in-out infinite' }} />
                                                        <div className="flex gap-2">
                                                            {[72, 56, 88, 64].map((w, i) => (
                                                                <div key={i} className="h-7 rounded-md" style={{ width: `${w}px`, background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.12}s` }} />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Stats row - 4 rectangle cards */}
                                                    <div className="flex gap-3">
                                                        {[1, 2, 3, 4].map(i => (
                                                            <div key={i} className="flex-1 h-16 rounded-lg border border-white/[0.05] p-3" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.1}s` }}>
                                                                <div className="h-2 w-1/2 rounded bg-white/[0.04] mb-2" />
                                                                <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Cards grid - 3 rectangle blocks */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="h-24 rounded-lg border border-white/[0.05] p-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.15}s` }}>
                                                                <div className="h-2.5 w-1/2 rounded bg-white/[0.04] mb-3" />
                                                                <div className="h-3 w-3/4 rounded bg-white/[0.04] mb-2" />
                                                                <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Table rows - full rectangle blocks */}
                                                    <div className="flex flex-col gap-2">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <div key={i} className="h-12 w-full rounded-lg border border-white/[0.05] p-3 flex items-center gap-3" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.08}s` }}>
                                                                <div className="size-5 rounded bg-white/[0.04] shrink-0" />
                                                                <div className="h-2.5 rounded bg-white/[0.04]" style={{ width: `${30 + (i * 13) % 50}%` }} />
                                                                <div className="ml-auto h-2 w-16 rounded bg-white/[0.04]" />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Bottom area - full rectangle block */}
                                                    <div className="flex-1 min-h-[80px] rounded-lg border border-white/[0.05] p-4 flex flex-col gap-3" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: 'skeleton-shimmer 2.5s ease-in-out infinite 0.2s' }}>
                                                        <div className="h-3 w-1/3 rounded bg-white/[0.04]" />
                                                        <div className="flex-1 rounded-md bg-white/[0.02] border border-white/[0.03]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Center overlay - status + games button */}
                                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center gap-5"
                                            >
                                                <div className="relative size-14 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                                                    <TerminalSquareIcon size={28} className="text-blue-400 relative z-10" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{TXT.ModulesLoading}</span>
                                                    </div>
                                                    <div className="relative h-[1px] w-48 bg-white/5 rounded-full overflow-hidden mx-auto">
                                                        <motion.div
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                                                            animate={{ x: ['-100%', '100%'] }}
                                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                        />
                                                    </div>
                                                    <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest block">{TXT.DevXInterface}</span>
                                                </div>

                                                <motion.button
                                                    onClick={() => setShowGames(true)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-blue-500/10 backdrop-blur-md border border-blue-500/25 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group mt-3 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                                >
                                                    <Gamepad2Icon size={15} className="text-blue-400/80 group-hover:text-blue-300 transition-colors" />
                                                    <span className="text-[11px] font-black text-blue-400/80 group-hover:text-blue-300 uppercase tracking-widest transition-colors">{TXT.WannaTryGames}</span>
                                                </motion.button>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <FragmentWeb data={activeFragment} projectId={projectId} />
                    )}
                </TabsContent>

                <TabsContent value="code" className="w-full h-full m-0 absolute inset-0 bg-[#080808]">
                    {activeFragment?.files ? (
                        <FileExplorer
                            files={activeFragment.files as { [path: string]: string }}
                            selectedFile={selectedFile}
                            onSelect={setSelectedFile}
                        />
                    ) : Object.keys(emergentFiles).length > 0 ? (
                        <FileExplorer
                            files={emergentFiles}
                            selectedFile={selectedFile}
                            onSelect={setSelectedFile}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col transition-all duration-500">
                            <AnimatePresence mode="wait">
                                {showCodeGames ? (
                                    <motion.div
                                        key="code-games"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col h-full"
                                    >
                                        <div className="shrink-0 py-2 border-b border-white/[0.04] bg-[#0c0c0c] flex items-center justify-center gap-3">
                                            <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{TXT.AnalyzingCode}</span>
                                        </div>
                                        <div className="flex-1 overflow-auto scrollbar-hide">
                                            <GamesDock onClose={() => setShowCodeGames(false)} />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="code-loading-buffer"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, filter: "blur(8px)" }}
                                        className="relative flex h-full flex-col overflow-hidden bg-[#0a0a0a]"
                                    >
                                        <style>{`
                                            @keyframes skeleton-shimmer {
                                                0% { background-position: 200% 0; }
                                                100% { background-position: -200% 0; }
                                            }
                                        `}</style>

                                        {/* ONE big terminal with shimmer blocks inside */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex-1 flex flex-col overflow-hidden pointer-events-none opacity-30 m-3 rounded-xl border border-white/[0.08] bg-[#0c0c0c]"
                                        >
                                            {/* Terminal title bar with 3 dots */}
                                            <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02]">
                                                <div className="size-[9px] rounded-full bg-[#ff5f57]" />
                                                <div className="size-[9px] rounded-full bg-[#febc2e]" />
                                                <div className="size-[9px] rounded-full bg-[#28c840]" />
                                                <div className="ml-4 h-3 w-32 rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: 'skeleton-shimmer 2.5s ease-in-out infinite' }} />
                                                <div className="ml-auto flex gap-2">
                                                    {[48, 60, 40].map((w, k) => (
                                                        <div key={k} className="h-3 rounded-sm" style={{ width: `${w}px`, background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${k * 0.15}s` }} />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Terminal body - all shimmer blocks inside */}
                                            <div className="flex-1 flex overflow-hidden">
                                                {/* Sidebar shimmer - full rectangle blocks */}
                                                <div className="shrink-0 flex flex-col gap-2.5 p-3 border-r border-white/[0.06] bg-white/[0.01]" style={{ width: '200px' }}>
                                                    <div className="h-10 w-full rounded-lg border border-white/[0.05] p-2.5" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: 'skeleton-shimmer 2.5s ease-in-out infinite' }}>
                                                        <div className="h-2 w-3/4 rounded bg-white/[0.04]" />
                                                    </div>
                                                    <div className="h-px w-full bg-white/[0.06]" />
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                        <div key={i} className="h-9 w-full rounded-lg border border-white/[0.05] p-2" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.09}s` }}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-3 rounded bg-white/[0.04] shrink-0" />
                                                                <div className="h-2 rounded bg-white/[0.04]" style={{ width: `${50 + (i * 7) % 40}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="h-px w-full bg-white/[0.06]" />
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={`s2-${i}`} className="h-9 w-full rounded-lg border border-white/[0.05] p-2" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${(i + 8) * 0.09}s` }}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-3 rounded bg-white/[0.04] shrink-0" />
                                                                <div className="h-2 rounded bg-white/[0.04]" style={{ width: `${40 + (i * 11) % 45}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Main content area */}
                                                <div className="flex-1 flex flex-col p-5 gap-4 overflow-hidden">
                                                    {/* Top bar */}
                                                    <div className="flex justify-between items-center gap-4">
                                                        <div className="h-5 w-36 rounded-md" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: 'skeleton-shimmer 2.5s ease-in-out infinite' }} />
                                                        <div className="flex gap-2">
                                                            {[72, 56, 88, 64].map((w, i) => (
                                                                <div key={i} className="h-7 rounded-md" style={{ width: `${w}px`, background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.12}s` }} />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Stats row - 4 rectangle cards */}
                                                    <div className="flex gap-3">
                                                        {[1, 2, 3, 4].map(i => (
                                                            <div key={i} className="flex-1 h-16 rounded-lg border border-white/[0.05] p-3" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.1}s` }}>
                                                                <div className="h-2 w-1/2 rounded bg-white/[0.04] mb-2" />
                                                                <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Cards grid - 3 rectangle blocks */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="h-24 rounded-lg border border-white/[0.05] p-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.15}s` }}>
                                                                <div className="h-2.5 w-1/2 rounded bg-white/[0.04] mb-3" />
                                                                <div className="h-3 w-3/4 rounded bg-white/[0.04] mb-2" />
                                                                <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Table rows - full rectangle blocks */}
                                                    <div className="flex flex-col gap-2">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <div key={i} className="h-12 w-full rounded-lg border border-white/[0.05] p-3 flex items-center gap-3" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: `skeleton-shimmer 2.5s ease-in-out infinite ${i * 0.08}s` }}>
                                                                <div className="size-5 rounded bg-white/[0.04] shrink-0" />
                                                                <div className="h-2.5 rounded bg-white/[0.04]" style={{ width: `${30 + (i * 13) % 50}%` }} />
                                                                <div className="ml-auto h-2 w-16 rounded bg-white/[0.04]" />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Bottom area - full rectangle block */}
                                                    <div className="flex-1 min-h-[80px] rounded-lg border border-white/[0.05] p-4 flex flex-col gap-3" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(100,166,255,0.08) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '400% 100%', animation: 'skeleton-shimmer 2.5s ease-in-out infinite 0.2s' }}>
                                                        <div className="h-3 w-1/3 rounded bg-white/[0.04]" />
                                                        <div className="flex-1 rounded-md bg-white/[0.02] border border-white/[0.03]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Center overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center gap-5"
                                            >
                                                <div className="relative size-14 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
                                                    <CodeIcon size={28} className="text-purple-400 relative z-10" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{TXT.AnalyzingSource}</span>
                                                    </div>
                                                    <div className="relative h-[1px] w-48 bg-white/5 rounded-full overflow-hidden mx-auto">
                                                        <motion.div
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                                                            animate={{ x: ['-100%', '100%'] }}
                                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                        />
                                                    </div>
                                                    <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest block">{TXT.DevXInterface}</span>
                                                </div>

                                                <motion.button
                                                    onClick={() => setShowCodeGames(true)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-purple-500/10 backdrop-blur-md border border-purple-500/25 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group mt-3 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                                >
                                                    <Gamepad2Icon size={15} className="text-purple-400/80 group-hover:text-purple-300 transition-colors" />
                                                    <span className="text-[11px] font-black text-purple-400/80 group-hover:text-purple-300 uppercase tracking-widest transition-colors">{TXT.WannaTryGames}</span>
                                                </motion.button>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </TabsContent>
            </div>

            <div className="shrink-0 h-7 bg-[#0a0a0a] border-t border-white/[0.04] flex items-center px-4 justify-between text-[8px] font-bold text-gray-700 uppercase tracking-widest select-none">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5"><Laptop2Icon size={9} className="text-blue-500/60" /> SYSTEM v2.4.1</span>
                    <span className="text-gray-800">|</span>
                    <span className="flex items-center gap-1.5 animate-pulse text-blue-400">
                        <TerminalSquareIcon size={9} />
                        {activeFragment ? "PROD READY" : "ENGINE SYNCING"}
                    </span>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                    <span>{Object.keys(activeFragment?.files || emergentFiles).length} OBJECTS</span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-500/80">
                        {activeFragment ? "Live" : "Building"}
                    </span>
                </div>
            </div>
        </Tabs>
    );

    return (
        <div className="h-screen w-full overflow-hidden text-foreground bg-black selection:bg-blue-500/30">
            {isMobile ? (
                <div className="flex flex-col h-full w-full relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mobileView}
                            initial={{ opacity: 0, x: mobileView === "chat" ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: mobileView === "chat" ? 20 : -20 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1 w-full min-h-0 overflow-hidden"
                        >
                            {mobileView === "chat" ? LeftPanel : RightPanel}
                        </motion.div>
                    </AnimatePresence>
                    {MobileNavigation}
                </div>
            ) : (
                <div className="flex w-full h-full divide-x divide-white/[0.06]">
                    {/* Console / Chat: Fixed Width 480px */}
                    <div className="w-[480px] shrink-0 h-full relative z-10 shadow-[20px_0_50px_-10px_rgba(0,0,0,0.5)] bg-black">
                        {LeftPanel}
                    </div>

                    {/* Preview / Build: Emergent Workspace */}
                    <div className="flex-1 h-full bg-[#050505] relative">
                        {/* Subtle inner radial glow for the preview area */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />
                        {RightPanel}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectView;
