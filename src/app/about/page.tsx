"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lightbulb,
  Zap,
  Users,
  Globe,
  Layers,
  ArrowUpRight,
  Fingerprint,
  Cpu,
  ChevronLeft,
  Target,
  Rocket,
  Compass
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  const values = [
    {
      title: "Neural Synergy",
      desc: "We believe AI isn't a replacement for developers, but a force multiplier. Our models are trained to anticipate intent and handle the boilerplate, letting humans focus on pure creative logic.",
      icon: Lightbulb,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      title: "Deterministic Ease",
      desc: "Software architecture should be deterministic, not a guessing game. Dev X distills high-end DevOps and Backend engineering into a single, predictable line of natural language.",
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    {
      title: "Zero-Trust default",
      desc: "Security isn't a feature; it's the foundation. Every project initiated via Dev X follows a Zero-Trust protocol, ensuring that encryption and auth are hardened from the very first bit.",
      icon: Shield,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    {
      title: "Elastic Infrastructure",
      desc: "Our edge mesh is built to handle viral loads. We provision infrastructure that doesn't just scale; it breathes with your traffic, ensuring zero waste and infinite headroom.",
      icon: Layers,
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-blue-500/30">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-24">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to DevX</span>
          </button>
          <div className="flex items-center gap-2 opacity-40">
            <Compass className="size-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Mission: Build the Impossible</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-10 mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.3em] text-blue-400"
          >
            The Architect's Manifesto
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-6xl font-black tracking-tighter leading-[0.85]"
          >
            Abolishing the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 text-glow">Friction</span> of Code
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-500 max-w-4xl font-medium leading-relaxed"
          >
            Dev X was born from a singular obsession: the distance between a human idea and its physical execution should be zero. We're not just building a tool; we're building the first autonomous engineering ecosystem that empowers humanity to ship world-class software at the speed of thought.
          </motion.p>
        </div>

        {/* Detailed Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-40">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-16 rounded-[4rem] bg-white/[0.02] border border-white/10 space-y-12 backdrop-blur-3xl group"
          >
            <div className="size-16 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-all duration-500">
              <Target className="size-8 text-blue-400" />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-black tracking-tight italic">Our Genesis</h2>
              <p className="text-lg text-gray-400 leading-relaxed font-medium capitalize">
                The current development cycle is broken. Developers spend 70% of their time on setup, infrastructure, and debugging boilerplate. Dev X was engineered to reclaim that lost creative capital. By automating the industrial layers of software engineering, we allow the modern architect to focus exclusively on logic and experience.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-16 rounded-[4rem] bg-gradient-to-br from-indigo-600 to-purple-800 border border-white/10 space-y-12 relative overflow-hidden group shadow-2xl"
          >
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-black tracking-tight italic text-white">Vision 2026</h2>
              <p className="text-lg text-indigo-100/80 leading-relaxed font-semibold">
                Toward a Post-Boilerplate World. <br /><br />
                Our roadmap is clear: By 2026, Dev X will function as a fully autonomous global architectural orchestrator. We are building the infrastructure that will power the next billion creators, making specialized coding skills optional while making computational thinking universal.
              </p>
              <Link href="/showcase" className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-white hover:underline">
                View Our Trajectory <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-all duration-1000" />
            <Rocket className="absolute bottom-10 right-10 size-24 text-white/5 group-hover:text-white/10 group-hover:translate-x-4 group-hover:-translate-y-4 transition-all duration-1000" />
          </motion.div>
        </div>

        {/* Bento Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-40">
          {values.map((val, idx) => (
            <motion.div
              key={val.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="p-12 rounded-[3.5rem] bg-white/[0.01] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all group"
            >
              <div className={`p-4 rounded-2xl ${val.bg} ${val.color} inline-block mb-8 group-hover:rotate-12 transition-transform`}>
                <val.icon className="size-8" />
              </div>
              <h4 className="text-2xl font-black mb-6 tracking-tight">{val.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">{val.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Technical Philosophy Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-20 rounded-[4rem] bg-[#0a0a0a] border border-white/10 mb-40 flex flex-col items-center text-center space-y-8 relative overflow-hidden"
        >
          <Cpu className="size-16 text-blue-500 opacity-20" />
          <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">AI-Native, Edge-First, <br />Global-Always.</h3>
          <p className="text-xl text-gray-500 max-w-3xl leading-relaxed italic">
            "We don't just add AI to developer tools; we build developer tools inside of AI. The distinction is subtle, but the results are world-changing."
          </p>
          <div className="flex items-center gap-12 pt-8 grayscale opacity-20">
            <span className="font-black italic tracking-widest uppercase">Next.js</span>
            <span className="font-black italic tracking-widest uppercase">Kubernetes</span>
            <span className="font-black italic tracking-widest uppercase">Tensorflow</span>
            <span className="font-black italic tracking-widest uppercase">Rust</span>
          </div>
          {/* Scan line effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-scan" />
        </motion.div>

        {/* Final CTA */}
        <div className="text-center space-y-12">
          <h2 className="text-4xl font-black italic tracking-tighter">Will you build the future, or watch it?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
              onClick={() => router.push("/sign-up")}
              className="px-16 py-6 rounded-3xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all shadow-2xl active:scale-95"
            >
              Initiate Protocol
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-16 py-6 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95"
            >
              Return to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}