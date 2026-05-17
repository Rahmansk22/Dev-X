"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import { Shield, Layers, Cpu, Brain, Globe, Zap, Database, Lock, Key, Eye, Terminal, Activity, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const TerminalCard = ({ feature, idx }: { feature: any, idx: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

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

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.8 }}
            viewport={{ once: true }}
            className="group relative h-[450px] perspective-2000"
        >
            {/* Terminal Window */}
            <div className="absolute inset-0 bg-[#050505] rounded-[2.5rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl group-hover:border-blue-500/30 transition-all duration-700">
                {/* Header */}
                <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex gap-2">
                        <div className="size-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                        <div className="size-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                        <div className="size-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                    </div>
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] italic group-hover:text-blue-400 transition-colors">
                        {feature.badge}
                    </div>
                </div>

                {/* Body */}
                <div className="p-10 font-mono space-y-8 h-full flex flex-col justify-between" style={{ transform: "translateZ(30px)" }}>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-blue-400">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{feature.title}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-3 text-emerald-500">
                                <span className="opacity-40">01</span>
                                <span className="text-white brightness-125 font-black uppercase italic tracking-widest text-xs">INITIATING_ENGINE...</span>
                            </div>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed italic border-l-2 border-white/5 pl-6">
                                {feature.desc}
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3">
                            <Activity className="size-3 text-blue-500" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">STABLE_OS</span>
                        </div>
                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest leading-none">V4.8.2_CORE</span>
                    </div>
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-neural-grid opacity-10 pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
            </div>

            {/* Back Elements shadow/depth */}
            <div className="absolute inset-0 bg-blue-600/5 blur-[100px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};

export function FeatureShowcase() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const features = [
        {
            icon: <Zap className="size-6" />,
            title: "Text → App Engine",
            desc: "Type what you want to build. DevX generates pages, components, and logic in real-time with live preview. No drag and drop. Just describe it.",
            badge: "3D CORE FEATURE"
        },
        {
            icon: <Eye className="size-6" />,
            title: "Live Preview Sandbox",
            desc: "Instant in-browser preview as your app is generated. See exactly what you're building before you deploy. Zero configuration needed.",
            badge: "BUILT-IN"
        },
        {
            icon: <Lock className="size-6" />,
            title: "Auth Out of the Box",
            desc: "Clerk or NextAuth pre-configured. Protected routes, session management, and role-based access — ready to go.",
            badge: "PRE-BUILT"
        },
        {
            icon: <Database className="size-6" />,
            title: "Database + API Layer",
            desc: "Prisma ORM with PostgreSQL. Type-safe database queries, auto-generated API routes, and full CRUD scaffolding for any data model.",
            badge: "PRODUCTION-READY"
        },
        {
            icon: <Globe className="size-6" />,
            title: "Edge Deployment",
            desc: "Optimized for the edge. Global CDN, sub-100ms responses, ISR caching, and zero cold starts. Deploy in one command.",
            badge: "GLOBAL SCALE"
        },
        {
            icon: <Key className="size-6" />,
            title: "Your API Key, Your Cost",
            desc: "Connect your own OpenAI or Anthropic key. No markup, no middleman. Pay exactly what the AI provider charges — nothing more.",
            badge: "NO LOCK-IN"
        }
    ];

    return (
        <section ref={containerRef} className="py-48 relative bg-[#050505] overflow-hidden px-6">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-32 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-3xl ring-1 ring-blue-500/20"
                    >
                        <Boxes className="size-4 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 italic">Structural Integrity Protocol</span>
                    </motion.div>

                    <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.8] uppercase italic">
                        The Architectural <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-600 text-glow-purple">Elite Components.</span>
                    </h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium italic">
                        One template. Unlimited scaling. Zero lock-in.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {features.map((feature, idx) => (
                        <TerminalCard key={idx} feature={feature} idx={idx} />
                    ))}
                </div>
            </div>

            {/* Background HUD decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[-5%] size-[600px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[10%] right-[-5%] size-[600px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />
            </div>
        </section>
    );
}

