"use client";

import { useForm } from "react-hook-form";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { ArrowUpIcon, Loader2Icon, Cpu, Zap, Activity, Brain } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useClerk, useAuth } from "@clerk/nextjs";
import { SiOpenai, SiMeta, SiAnthropic } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { createPortal } from "react-dom";
import { TypingPrompt } from "./TypingPrompt";
import LockIcon from "@/components/LockIcon";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { CheckIcon } from "lucide-react";
import { UpgradeModal } from "@/components/upgrade-modal";

// Real X Logo Component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298l13.313 17.404z" />
  </svg>
);

type UsageStatus = {
  remainingPoints: number;
  msBeforeNext: number;
};

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message cannot be empty" })
    .max(5000, { message: "Message cannot be longer than 5000 characters" }),
});

type Model = {
  name: string;
  label: string;
  icon: React.ReactNode | null;
  isPro: boolean;
};

export const ProjectForm = () => {
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const router = useRouter();
  const queryClient = useQueryClient();
  const clerk = useClerk();
  const { has, userId } = useAuth();
  const hasProAccess = has?.({ plan: "pro" }) ?? false;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
    mode: "onChange",
  });

  const { data: usage } = useQuery(
    userId
      ? trpcAny.usage.status.queryOptions()
      : {
        queryKey: ["usage", "status", "disabled"],
        queryFn: async () => undefined,
        enabled: false,
      }
  ) as { data: UsageStatus | undefined };

  const [optimisticPending, setOptimisticPending] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);
  const createProject = useMutation(trpcAny.projects.create.mutationOptions());
  const [isFocused, setIsFocused] = useState(false);
  const [generationMode, setGenerationMode] = useState<"turbo" | "pro">("turbo");
  const [showModeHint, setShowModeHint] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isPending = createProject.isPending || optimisticPending;
  const isButtonDisabled = isPending || !form.formState.isValid;

  const [selectedModel, setSelectedModel] = useState<Model>({
    name: "grok",
    label: "Grok 4.1 Fast",
    icon: <XIcon className="size-4" />,
    isPro: false,
  });

  const models: Model[] = [
    { name: "grok", label: "Grok 4.1 Fast", icon: <XIcon className="size-3" />, isPro: false },
    { name: "geminiFlash", label: "Gemini 2.0 Flash", icon: <FcGoogle />, isPro: true },
    { name: "gpt4o", label: "GPT-4o", icon: <SiOpenai className="text-[#7b61ff]" />, isPro: true },
    { name: "claude37", label: "Claude 3.7 Sonnet", icon: <SiAnthropic className="text-[#fbbf24]" />, isPro: true },
    { name: "deepseekR1", label: "DeepSeek R1", icon: <Brain className="text-[#10a37f]" />, isPro: true },
    { name: "o1", label: "O1", icon: <SiOpenai className="text-[#000000]" />, isPro: true },
  ];

  type SubmitData = z.infer<typeof formSchema> & { model: "grok" | "geminiFlash" | "gpt4o" | "claude37" | "deepseekR1" | "o1" };

  useEffect(() => {
    setShowModeHint(true);
    const timer = setTimeout(() => setShowModeHint(false), 2000);
    return () => clearTimeout(timer);
  }, [generationMode]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    if (!userId) {
      toast.error('Please sign in to create a project');
      clerk.openSignIn();
      return;
    }
    setOptimisticValue(values.value);
    setOptimisticPending(true);
    form.setValue("value", "");
    const modelToApi: Record<string, SubmitData["model"]> = {
      grok: "grok",
      geminiFlash: "geminiFlash",
      gpt4o: "gpt4o",
      claude37: "claude37",
      deepseekR1: "deepseekR1",
      o1: "o1",
    };
    const data: SubmitData & { mode?: string } = {
      ...values,
      model: modelToApi[selectedModel.name] ?? "grok",
      mode: generationMode,
    };
    (createProject as any).mutate(data, {
      onSuccess: (data: { id: string }) => {
        setOptimisticPending(false);
        setOptimisticValue(null);
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success('Project created! Redirecting...');
        setTimeout(() => {
          router.push(`/projects/${data.id}`);
        }, 500);
        queryClient.invalidateQueries({ queryKey: ["usage"] });
      },
      onError: (error: any) => {
        setOptimisticPending(false);
        if (optimisticValue !== null) {
          form.setValue("value", optimisticValue);
          setOptimisticValue(null);
        }
        toast.error(error?.message || 'Failed to create project');
        if (error?.data?.code === "UNAUTHORIZED") clerk.openSignIn();
        if (error?.data?.code === "TOO_MANY_REQUESTS") router.push("/pricing");
      },
    });
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const buttonRef = useRef<HTMLDivElement>(null);
  // Removed manual portal logic in favor of Radix DropdownMenu anchoring

  return (
    <Form {...form}>
      <section className="flex flex-col items-center w-full perspective-[2000px]">
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl relative group"
        >
          {/* Multi-layered Ambient Glow */}
          <div className={cn(
            "absolute -inset-8 bg-linear-to-r blur-3xl transition-all duration-1000 opacity-20 group-hover:opacity-40",
            isFocused
              ? "from-blue-500/30 via-cyan-500/30 to-emerald-500/30"
              : "from-blue-600/20 via-indigo-600/20 to-transparent"
          )} />

          <div className={cn(
            "relative z-10 w-full p-px bg-linear-to-b from-white/20 via-white/5 to-transparent backdrop-blur-3xl transition-all duration-500 rounded-[2.5rem] shadow-2xl",
            isFocused ? "border-blue-500/50 shadow-blue-500/20" : "border-white/10"
          )}>
            <div className="bg-[#050505] w-full rounded-[2.4rem] overflow-hidden relative">
              {/* Scanline / Industrial Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[100%_4px] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-40 pointer-events-none" />

              <form onSubmit={form.handleSubmit(onSubmit)} className="relative z-10 p-2 space-y-2">
                <div className="bg-black/40 rounded-3xl p-4 md:p-6 md:px-8 space-y-3">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <div className="relative" style={{ transform: "translateZ(30px)" }}>
                        <TextareaAutosize
                          {...field}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          disabled={isPending}
                          minRows={3}
                          maxRows={12}
                          placeholder=""
                          className="w-full bg-transparent text-left text-sm md:text-base font-mono text-white/90 placeholder:text-gray-700 focus:ring-0 outline-none resize-none transition-all leading-relaxed tracking-wide p-0 hide-scrollbar"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)(e);
                            }
                          }}
                        />
                        {(!field.value || field.value.length === 0) && (
                          <div className="pointer-events-none absolute left-0 top-0 w-full opacity-40">
                            <TypingPrompt />
                          </div>
                        )}

                        {/* Status bar */}
                        <div className="absolute -bottom-4 left-0 w-full flex items-center gap-4 opacity-20 group-hover:opacity-60 transition-opacity">
                          <div className="h-0.5 flex-1 bg-white/5 overflow-hidden rounded-full">
                            <motion.div
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="h-full w-20 bg-linear-to-r from-transparent via-blue-400 to-transparent"
                            />
                          </div>
                          <span className="text-[9px] font-medium text-gray-600 uppercase tracking-[0.2em]">Neural Link Stable</span>
                        </div>
                      </div>
                    )}
                  />

                  <div className="flex flex-wrap items-center justify-between pt-6 gap-y-4 gap-x-2" style={{ transform: "translateZ(40px)" }}>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      {/* Model Selector - Anchored Select */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div
                            ref={buttonRef}
                            className="group/btn flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer shadow-xl backdrop-blur-2xl outline-none active:scale-95"
                          >
                            <div className="flex items-center gap-2">
                              <div className="size-4 flex items-center justify-center opacity-70 group-hover/btn:opacity-100 transition-opacity">
                                {selectedModel.name === "grok" ? <XIcon className="size-3" /> : selectedModel.icon || <Cpu className="size-3" />}
                              </div>
                              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{selectedModel.label}</span>
                            </div>
                            <div className="size-1 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)] group-hover/btn:scale-125 transition-transform" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="start" 
                          side="top"
                          className="rounded-3xl border border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.9)] overflow-hidden min-w-75 z-9999 bg-[#0a0a0a]/98 backdrop-blur-3xl p-2"
                        >
                          <DropdownMenuLabel className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                             <Cpu className="size-3 text-blue-400" />
                             Select Model
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          <div className="p-1 space-y-1 max-h-[280px] overflow-y-auto hide-scrollbar">
                            {models.map((model) => {
                              const disabled = model.isPro && !hasProAccess;
                              const isSelected = selectedModel.name === model.name;
                              return (
                                <DropdownMenuItem
                                  key={model.name}
                                  onSelect={() => {
                                    if (disabled) {
                                      setIsUpgradeModalOpen(true);
                                    } else {
                                      setSelectedModel(model);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-all cursor-pointer focus:bg-white/5 focus:text-white outline-none",
                                    isSelected ? "bg-white/5 text-white" : "text-gray-300",
                                    disabled && "opacity-60"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                      {model.name === "grok" ? <XIcon className="size-4" /> : model.icon || <Cpu className="size-4" />}
                                    </div>
                                    <div className="text-left">
                                      <div className={cn("text-[11px] font-black uppercase tracking-tight", isSelected ? "text-blue-400" : "")}>{model.label}</div>
                                      <div className="text-[9px] text-gray-700 font-bold tracking-widest">Architecture Optimized</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {model.isPro && <LockIcon className="size-3 text-blue-400" />}
                                    {isSelected && <CheckIcon className="size-3.5 text-blue-400" />}
                                  </div>
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Mode Toggle */}
                      <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl shadow-xl">
                        <button
                          type="button"
                          onClick={() => setGenerationMode("turbo")}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all",
                            generationMode === "turbo"
                              ? "bg-white/10 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.2)]"
                              : "text-gray-500 hover:text-gray-300"
                          )}
                        >
                          <Zap className={cn("size-3", generationMode === "turbo" ? "fill-blue-400" : "")} />
                          <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Turbo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGenerationMode("pro")}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all",
                            generationMode === "pro"
                              ? "bg-white/10 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                              : "text-gray-500 hover:text-gray-300"
                          )}
                        >
                          <Brain className={cn("size-3", generationMode === "pro" ? "fill-purple-400" : "")} />
                          <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Pro</span>
                        </button>
                      </div>

                      {/* Mode Insights - Temporal Pill */}
                      <div className="absolute bottom-full left-0 mb-2 pointer-events-none">
                        <AnimatePresence>
                          {showModeHint && (
                            <motion.div
                              key={generationMode}
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -5, scale: 0.95 }}
                              className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-2xl"
                            >
                              <div className={cn(
                                "size-1.5 rounded-full animate-pulse",
                                generationMode === "turbo" ? "bg-blue-400" : "bg-purple-400"
                              )} />
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                                {generationMode === "turbo" ? "Turbo: Fast & Simple Apps" : "Pro: Complex Features"}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Secondary metrics */}
                      <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/2 border border-white/5 opacity-50">
                        <Activity className="size-3 text-emerald-400" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sub-40ms Latency</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end flex-1 sm:flex-none gap-6 ml-auto">
                      <div className="hidden md:flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">
                        <Zap className="size-3" />
                        CMD + ENTER TO SYNTHESIZE
                      </div>

                      <Button
                        disabled={isButtonDisabled}
                        className={cn(
                          "h-12 w-12 rounded-xl transition-all flex items-center justify-center relative group/submit overflow-hidden",
                          isButtonDisabled
                            ? "bg-white/5 text-gray-800 cursor-not-allowed"
                            : "bg-white text-black hover:bg-blue-600 hover:text-white shadow-xl"
                        )
                        }
                      >
                        {isPending ? (
                          <Loader2Icon className="animate-spin size-5" />
                        ) : (
                          <>
                            <ArrowUpIcon className="size-6 font-black group-hover/submit:-translate-y-0.5 transition-transform relative z-10" />
                            <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 translate-y-full group-hover/submit:translate-y-0 transition-transform duration-300 pointer-events-none" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

        </motion.div>
      </section>

      {/* DropdownMenu handles its own portal rendering */}
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />
    </Form>
  );
};

export default ProjectForm;

