"use client";

import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { ArrowUpIcon, Loader2Icon, Cpu, Zap, Brain } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Usage } from "./usage";
import { useAuth, useClerk, SignInButton } from "@clerk/nextjs";
import { createPortal } from "react-dom";
import { SiOpenai, SiMeta, SiAnthropic } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { useStageStatus } from "@/hooks/use-stage-status";
import { StageIndicator } from "@/components/stage-indicator";
// import { TypingPrompt } from "@/modules/home/ui/components/TypingPrompt";
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

const GlassEffect: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={cn("glass", "relative overflow-hidden rounded-3xl", className)}>
    <div className="relative z-20">{children}</div>
  </div>
);

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message cannot be empty" })
    .max(5000, { message: "Message cannot be longer than 5000 characters" }),
});

// 1. Core Types & Constants (Defined at top to avoid ReferenceErrors)
type Model = {
  name: string;
  label: string;
  icon: React.ReactNode | null;
  isPro: boolean;
};

type UsageStatus = {
  remainingPoints: number;
  msBeforeNext: number;
  resetDate: number;
};

const MESSAGE_MODELS: Model[] = [
  { name: "grok", label: "Grok 4.1 Fast", icon: <XIcon className="size-3" />, isPro: false },
  { name: "geminiFlash", label: "Gemini 2.0 Flash", icon: <FcGoogle />, isPro: true },
  { name: "gpt4o", label: "GPT-4o", icon: <SiOpenai className="text-[#7b61ff]" />, isPro: true },
  { name: "claude37", label: "Claude 3.7 Sonnet", icon: <SiAnthropic className="text-[#fbbf24]" />, isPro: true },
  { name: "deepseekR1", label: "DeepSeek R1", icon: <Brain className="text-[#10a37f]" />, isPro: true },
  { name: "o1", label: "O1", icon: <SiOpenai className="text-[#000000]" />, isPro: true },
];

interface Props {
  projectId: string;
}

export const MessageForm = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const clerk = useClerk();
  const { has, isSignedIn } = useAuth();
  const trpcAny = trpc as any;
  const { setStage1Status, setStage2Status, setStage3Status, resetStages, stage1Status, stage2Status, stage3Status } = useStageStatus();

  const hasProAccess = has?.({ plan: "pro" }) ?? false;

  // 1. ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
    mode: "onChange",
  });

  const { data: usage } = useQuery(
    isSignedIn
      ? trpcAny.usage.status.queryOptions()
      : {
        queryKey: ["usage", "status", "disabled"],
        queryFn: async () => undefined,
        enabled: false,
      }
  ) as { data: UsageStatus | undefined };

  const createMessage = useMutation(
    isSignedIn
      ? trpcAny.messages.create.mutationOptions()
      : {
        mutationFn: async () => { throw new Error("Not authenticated"); },
      }
  );

  const [mounted, setMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>(MESSAGE_MODELS[0]);
  const [generationMode, setGenerationMode] = useState<"turbo" | "pro">("turbo");
  const [showModeHint, setShowModeHint] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowModeHint(true);
    const timer = setTimeout(() => setShowModeHint(false), 2000);
    return () => clearTimeout(timer);
  }, [generationMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPending = createMessage.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;

  // Removed manual coordinate calculation in favor of Radix DropdownMenu anchoring

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const data = {
      value: values.value,
      projectId,
      model: selectedModel.name as any,
      mode: generationMode,
    };

    // Start the generation stages
    setStage1Status("running");
    setStage2Status("idle");
    setStage3Status("idle");

    (createMessage as any).mutate(data, {
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries({ queryKey: [['messages', 'getMany']] });
        queryClient.invalidateQueries({ queryKey: [['usage', 'status']] });
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to create message");
        if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
      },
    });
  };

  if (!mounted) {
    return (
      <div className="w-full h-[150px] animate-pulse bg-white/5 rounded-2xl border border-white/10" />
    );
  }

  return (
    <Form {...form}>
      <section className="flex flex-col items-center w-full relative z-30">
        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 text-lg font-semibold text-foreground">Please sign in to chat about this project.</div>
            <SignInButton mode="modal">
              <Button className="px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all">Sign In</Button>
            </SignInButton>
          </div>
        ) : (
          <>
            {usage ? (
              <div className="mb-1 w-full">
                <Usage
                  points={usage.remainingPoints}
                  msBeforeNext={usage.msBeforeNext}
                />
              </div>
            ) : null}
            <div className="w-full relative">
              <div className={cn(
                "absolute -inset-2 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl transition-opacity duration-700",
                isFocused ? "opacity-100" : "opacity-0"
              )} />

              <div className={cn(
                "relative z-10 w-full p-0.5 rounded-2xl bg-linear-to-b from-white/5 via-white/2 to-transparent backdrop-blur-3xl border border-white/10 transition-all duration-500",
                isFocused && "border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
              )}>
                <div className="bg-[#050505]/90 w-full rounded-2xl px-4 py-3 text-left">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-3">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <div className="relative">
                          <TextareaAutosize
                            {...field}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            disabled={isPending}
                            minRows={2}
                            maxRows={8}
                            placeholder=""
                            className="w-full bg-transparent text-white placeholder:text-gray-600 focus:ring-0 outline-none resize-none transition-colors leading-relaxed hide-scrollbar"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)(e);
                              }
                            }}
                          />
                        </div>
                      )}
                    />

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div
                              ref={buttonRef}
                              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer outline-none active:scale-95"
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-4 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                                  {selectedModel.name === "grok" ? <XIcon className="size-3" /> : selectedModel.icon || <Cpu className="size-3" />}
                                </div>
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{selectedModel.label}</span>
                              </div>
                              <div className="size-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="start" 
                            className="rounded-3xl border border-white/10 shadow-2xl overflow-hidden min-w-[280px] z-[9999] bg-[#0a0a0a]/95 backdrop-blur-2xl p-2"
                          >
                            <DropdownMenuLabel className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                              Select Model
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5 mx-2" />
                            <div className="space-y-1 max-h-[280px] overflow-y-auto hide-scrollbar">
                              {MESSAGE_MODELS.map((model) => {
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
                                        <div className="text-sm font-bold">{model.label}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Latency: Ultra Low</div>
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
                        <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/5">
                          <button
                            type="button"
                            onClick={() => setGenerationMode("turbo")}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all",
                              generationMode === "turbo" 
                                ? "bg-white/10 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.2)]" 
                                : "text-gray-500 hover:text-gray-300"
                            )}
                          >
                            <Zap className={cn("size-3", generationMode === "turbo" ? "fill-blue-400" : "")} />
                            <span className="text-[9px] font-bold uppercase tracking-tight">Turbo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenerationMode("pro")}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all",
                              generationMode === "pro" 
                                ? "bg-white/10 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]" 
                                : "text-gray-500 hover:text-gray-300"
                            )}
                          >
                            <Brain className={cn("size-3", generationMode === "pro" ? "fill-purple-400" : "")} />
                            <span className="text-[9px] font-bold uppercase tracking-tight">Pro</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">


                        <Button
                          disabled={isButtonDisabled}
                          type="submit"
                          className={cn(
                            "h-9 w-9 rounded-xl transition-all flex items-center justify-center",
                            isButtonDisabled
                              ? "bg-white/5 text-gray-700 cursor-not-allowed"
                              : "bg-white text-black hover:bg-blue-400 hover:text-white shadow-[0_10px_20px_rgba(255,255,255,0.05)] hover:shadow-blue-500/40"
                          )}
                        >
                          {isPending ? (
                            <Loader2Icon className="animate-spin size-4" />
                          ) : (
                            <ArrowUpIcon className="size-4 font-bold" />
                          )}
                        </Button>
                      </div>
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
                  </form>
                </div>
              </div>
            </div>
            {/* DropdownMenu handles its own portal rendering */}
          </>
        )}
      </section>

      <style jsx global>{`
        textarea::-webkit-scrollbar { display: none; width: 0 !important; }
        textarea { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      `}</style>
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />
    </Form>
  );
};

export default MessageForm;
