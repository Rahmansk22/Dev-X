"use client";

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Terminal, CheckCircle2, Zap, Activity, Cpu, Globe, Boxes } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const TiltContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    return (
        <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                x.set(e.clientX / rect.width - 0.5);
                y.set(e.clientY / rect.height - 0.5);
            }}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const ProcessShowcase = () => {
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        {
            cmd: "PROMPT → V4.8.2_INPUT",
            logs: [
                "App Engine: Architect intent active",
                "Input Stream: \"Build me a SaaS dashboard with user authentication, billing, and real-time analytics.\"",
                "DECONSTRUCTING_INTENT...",
                "✓ ALL_MODULES_IDENTIFIED",
                "✓ SYNTHESIZED IN 28S"
            ],
            status: "Neural Link Stable",
            details: "INTENT_SYNTHESIS_COMPLETE"
        },
        {
            cmd: "V4.8.2_OUTPUT → PRODUCTION",
            logs: [
                "Instance preview ready at node_sh.847",
                "Live Deployment: Auth, Dashboard, Stripe, Charts",
                "Real-time Analytics + Mobile Responsive",
                "Provisioned Anycast URL:",
                "→ orbit-dash-847.devx.app",
                "REVIEW PRODUCTION NODE"
            ],
            status: "✓ Deploy-Ready",
            details: "LIVE_ANYCAST_PROVISIONED"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative w-full max-w-7xl mx-auto py-32 px-6 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                {/* Left Side: The Narrative */}
                <div className="space-y-12 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-2xl ring-1 ring-blue-500/20"
                    >
                        <Terminal className="size-4 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 italic">Core Implementation Protocol</span>
                    </motion.div>

                    <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] italic uppercase">
                        From Shell <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-glow-purple">To Global Mesh.</span>
                    </h2>

                    <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-xl italic">
                        DevX orchestrates your entire architecture with sub-second precision. No legacy friction. Just deterministic deployment.
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                        {[
                            { label: "Synthesis Rate", value: "847ms", icon: Zap },
                            { label: "Mesh Nodes", value: "100+", icon: Globe }
                        ].map((stat, i) => (
                            <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-4 hover:border-blue-500/30 transition-colors group">
                                <stat.icon className="size-5 text-gray-700 group-hover:text-blue-400 transition-colors" />
                                <div>
                                    <div className="text-3xl font-black text-white italic tracking-tighter">{stat.value}</div>
                                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-tight">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: 3D Terminal Simulation */}
                <div className="relative perspective-2000">
                    {/* Ambient Glows */}
                    <div className="absolute -inset-20 bg-blue-600/10 blur-[150px] rounded-full opacity-30 animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neural-grid opacity-20 pointer-events-none" />

                    <TiltContainer className="relative">
                        {/* Floating HUD Labels */}
                        <motion.div
                            style={{ transform: "translateZ(100px)" }}
                            className="absolute -top-12 -right-8 p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-3xl z-20"
                        >
                            <div className="flex items-center gap-3">
                                <Activity className="size-3 text-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Synthesis Active</span>
                            </div>
                        </motion.div>

                        <motion.div
                            style={{ transform: "translateZ(60px)" }}
                            className="absolute -bottom-10 -left-6 p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-3xl z-20"
                        >
                            <div className="flex items-center gap-3">
                                <Boxes className="size-3 text-purple-400" />
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">Module_v4.2.0</span>
                            </div>
                        </motion.div>

                        {/* Main Terminal Container */}
                        <div className="relative bg-[#050505] rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-3xl" style={{ transform: "translateZ(20px)" }}>
                            {/* Inner Glass Polish */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                            {/* Terminal Header */}
                            <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] relative z-10">
                                <div className="flex gap-2">
                                    <div className="size-3 rounded-full bg-red-500/20 border border-red-500/30" />
                                    <div className="size-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
                                    <div className="size-3 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                                </div>
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic group-hover:text-blue-400 transition-colors">Forge_System.sh</div>
                                <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] text-gray-600 font-bold uppercase tracking-widest">v4.0 Alpha</div>
                            </div>

                            {/* Terminal Body */}
                            <div className="p-10 font-mono text-[14px] min-h-[440px] relative z-10 flex flex-col justify-between">
                                <div className="space-y-10">
                                    {steps.map((step, idx) => (activeStep === idx && (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-blue-500 font-black text-lg">›</div>
                                                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-white font-medium italic select-none">
                                                    {step.cmd}
                                                </div>
                                            </div>

                                            <div className="space-y-3 pl-8 border-l-2 border-white/5">
                                                {step.logs.map((log, lIdx) => (
                                                    <motion.div
                                                        key={lIdx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.5 + (lIdx * 0.15) }}
                                                        className="flex items-center gap-4 text-gray-500 group/log"
                                                    >
                                                        {log.startsWith("✓") || log.startsWith("→") ? (
                                                            <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                        ) : (
                                                            <div className="size-1 rounded-full bg-gray-800" />
                                                        )}
                                                        <span className="group-hover/log:text-gray-300 transition-colors">{log.startsWith("✓") || log.startsWith("→") ? log.split(' ').slice(1).join(' ') : log}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )))}
                                </div>

                                {/* Terminal Footer Status */}
                                <div className="space-y-6 pt-12">
                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <Cpu className="size-4 text-blue-500" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-black text-white uppercase tracking-widest">{steps[activeStep].status}</div>
                                                <div className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.2em]">{steps[activeStep].details}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest leading-none">Node_20.x_LTS</div>
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Synced</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TiltContainer>
                </div>
            </div>
        </section>
    );
};

export default ProcessShowcase;
