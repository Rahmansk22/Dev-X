"use client";

import Link from "next/link";
import { Shield, Lock, Box, ChevronRight, ChevronLeft, Server } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans flex pt-20">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/10 hidden md:block fixed h-[calc(100vh-80px)] overflow-y-auto bg-[#0a0a0a]">
        <div className="p-8 space-y-8">
          <Link href="/" className="flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="size-4 mr-2" /> Back to Home
          </Link>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Security</h4>
            <div className="space-y-3">
              <Link href="#introduction" className="flex items-center text-sm text-blue-400 font-medium">
                <ChevronRight className="size-3 mr-1" /> Introduction
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Protocols</h4>
            <div className="space-y-3">
              <Link href="#isolation" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> Virtual Isolation
              </Link>
              <Link href="#zod" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> Zod Validation
              </Link>
              <Link href="#api" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronRight className="size-3 mr-1 opacity-0" /> API Protection
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
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Pipeline Security</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Technical documentation on the security protocols utilized within the DevX agentic pipeline. Learn how we prevent AI hallucinations and isolate runtime environments.
            </p>
          </header>

          {/* Intro Section */}
          <section id="introduction" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Introduction
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                When allowing Large Language Models to autonomously write and execute code, strict boundaries must be maintained. DevX employs a multi-layered security approach to ensure that generated applications are safe, syntactically correct, and isolated from our core infrastructure.
              </p>
            </div>
          </section>

          {/* Virtual Isolation */}
          <section id="isolation" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Box className="size-5 text-amber-400" /> Virtual Isolation (E2B Sandboxes)
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                We never execute generated code on our host servers. Every time a build is initiated, DevX provisions a completely isolated cloud micro-VM using E2B.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
                <li><strong className="text-white font-semibold">Ephemeral Environments:</strong> Each sandbox exists only for the duration of the session and is destroyed upon completion.</li>
                <li><strong className="text-white font-semibold">Network Isolation:</strong> The VM has restricted access to the host network, preventing horizontal movement.</li>
                <li><strong className="text-white font-semibold">Process Jailing:</strong> The Next.js development server runs as an unprivileged process inside the container.</li>
              </ul>
            </div>
          </section>

          {/* Zod Validation */}
          <section id="zod" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Shield className="size-5 text-emerald-400" /> Strict Zod Validation
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                LLMs are prone to hallucinations, particularly when generating complex JSON structures or API schemas. DevX prevents these hallucinations from crashing the pipeline by enforcing strict Zod typing at every transition.
              </p>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 font-mono text-sm my-6 text-gray-400 overflow-x-auto">
                <span className="text-purple-400">const</span> <span className="text-blue-300">AgentSchema</span> = z.object({`{`}<br/>
                &nbsp;&nbsp;architecture: z.enum([<span className="text-green-300">'nextjs-app-router'</span>]),<br/>
                &nbsp;&nbsp;dependencies: z.array(z.string()),<br/>
                &nbsp;&nbsp;files: z.array(z.object({`{`}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;path: z.string().startsWith(<span className="text-green-300">'/'</span>),<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;content: z.string(),<br/>
                &nbsp;&nbsp;{`}`}))<br/>
                {`}`});
              </div>
              <p className="leading-relaxed">
                If the model violates this schema (e.g., attempting to generate a Vue.js file when Next.js is enforced), the pipeline catches the ZodError and autonomously prompts the model to correct itself.
              </p>
            </div>
          </section>

          {/* API Protection */}
          <section id="api" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
              <Server className="size-5 text-blue-400" /> API Protection
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="leading-relaxed">
                All requests to the DevX inference endpoints are protected by standard Next.js 15 route handler security protocols. We utilize Clerk for authentication and enforce strict rate-limiting to prevent abuse of the expensive LLM generation pipeline.
              </p>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
}
