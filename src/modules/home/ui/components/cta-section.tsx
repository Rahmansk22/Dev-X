"use client";

import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Brain, Globe, Shield, Cpu, Zap, Activity, Terminal, Boxes } from "lucide-react";
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

export const CTASection = () => {
    const containerRef = useRef<HTMLElement>(null);

    return (
        <section
            ref={containerRef}
            className="py-48 px-6 relative overflow-hidden bg-[#050505] flex items-center justify-center min-h-[90vh] perspective-2000"
        >
            {/* Cinematic Background Orchestration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neural-grid opacity-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-600/5 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_80%)]" />
            </div>

            <TiltContainer className="relative z-10 max-w-6xl w-full text-center">
                <div style={{ transform: "translateZ(30px)" }} className="space-y-12">
                    {/* Status Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-3xl shadow-2xl group hover:border-blue-500/50 transition-all font-black"
                    >
                        <Zap className="size-4 text-blue-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 italic">Core Implementation Protocol Active</span>
                    </motion.div>

                    {/* Headline */}
                    <div style={{ transform: "translateZ(60px)" }}>
                        <h2 className="text-6xl md:text-[9rem] font-black tracking-tighter text-white mb-6 leading-[0.8] italic uppercase">
                            Own the <br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-600 text-glow-purple">
                                Machine.
                            </span>
                        </h2>
                        <p className="text-xl md:text-3xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium italic">
                            Stop renting your infrastructure. Start architecting your legacy with <span className="text-white">DevX</span>.
                        </p>
                    </div>

                    {/* Central Button Portal */}
                    <div className="relative inline-block py-20" style={{ transform: "translateZ(100px)" }}>
                        <div className="absolute inset-[-60px] border border-blue-500/10 rounded-full animate-spin [animation-duration:30s] pointer-events-none" />
                        <div className="absolute inset-[-40px] border border-purple-500/10 rounded-full animate-spin [animation-duration:20s] reverse pointer-events-none" />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="relative px-20 py-12 bg-white text-black font-black text-3xl rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.5)] transition-all hover:shadow-[0_0_120px_rgba(59,130,246,0.8)] group uppercase italic tracking-tighter"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                            <span className="relative z-10 flex items-center gap-6 group-hover:text-white transition-colors">
                                INITIATE FINAL SYNC <ArrowRight className="w-12 h-12" />
                            </span>

                            {/* Animated Glitch Bar */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 group-hover:h-3 transition-all animate-pulse" />
                        </motion.button>

                        {/* Dynamic HUD Labels */}
                        <div className="absolute -top-10 -right-20 hidden lg:block opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                <Terminal className="size-3 text-blue-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">DEPLOY_V4.8.2</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -left-20 hidden lg:block opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                <Boxes className="size-3 text-purple-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">MESH_STABLE</span>
                            </div>
                        </div>
                    </div>

                    {/* Industrial Verification */}
                    <div className="pt-24 flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000 border-t border-white/5">
                        {[
                            { icon: Cpu, text: "Industrial Grade" },
                            { icon: Globe, text: "Anycast Distributed" },
                            { icon: Zap, text: "Zero Cold Starts" },
                            { icon: Shield, text: "Hardened Security" }
                        ].map((badge, i) => (
                            <span key={i} className="text-[11px] font-black text-white tracking-[0.4em] uppercase flex items-center gap-4">
                                <badge.icon className="size-4 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
                                {badge.text}
                            </span>
                        ))}
                    </div>
                </div>
            </TiltContainer>

            {/* Depth Gradients */}
            <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none mask-fade-out" />
        </section>
    );
};
