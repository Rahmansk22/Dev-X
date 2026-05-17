"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  Terminal,
  Activity,
  Cpu,
  Globe,
  ChevronRight,
  Database,
  ShieldCheck,
  Code2
} from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1]);

  const outputNodes = [
    { label: "Auth Pages", color: "text-blue-400" },
    { label: "Dashboard UI", color: "text-blue-400" },
    { label: "Stripe Integration", color: "text-purple-400" },
    { label: "Charts + Analytics", color: "text-emerald-400" },
    { label: "Mobile Responsive", color: "text-blue-400" },
    { label: "Deploy-Ready", color: "text-emerald-400" }
  ];

  return (
    <section ref={containerRef} className="relative w-full py-40 px-6 bg-black overflow-hidden select-none">
      {/* Background Cinematic Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <motion.div
        style={{ opacity, scale }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-32 space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/20 backdrop-blur-xl"
          >
            <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 italic">V4.8.2 Protocol Synthesis</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] italic uppercase">
            Architect <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">Synthesis.</span>
          </h2>
        </div>

        {/* THE MONOLITH UI */}
        <div className="relative bg-[#050505] rounded-[4rem] border border-white/10 shadow-[0_100px_200px_rgba(0,0,0,1)] overflow-hidden backdrop-blur-3xl min-h-[800px] flex flex-col md:flex-row">

          {/* Left Panel: The Intent Engine */}
          <div className="flex-1 p-10 md:p-20 border-b md:border-b-0 md:border-r border-white/5 relative bg-gradient-to-br from-blue-500/5 to-transparent overflow-hidden h-full">
            <div className="relative z-10 space-y-16 h-full flex flex-col">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-4 px-5 py-2 rounded-2xl bg-black/50 border border-white/5">
                  <Terminal className="size-4 text-blue-400" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Architect intent V4.8.2_INPUT</span>
                </div>
                <div className="text-[11px] font-black text-blue-500/50 uppercase tracking-[0.5em] italic">Stream Initiation Active</div>
              </div>

              <div className="space-y-6 flex-grow">
                <blockquote className="text-xl md:text-2xl font-black text-white italic tracking-tighter leading-relaxed brightness-110">
                  "Build me a <span className="text-blue-400">SaaS dashboard</span> with user authentication, billing, and real-time analytics."
                </blockquote>

                <div className="flex flex-wrap gap-4 pt-8">
                  {["Parsing Intent...", "Identifying Modules...", "Architecting Mesh..."].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic"
                    >
                      <ChevronRight className="size-3 text-blue-500" />
                      {step}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">Deconstructing_Intent...</span>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] italic text-glow">Synthesized in 28s</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  />
                </div>
                <div className="flex items-center gap-3 opacity-30">
                  <Activity className="size-3 text-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500">Neural Link Stable</span>
                </div>
              </div>
            </div>
            {/* Visual Texture */}
            <div className="absolute inset-0 bg-neural-grid opacity-10 pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 size-80 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
          </div>

          {/* Right Panel: The Production Node */}
          <div className="flex-1 p-10 md:p-20 relative bg-gradient-to-tl from-purple-500/5 to-transparent flex flex-col justify-between h-full bg-[#080808]">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-20">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Instance preview</div>
                  <div className="text-[9px] font-bold text-gray-700 uppercase tracking-widest leading-none font-mono">V4.8.2_OUTPUT</div>
                </div>
                <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest italic">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Deployment
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {outputNodes.map((node, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 rounded-3xl bg-black/40 border border-white/5 flex items-center gap-4 group/item hover:border-white/20 transition-all cursor-crosshair"
                  >
                    <div className="size-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover/item:border-blue-500/30 transition-all">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </div>
                    <span className={cn("text-[11px] font-black uppercase tracking-widest", node.color)}>{node.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-20 p-10 rounded-[3rem] bg-black/60 border border-white/5 border-dashed overflow-hidden group/card hover:bg-black/80 transition-all">
              <div className="space-y-8">
                <div>
                  <div className="text-[8px] font-black text-blue-500/50 uppercase tracking-[0.5em] mb-2 italic">Provisioned Anycast URL</div>
                  <div className="text-lg font-mono text-white/40 tracking-tighter group-hover/card:text-blue-400 transition-colors">orbit-dash-847.devx.app</div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-1">
                    {[Database, Globe, ShieldCheck, Code2].map((Icon, i) => (
                      <div key={i} className="size-8 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center">
                        <Icon className="size-3 text-gray-700" />
                      </div>
                    ))}
                  </div>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest italic">Node 847 Active</span>
                </div>

                <button className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] italic hover:bg-blue-600 hover:text-white transition-all shadow-2xl relative overflow-hidden group/btn">
                  <span className="relative z-10 flex items-center gap-3">
                    Review Production Node
                    <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Center Connection Core */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none hidden md:flex">
            {/* Center Ring */}
            <div className="size-32 rounded-full border border-white/10 bg-[#050505] flex items-center justify-center shadow-[0_0_100px_rgba(59,130,246,0.3)]">
              <Cpu className="size-10 text-blue-500 opacity-50" />

              {/* Rotating Rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-t-2 border-blue-500/50 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-b-2 border-purple-500/30 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="mt-2 text-center">
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-[1em] italic">Deconstructed Engine Synthesis V4.8.2</span>
        </div>
      </motion.div>
    </section>
  );
};