"use client";

import Link from "next/link";
import { Code2, Shield, Box, Activity, ChevronRight, ChevronLeft } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans flex pt-20">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/10 hidden md:block fixed h-[calc(100vh-80px)] overflow-y-auto bg-[#0a0a0a]">
        <div className="p-8 space-y-8">
          <Link href="/" className="flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="size-4 mr-2" /> Back to Home
          </Link>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Overview</h4>
            <div className="space-y-3">
              <Link href="#introduction" className="flex items-center text-sm text-blue-400 font-medium">
                <ChevronRight className="size-3 mr-1" /> Introduction
              </Link>
              <Link href="#architecture" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> Core Architecture
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Capabilities</h4>
            <div className="space-y-3">
              <Link href="#llm" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> LLM Orchestration
              </Link>
              <Link href="#e2b" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> E2B Sandboxing
              </Link>
              <Link href="#inngest" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> Inngest Pipeline
              </Link>
              <Link href="#zod" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> Zod Validation
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
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Platform Documentation</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Technical reference for the DevX agentic pipeline. Learn how DevX generates, validates, and runs production-ready Next.js applications autonomously.
            </p>
          </header>

          {/* Intro Section */}
          <section id="introduction" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Introduction
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                DevX is not a visual website builder or a low-code platform. It is an orchestration engine that acts as an autonomous full-stack developer. By combining advanced Large Language Models (Claude 3.7 / Gemini Pro) with cloud virtualization (E2B) and event-driven backgrounds jobs (Inngest), DevX writes standard, exportable React code exactly as a human developer would.
              </p>
            </div>
          </section>

          {/* Architecture Section */}
          <section id="architecture" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">
              Core Architecture
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                Every project generated on DevX adheres to a strict, modern architectural baseline. We enforce the following stack to guarantee performance and stability:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
                <li><strong className="text-white font-semibold">Framework:</strong> Next.js 15 (App Router, React 19)</li>
                <li><strong className="text-white font-semibold">Styling:</strong> Tailwind CSS v4</li>
                <li><strong className="text-white font-semibold">Components:</strong> Shadcn UI & Radix Primitives</li>
                <li><strong className="text-white font-semibold">Icons:</strong> Lucide React</li>
              </ul>
            </div>
          </section>

          {/* LLM Section */}
          <section id="llm" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Code2 className="size-5 text-blue-400" /> Agentic Code Generation
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                The pipeline begins with intent parsing. The user's natural language prompt is passed to the AI agent, which generates a comprehensive component tree. The agent doesn't write one massive file; it intelligently separates concerns, building out <code>layout.tsx</code>, <code>page.tsx</code>, and individual atomic components within a structured <code>components/</code> directory.
              </p>
            </div>
          </section>

          {/* E2B Section */}
          <section id="e2b" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Box className="size-5 text-amber-400" /> E2B Cloud Sandboxing
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed mb-4">
                To ensure the generated code actually runs, DevX does not rely on local evaluation. For every session, a dedicated E2B micro-VM is booted in the cloud.
              </p>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 font-mono text-sm my-6">
                <span className="text-green-400">$ npm run dev</span><br/>
                <span className="text-gray-400">▲ Next.js 15.0.0-rc</span><br/>
                <span className="text-gray-400">- Local: http://localhost:3000</span><br/>
                <span className="text-blue-400 mt-2 block">✓ Ready in 143ms</span>
              </div>
              <p className="leading-relaxed">
                Files are streamed directly into this VM, and a headless Next.js development server is ignited. This provides the user with an instant, shareable live preview URL that reflects the exact state of the generated code.
              </p>
            </div>
          </section>

          {/* Inngest Section */}
          <section id="inngest" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Activity className="size-5 text-pink-400" /> Inngest Event Pipeline
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                Serverless functions typically time out after 10 to 60 seconds, which is insufficient for multi-file LLM generation loops. DevX utilizes Inngest to offload the orchestrator into a stateful, event-driven background job. This ensures that the pipeline can run for minutes, handling retries, delays, and complex file accumulations without dropping the connection.
              </p>
            </div>
          </section>

          {/* Zod Section */}
          <section id="zod" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Shield className="size-5 text-emerald-400" /> Zod Validation & Auto-Healing
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                LLMs occasionally hallucinate package names or produce syntactically incorrect code. The DevX pipeline intercepts the terminal output from the E2B sandbox. If a build error is detected, the error is parsed against a Zod schema and piped back to the LLM as a "fix request". The agent will autonomously patch the code and re-evaluate until the Next.js build is 100% stable before presenting the final result to the user.
              </p>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
}
