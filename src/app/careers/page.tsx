"use client";

import Link from "next/link";
import { Users, Github, Bug, MessageSquare, ChevronRight, ChevronLeft } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans flex pt-20">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/10 hidden md:block fixed h-[calc(100vh-80px)] overflow-y-auto bg-[#0a0a0a]">
        <div className="p-8 space-y-8">
          <Link href="/" className="flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="size-4 mr-2" /> Back to Home
          </Link>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Community</h4>
            <div className="space-y-3">
              <Link href="#introduction" className="flex items-center text-sm text-blue-400 font-medium">
                <ChevronRight className="size-3 mr-1" /> Introduction
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Resources</h4>
            <div className="space-y-3">
              <Link href="#contributing" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> Contributing
              </Link>
              <Link href="#bugs" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> Bug Tracking
              </Link>
              <Link href="#support" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> Support
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-6 md:p-16 max-w-4xl pb-40">
        <div className="space-y-12 md:space-y-16">
          
          {/* Mobile Back Button */}
          <Link href="/" className="md:hidden flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors mb-8">
            <ChevronLeft className="size-4 mr-2" /> Back to Home
          </Link>

          {/* Header */}
          <header className="space-y-4 border-b border-white/10 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Developer Hub</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Information on how to contribute to the DevX platform, report bugs, and join the community of engineers building autonomous UI systems.
            </p>
          </header>

          {/* Intro Section */}
          <section id="introduction" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="size-5 text-amber-400" /> Community Introduction
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                DevX is built by developers, for developers. We believe that the future of software engineering involves a tight loop between human architects and AI agents. The Developer Hub is the central location for participating in the open ecosystem.
              </p>
            </div>
          </section>

          {/* Contributing */}
          <section id="contributing" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Github className="size-5 text-gray-300" /> Contributing
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                The DevX agentic pipeline is continuously evolving. We welcome contributions to the core system prompt, the component registry, and the frontend visualization layer.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
                <li><strong className="text-white font-semibold">Prompt Engineering:</strong> Help refine the system prompts to improve the quality of generated Next.js code.</li>
                <li><strong className="text-white font-semibold">Component Library:</strong> Submit new Shadcn/Tailwind UI patterns for the agent to use.</li>
                <li><strong className="text-white font-semibold">Pipeline Optimization:</strong> Improve the Inngest background job reliability and error handling.</li>
              </ul>
            </div>
          </section>

          {/* Bug Tracking */}
          <section id="bugs" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Bug className="size-5 text-red-400" /> Bug Tracking
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                If you encounter a hallucination that the Zod auto-healing loop cannot recover from, or if the E2B sandbox fails to boot, please report it via our issue tracker.
              </p>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 font-mono text-sm my-6 text-gray-400">
                When reporting bugs, please include:<br/>
                1. The prompt you used.<br/>
                2. The LLM model selected (Gemini Pro / Claude 3.7).<br/>
                3. The exact error thrown by the Next.js dev server.
              </div>
            </div>
          </section>

          {/* Support */}
          <section id="support" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <MessageSquare className="size-5 text-blue-400" /> Support
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                Need help integrating DevX into your workflow? Join our community Discord or reach out to the core team. We are actively assisting architects in deploying autonomous UI solutions.
              </p>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
}
