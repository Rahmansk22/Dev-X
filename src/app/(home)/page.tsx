"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ProjectForm from "@/modules/home/ui/components/project-form";
import { PoweredBy } from "@/modules/home/ui/components/prompt-su";
import { HowItWorksSection } from "@/modules/home/ui/components/tagline";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";
import { FeatureShowcase } from "@/modules/home/ui/components/feature-visualizer";
import { CTASection } from "@/modules/home/ui/components/cta-section";
import ProcessShowcase from "@/modules/home/ui/components/process-showcase";
import { ComparisonTable } from "@/modules/home/ui/components/comparison-table";
import { CinematicBackground } from "@/modules/home/ui/components/cinematic-background";

const Page = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoaded || !mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 100,
      behavior: 'smooth'
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-black overflow-x-hidden selection:bg-blue-500/30">
      <CinematicBackground />

      <section className="relative min-h-[60vh] px-4 md:px-8 flex flex-col items-center pt-8 pb-4 perspective-2000">
        {/* Top/Center Content Wrapper */}
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center preserve-3d" style={{ paddingTop: '20px' }}>
          {/* Futuristic Badge */}
          <div className="flex flex-col items-center w-full gap-2 mb-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl shadow-xl mx-auto w-fit group hover:border-blue-500/50 transition-all duration-500"
            >
              <div className="size-1 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-500 group-hover:text-blue-400 transition-colors leading-none italic">
                DEVX ENGINE ACTIVE
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-[1.1] flex flex-col items-center gap-0 mb-4 uppercase italic text-center"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 animate-gradient-x bg-size-[200%_auto] text-glow px-4">
                AI-powered Next.js starter pack
              </span>
              <span className="text-white brightness-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] px-4">
                Built for developers
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <p className="text-xs md:text-sm text-gray-500 font-medium tracking-tight max-w-2xl mx-auto leading-relaxed italic text-center">
                The <span className="text-white">DevX App Engine</span> Generate production-ready app structure in <span className="text-blue-400">minutes</span>. <br className="hidden md:block" />
                Routes,<span className="text-emerald-400">API scaffolding, and opinionated architecture</span> instantly.
              </p>

              <div className="flex flex-wrap justify-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] italic">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-blue-400">Next.js 15</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-purple-400">Clerk + Prisma</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-400">tRPC Stack</span>
              </div>
            </motion.div>
          </div>

          {/* Prompt Entry System */}
          <div className="w-full flex justify-center mt-4 relative">
            <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="flex flex-col items-center w-full max-w-4xl relative z-10">
              <ProjectForm />
              <div className="mt-6 w-full max-w-4xl mx-auto">
                <PoweredBy />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Page Content */}
        {isSignedIn && (
          <div className="relative z-10 mt-auto pt-16">
            <ProjectsList />
          </div>
        )}
      </section>


      {/* Narrative Sections */}
      {!isSignedIn && (
        <div className="relative">
          {/* How It Works Section */}
          <section className="py-24 px-4 bg-[#050505]">
            <HowItWorksSection />
          </section>

          {/* Process Showcase Section */}
          <section className="py-24 px-4 bg-[#050505] border-t border-white/5">
            <ProcessShowcase />
          </section>

          {/* Features Section */}
          <FeatureShowcase />

          {/* Comparison Section */}
          <ComparisonTable />

          {/* CTA Section */}
          <CTASection />
        </div>
      )}

      {/* Scanline pattern for whole page */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none z-50" />
    </div>
  );
};

export default Page;
