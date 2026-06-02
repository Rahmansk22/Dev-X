"use client";

import React, { useRef, useState, useEffect } from "react";
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
  onUpgrade,
  loadingPlan
}: {
  plan: typeof PLANS[number];
  index: number;
  onUpgrade: (planId: string) => void;
  loadingPlan: string | null;
}) {
  const isPopular = plan.highlight;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className="relative flex flex-col h-full"
    >
      <div
        className={cn(
          "relative flex-1 flex flex-col rounded-[2rem] border p-8 transition-colors duration-300 ease-in-out backdrop-blur-xl",
          isPopular 
            ? "border-indigo-500/50 bg-indigo-500/[0.03] shadow-[0_0_40px_rgba(99,102,241,0.1)] hover:border-indigo-500/70"
            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
        )}
      >
        {/* Ambient Glow for Popular */}
        {isPopular && (
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        )}
        
        {isPopular && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500 border border-indigo-400 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg shadow-indigo-500/30">
              <Crown className="size-3" />
              Most Popular
            </span>
          </div>
        )}

        {/* Plan Header */}
        <div className="mb-6 flex flex-col pt-2">
          <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-3">{plan.name}</h3>
          <p className="text-sm font-medium text-zinc-400 leading-snug line-clamp-3">{plan.description}</p>
        </div>

        {/* Pricing */}
        <div className="mb-8">
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-bold text-white tracking-tighter">{plan.price}</span>
            <span className="text-sm font-medium text-zinc-500">{plan.period}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mb-10 mt-auto">
          <button 
            onClick={() => onUpgrade(plan.id)}
            disabled={loadingPlan === plan.id}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 flex items-center justify-center gap-2",
              isPopular 
                ? "bg-white text-zinc-900 hover:bg-zinc-200 focus:ring-white/50 shadow-lg shadow-white/10" 
                : "bg-white/10 text-white border border-white/10 hover:bg-white/15 focus:ring-white/30"
            )}
          >
            {loadingPlan === plan.id ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <span>Upgrade to {plan.name}</span>
            )}
          </button>
        </div>

        {/* Features list */}
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold text-zinc-200">What's included</p>
          <ul className="space-y-3.5">
            {plan.features.map((feature, i) => (
              <li key={i} className={cn(
                "flex items-start gap-3 text-sm",
                feature.included ? "text-zinc-300" : "text-zinc-600 line-through"
              )}>
                <div className={cn(
                  "size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  feature.included ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-zinc-700"
                )}>
                  {feature.included ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
                </div>
                <span className="leading-snug">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}


export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleUpgrade = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: data.amount,
        currency: data.currency,
        name: "Dev X",
        description: `Upgrade to ${planId}`,
        order_id: data.orderId,
        handler: function (response: any) {
          alert("Payment Successful!");
          router.refresh();
        },
        theme: {
          color: "#8b5cf6",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Failed to initialize payment.");
    } finally {
      setLoadingPlan(null);
    }
  };

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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan as any}
              index={i}
              onUpgrade={handleUpgrade}
              loadingPlan={loadingPlan}
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
      </main>
    </div>
  );
}
