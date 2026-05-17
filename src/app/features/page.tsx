"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Rocket,
  Users,
  Code2,
  Terminal,
  Layers,
  Cpu,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Globe,
  ChevronLeft,
  Activity,
  Workflow
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/modules/home/ui/components/navbar";

const featureGroups = [
  {
    title: "Engineering Excellence",
    subtitle: "Built for architects, not just users.",
    features: [
      {
        icon: Terminal,
        title: "Neural CLI Protocol",
        desc: "Interact with your entire ecosystem using high-level intent. Our CLI leverages G-Series transformers to understand project-wide context, enabling atomic commits and module-level refactorings through simple natural language overrides.",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        tech: "Transformer-V4 • AST-Aware"
      },
      {
        icon: Cpu,
        title: "Deterministic Architecture",
        desc: "Software should be predictable. Dev X synthesizes hardened architectures using Kysely for type-safe queries and Neon for serverless Postgres, ensuring that your data layer follows strict relational integrity protocols by default.",
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        tech: "Postgres • Typesafe ORM"
      }
    ]
  },
  {
    title: "Security & Trust",
    subtitle: "Enterprise grade, zero exceptions.",
    features: [
      {
        icon: Lock,
        title: "Edge-Level Identity",
        desc: "Secure every request at the edge. Integrated with Clerk and NextAuth, our auth layer implements OIDC protocols and hardware-level WebAuthn security, de-risking your platform from the first deployment.",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        tech: "Clerk • Zero-Trust"
      },
      {
        icon: Shield,
        title: "Hardened Vaulting",
        desc: "Sensitive data is isolated in encrypted vaults. We implement AES-256 encryption at rest and TLS 1.3 in transit, with integrated secret management that removes sensitive keys from your codebase entirely.",
        color: "text-cyan-400",
        bg: "bg-cyan-400/10",
        tech: "AES-256 • Hardware-Secure"
      }
    ]
  }
];

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      <Navbar />

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-32">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-20">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Hub</span>
          </button>
          <div className="flex items-center gap-3 opacity-40">
            <Activity className="size-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol 4.0 Stable</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-10 mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <Sparkles className="size-4 text-blue-400 fill-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">The Powerhouse Ecosystem</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85]"
          >
            Engineered for <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 text-glow">Perfection</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto font-medium leading-relaxed"
          >
            Dev X isn't just a builder—it's an operating system for modern engineering. We've combined neural synthesis with global edge infrastructure to redefine the physics of delivery.
          </motion.p>
        </div>

        {/* Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-60">
          {featureGroups.map((group, gIdx) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tight italic">{group.title}</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-transparent" />
                <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">{group.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {group.features.map((feature, fIdx) => (
                  <div
                    key={feature.title}
                    className="group relative p-12 rounded-[3.5rem] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all overflow-hidden"
                  >
                    <div className="relative z-10 flex flex-col gap-10">
                      <div className="flex items-center justify-between">
                        <div className={`p-4 rounded-2xl ${feature.bg} ${feature.color} border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                          <feature.icon className="size-8" />
                        </div>
                        <div className="px-3 py-1 rounded bg-white/5 text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">
                          {feature.tech}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black tracking-tight">{feature.title}</h3>
                        <p className="text-lg text-gray-500 leading-relaxed font-medium">{feature.desc}</p>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Highlight Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[5rem] bg-[#0a0a0a] border border-white/10 p-16 lg:p-24 text-center shadow-2xl overflow-hidden mb-60"
        >
          <div className="relative z-10 space-y-10">
            <div className="flex justify-center">
              <Globe className="size-16 text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">Global Distribution Mesh</h2>
            <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium capitalize">
              Your projects are distributed across a primary mesh of 100+ edge nodes. Utilizing Anycast routing and multi-cloud redundancy, we guarantee sub-second Time-to-First-Byte for users from Tokyo to New York, out of the box.
            </p>
            <div className="flex flex-wrap justify-center gap-12 pt-12">
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl font-black text-white italic">40ms</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Avg Global Latency</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl font-black text-white italic">100+</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Edge Points</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl font-black text-white italic">∞</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Elastic Headroom</span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </motion.div>

        {/* Technical Deep Dive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-40">
          <div className="p-16 rounded-[4rem] bg-white/[0.01] border border-white/5 space-y-8 group hover:bg-white/[0.03] transition-all">
            <Workflow className="size-10 text-orange-500" />
            <h3 className="text-4xl font-black tracking-tight leading-none italic">Atomic CI/CD Integration</h3>
            <p className="text-gray-400 text-lg leading-relaxed font-medium">
              Dev X integrates directly with your GitHub or GitLab workflows. Every change triggers an atomic build process that validates schemas, runs comprehensive unit tests via Vitest, and verifies edge-compatibility before pushing to production.
            </p>
          </div>
          <div className="p-16 rounded-[4rem] bg-white/[0.01] border border-white/5 space-y-8 group hover:bg-white/[0.03] transition-all">
            <Code2 className="size-10 text-blue-500" />
            <h3 className="text-4xl font-black tracking-tight leading-none italic">Self-Healing Runtime</h3>
            <p className="text-gray-400 text-lg leading-relaxed font-medium">
              Our runtime environment monitors project health in real-time. If an edge node fails or a database query times out, our mesh automatically re-routes traffic and initiates a recovery protocol, ensuring zero downtime for your critical services.
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center space-y-16">
          <h3 className="text-4xl font-black italic tracking-tighter">Enter the flow of innovation.</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/sign-up">
              <button className="px-16 py-6 rounded-3xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all shadow-2xl active:scale-95">
                Launch Implementation
              </button>
            </Link>
            <button
              onClick={() => router.push("/")}
              className="px-16 py-6 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95"
            >
              Return Home
            </button>
          </div>
          <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.5em] pt-8">Next.js 15 • React 19 • Edge Native</p>
        </div>
      </main>
    </div>
  );
}
