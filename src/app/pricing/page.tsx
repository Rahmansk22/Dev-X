"use client";

import React, { useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Navbar } from "@/modules/home/ui/components/navbar";
import { motion, useMotionTemplate, useScroll, useTransform, useMotionValue } from "framer-motion";
import { Check, Sparkles, Zap, Shield, Crown, ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "starter",
    name: "Architect",
    price: "$19",
    period: "/mo",
    description: "Ideal for solo engineers prototyping complex structures.",
    features: [
      { text: "10 Synthetic Projects", included: true },
      { text: "Turbo Orchestration", included: true },
      { text: "Basic E2B Sandbox Access", included: true },
      { text: "Standard Token Limits", included: true },
      { text: "Community Support", included: true },
      { text: "Custom Domains", included: false },
      { text: "Priority Multi-Agent", included: false },
    ],
    highlight: false,
    color: "from-blue-500/20 to-indigo-600/20",
    glow: "bg-blue-500/20",
    icon: <Zap className="h-6 w-6 text-blue-400" />,
  },
  {
    id: "growth",
    name: "Developer Pro",
    price: "$49",
    period: "/mo",
    description: "The gold standard for production-grade agentic development.",
    features: [
      { text: "Unlimited Projects", included: true },
      { text: "Pro Multi-Agent Orchestration", included: true },
      { text: "Pre-warmed Sandbox Pools", included: true },
      { text: "Claude 3.5 & GPT-4o Pro", included: true },
      { text: "1-Click Global Deploy", included: true },
      { text: "24/7 Synthesis Support", included: true },
      { text: "Private Registry Export", included: false },
    ],
    highlight: true,
    color: "from-purple-600/30 to-blue-600/30",
    glow: "bg-purple-500/30",
    icon: <Crown className="h-6 w-6 text-purple-400" />,
  },
  {
    id: "scale",
    name: "Engineering Suite",
    price: "$149",
    period: "/mo",
    description: "Maximum bandwidth for fast-moving product teams.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "High-Priority Build Queue", included: true },
      { text: "Custom Model Fine-tuning", included: true },
      { text: "Dedicated Synthesis Nodes", included: true },
      { text: "SOC2 Compliance Suite", included: true },
      { text: "White-label Deployments", included: true },
      { text: "Unlimited Sandbox Duration", included: true },
    ],
    highlight: false,
    color: "from-amber-600/20 to-orange-600/20",
    glow: "bg-amber-500/20",
    icon: <Sparkles className="h-6 w-6 text-amber-400" />,
  },
];

function PlanCard({
  plan,
  index,
}: {
  plan: typeof PLANS[number];
  index: number;
}) {
  const isPopular = plan.highlight;
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width;
    const y = (clientY - top) / height;
    mouseX.set(x);
    mouseY.set(y);
  }

  const rotateX = useTransform(mouseY, [0, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [0, 1], [-15, 15]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative perspective-[1500px]"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative h-[750px] w-full rounded-[2.5rem] border p-7 transition-all duration-300 ease-out backdrop-blur-2xl overflow-hidden group",
          isPopular 
            ? "border-purple-500/50 bg-linear-to-b from-purple-500/10 to-zinc-950 shadow-[0_40px_100px_rgba(168,85,247,0.15)] ring-1 ring-white/10"
            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] shadow-2xl"
        )}
      >
        {/* Ambient Glow */}
        <div className={cn("absolute -top-24 -right-24 size-64 blur-[100px] pointer-events-none opacity-20", plan.glow)} />
        
        {isPopular && (
          <div className="absolute top-6 right-6 transform-[translateZ(50px)]">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-[9px] font-black text-purple-400 uppercase tracking-widest shadow-lg">
              <Crown className="size-3" />
              <span>Recommended</span>
            </div>
          </div>
        )}

        {/* Plan Header */}
        <div className="mb-6 transform-[translateZ(60px)]">
          <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/5">
            {plan.icon}
          </div>
          <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">{plan.name}</h3>
          <p className="text-[11px] font-medium text-gray-500 leading-snug line-clamp-2">{plan.description}</p>
        </div>

        {/* Pricing */}
        <div className="mb-6 transform-[translateZ(70px)]">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{plan.price}</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{plan.period}</span>
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-4 transform-[translateZ(40px)] flex-1 pr-2">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2">Architecture Suite</p>
          <ul className="space-y-3">
            {plan.features.map((feature, i) => (
              <li key={i} className={cn(
                "flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-wide",
                feature.included ? "text-gray-300" : "text-gray-700 decoration-gray-800 line-through"
              )}>
                <div className={cn(
                  "size-4 rounded-full flex items-center justify-center shrink-0 border",
                  feature.included ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-white/5 border-white/10 text-gray-700"
                )}>
                  {feature.included ? <Check className="size-2.5" /> : <X className="size-2" />}
                </div>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 transform-[translateZ(80px)]">
          <button 
            disabled
            className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed"
          >
            <span className="relative z-10">Coming Soon</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

class BillingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Pricing render failed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center shadow-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-amber-400">Billing Configuration Required</h2>
          <p className="mt-3 text-sm text-zinc-300">
            Clerk Billing is currently disabled or unconfigured in this environment.
          </p>
          <div className="mt-6">
            <a
              href="https://dashboard.clerk.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-amber-400"
            >
              Configure Clerk Dashboard
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function PricingPage() {
  const router = useRouter();
  const planIds = {
    starter: process.env.NEXT_PUBLIC_CLERK_PLAN_STARTER ?? "",
    growth: process.env.NEXT_PUBLIC_CLERK_PLAN_GROWTH ?? "",
    scale: process.env.NEXT_PUBLIC_CLERK_PLAN_SCALE ?? "",
    enterprise: process.env.NEXT_PUBLIC_CLERK_PLAN_ENTERPRISE ?? "",
  };

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          style={{ y }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[20%] -left-[10%] h-100 w-100 rounded-full bg-blue-500/10 blur-[100px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[30%] -right-[10%] h-100 w-100 rounded-full bg-purple-500/10 blur-[100px]" 
          />
        </motion.div>
        {/* Grid pattern */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-[url('/assets/grid-white.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" 
        />
      </div>

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-36 lg:pt-48">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer shadow-xl backdrop-blur-xl"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Synthesis</span>
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Upgrade Your Architecture
            </p>
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-linear-to-br from-white via-white to-zinc-600 drop-shadow-sm leading-[1.1]">
            Limitless building,<br/>zero boundaries.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400 md:text-base font-medium">
            Join the waitlist for early access to our premium tiers. The future of synthetic code generation and deployment starts here.
          </p>
        </motion.div>

        {/* Removed SignedIn/SignedOut wrappers here to make the pricing grid visible to everyone */}
        <BillingErrorBoundary>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {PLANS.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan as any}
                index={i}
              />
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 text-center flex flex-col items-center justify-center gap-4"
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-zinc-500" />
              <p className="text-sm font-medium text-zinc-400">Enterprise grade security. End-To-End Encrypted.</p>
            </div>
            <p className="text-xs text-zinc-600 max-w-md mx-auto">
              Need a custom plan? Our architects can design a specific node cluster tailored to your compute and model requirements. Reach out to our synthesis team.
            </p>
          </motion.div>
        </BillingErrorBoundary>
      </main>
    </div>
  );
}
