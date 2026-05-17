"use client";

import { motion } from "framer-motion";
import { Check, X, Shield, Star, Info, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const ComparisonTable = () => {
    const comparisonData = [
        { feature: "Full Code Ownership", devx: "100% Yours", others: "Platform Lock-in", highlight: true },
        { feature: "One-Time Payment", devx: "Life-time Access", others: "$20-$40/mo", highlight: false },
        { feature: "Database & Auth", devx: "Native Config", others: "Add-on Costs", highlight: false },
        { feature: "AI Model Flexibility", devx: "Use Any API Key", others: "Proprietary Only", highlight: true },
        { feature: "Self-Hosting", devx: "Any Cloud/VPS", others: "Proprietary Hosting", highlight: false },
        { feature: "Deployment Precision", devx: "Edge Optimized", others: "Standard Vercel", highlight: false },
    ];

    return (
        <section className="py-48 bg-black relative overflow-hidden px-6">
            {/* Ambient Background Lights */}
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-32 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl group transition-all"
                    >
                        <Shield className="size-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 italic group-hover:text-white transition-colors">Economic Analysis Protocol 🪐</span>
                    </motion.div>

                    <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.85] text-center max-w-4xl mx-auto">
                        Own your code.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600 text-glow">Kill the subscription.</span>
                    </h2>
                </div>

                <div className="relative p-[1px] rounded-[4rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden group">
                    {/* Glass Surface */}
                    <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-3xl z-0" />

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-neural-grid opacity-10 pointer-events-none z-0" />

                    <div className="relative z-10 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="p-12 text-[11px] font-black uppercase tracking-[0.6em] text-gray-600 italic">Core Metric</th>
                                    <th className="p-12">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] text-[10px] text-white font-black uppercase tracking-[0.2em] italic">
                                                <Crown className="size-3 fill-white" />
                                                The DevX Engine
                                            </div>
                                        </div>
                                    </th>
                                    <th className="p-12 text-center">
                                        <span className="text-xl font-black text-gray-700 uppercase italic tracking-[0.3em]">Competitors</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.map((row, idx) => (
                                    <tr key={idx} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all duration-500">
                                        <td className="p-12">
                                            <div className="space-y-1">
                                                <span className="text-xl font-black text-white uppercase italic tracking-tight group-hover:text-blue-400 transition-colors leading-none block">{row.feature}</span>
                                                <div className="text-[10px] font-bold text-gray-700 uppercase tracking-widest italic flex items-center gap-2">
                                                    <Info className="size-2.5" />
                                                    Deterministic Protocol
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-12 bg-blue-500/[0.03] group-hover:bg-blue-500/[0.05] transition-colors relative">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                                    <Check className="size-6 text-blue-400 stroke-[3px]" />
                                                </div>
                                                <span className="text-[11px] font-black text-blue-400 uppercase italic tracking-[0.2em]">{row.devx}</span>
                                            </div>
                                            {row.highlight && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)]" />
                                            )}
                                        </td>
                                        <td className="p-12 text-center opacity-40 group-hover:opacity-60 transition-opacity">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="size-10 rounded-2xl border border-white/10 flex items-center justify-center">
                                                    <X className="size-5 text-gray-600" />
                                                </div>
                                                <span className="text-[11px] font-black text-gray-600 uppercase italic tracking-[0.2em]">{row.others}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Economic Comparison Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
                    {[
                        { label: "Developer ROI", value: "85%", icon: Zap, color: "text-blue-400" },
                        { label: "Infrastructure Savings", value: "Yearly $4k", icon: Crown, color: "text-emerald-400" },
                        { label: "Total Code Control", value: "Absolute", icon: Shield, color: "text-purple-400" }
                    ].map((stat, i) => (
                        <div key={i} className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors flex flex-col items-center text-center space-y-4">
                            <stat.icon className={cn("size-6", stat.color)} />
                            <div>
                                <div className="text-4xl font-black text-white italic tracking-tighter uppercase">{stat.value}</div>
                                <div className="text-[11px] font-black text-gray-600 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust Footer */}
                <div className="mt-24 pt-24 border-t border-white/5 flex flex-col items-center gap-12 text-center">
                    <p className="text-[11px] font-black text-gray-700 uppercase tracking-[0.8em] italic">Built for the next generation of architects.</p>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                        {["PRISMA", "NEON", "CLERK", "TRPC", "NEXTJS"].map(logo => (
                            <span key={logo} className="text-3xl font-black italic tracking-tighter text-white">{logo}</span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
