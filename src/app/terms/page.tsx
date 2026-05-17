"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  Scale,
  FileText,
  ShieldCheck,
  Lock,
  Database,
  Zap,
  UserPlus,
  Gavel,
  Mail,
  Calendar,
  Key
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/modules/home/ui/components/navbar";

const sections = [
  { id: "acceptance", title: "Acceptance of Terms", icon: ShieldCheck },
  { id: "description", title: "Service Definition", icon: Zap },
  { id: "registration", title: "Architect Registry", icon: UserPlus },
  { id: "usage", title: "Acceptable Conduct", icon: Gavel },
  { id: "intellectual-property", title: "IP Sovereignty", icon: Key },
  { id: "payments", title: "Subscription Mesh", icon: Database },
  { id: "privacy", title: "Data Protocol", icon: Lock },
  { id: "contact", title: "Legal Nexus", icon: Mail }
];

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      <Navbar />

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-32">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-20">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Nexus</span>
          </button>
          <div className="flex items-center gap-3 opacity-40">
            <Scale className="size-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Legal Stack V4.0</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-10 mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.3em] text-blue-400"
          >
            Governance & Ethics Hub
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85]"
          >
            The Lexicon <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 text-glow">Protocol</span>
          </motion.h1>
          <p className="text-xl md:text-2xl text-gray-500 max-w-4xl mx-auto font-medium leading-relaxed">
            Every breakthrough requires a foundation of trust. The Lexicon Protocol defines the legal and ethical framework for all architects utilizing the Dev X Ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-32 space-y-2 p-8 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-6">Archive Nodes</h3>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-500 hover:text-blue-400 transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <section.icon className="size-3.5" />
                  {section.title}
                </a>
              ))}
            </div>
          </aside>

          {/* Legal Content */}
          <div className="lg:col-span-9 space-y-32">
            {sections.map((section, idx) => (
              <section id={section.id} key={section.id} className="scroll-mt-40 space-y-10">
                <div className="flex items-center gap-6">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-blue-400">
                    <section.icon className="size-6" />
                  </div>
                  <h2 className="text-4xl font-black tracking-tight italic uppercase">{section.title}</h2>
                </div>

                <div className="p-12 md:p-16 rounded-[4rem] bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors prose prose-invert max-w-none text-gray-400 leading-relaxed font-medium capitalize">
                  {section.id === "acceptance" && (
                    <p>
                      By initializing a session or registry within Dev X, you implicitly acknowledge and bind yourself to the Lexicon Protocol. These terms constitute a cryptographically significant agreement between you and the Dev X Foundation. If you do not align with these constraints, you must terminate all synthesis processes immediately.
                    </p>
                  )}
                  {section.id === "description" && (
                    <p>
                      Dev X is a neural-integrated architectural engine designed for the rapid synthesis of software artifacts. We provide the infrastructure (G-Series Engines, Edge Mesh, Zero-Trust Vaults) to transform intent into physical logic. While we optimize for deterministic delivery, the final validation of synthesized artifacts resides with the architect.
                    </p>
                  )}
                  {section.id === "registration" && (
                    <p>
                      Access to the high-frequency engine requires identity verification via Clerk Auth. You are responsible for the sovereignty of your vault keys and account telemetry. Dev X reserves the right to suspend any registry node that exhibits anomalous behavior or violates our trust-mesh metrics.
                    </p>
                  )}
                  {section.id === "usage" && (
                    <div className="space-y-6">
                      <p>Our code-of-conduct is binary. Prohibited actions result in immediate node deactivation:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                        {["Malicious Logic Injection", "Reverse Engineering Mesh", "Telemetric Scraping", "IP Infringement"].map(item => (
                          <div key={item} className="px-6 py-3 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500/70 text-[10px] font-black uppercase tracking-widest">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {section.id === "intellectual-property" && (
                    <p>
                      Ownership is total. All logic synthesized through Dev X remains the exclusive intellectual property of the architect. While our models facilitate the assembly of these artifacts, the resulting 'Proof of Construction' belongs to you. Dev X retains rights only to the underlying engine weights and architectural primitives used during synthesis.
                    </p>
                  )}
                  {section.id === "payments" && (
                    <p>
                      Subscriptions are cycle-based and auto-renew via the established mesh protocol. All credit synthesis is final. We implement a transparent resource-based billing model, ensuring you only pay for the computational intensity your architecture requires.
                    </p>
                  )}
                  {section.id === "privacy" && (
                    <p>
                      Data is treated as a core architectural constraint. Our Privacy Protocol (Zero-Knowledge) ensures that your logic remains isolated. Telemetry is processed solely for intent refinement and cluster optimization. You retain the right to 'Permanent Purge' at any state.
                    </p>
                  )}
                  {section.id === "contact" && (
                    <div className="flex flex-col md:flex-row gap-12 items-center justify-between not-prose">
                      <p className="text-xl">Questions regarding the protocol should be directed to our Legal Nexus node.</p>
                      <a href="mailto:legal@devx.app">
                        <button className="px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95">
                          Initiate Legal Sync
                        </button>
                      </a>
                    </div>
                  )}
                </div>
              </section>
            ))}

            {/* Final Subtext */}
            <div className="pt-20 border-t border-white/5 text-center space-y-4">
              <div className="flex justify-center gap-3 text-gray-600">
                <Calendar className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol Updated: March 2026</span>
              </div>
              <p className="text-[10px] text-gray-800 font-bold uppercase tracking-widest max-w-2xl mx-auto">
                Dev X reserves the right to modify the Lexicon Protocol alongside engine updates. Continued use of the ecosystem constitutes acceptance of the latest legal state.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
