"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
	Zap,
	Cpu,
	Target,
	Code2,
	Layers,
	Rocket,
	ArrowRight,
	Sparkles,
	Search,
	CheckCircle2,
	Terminal,
	ChevronLeft,
	Shield,
	Globe,
	Activity
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const workflowSteps = [
	{
		step: "01",
		title: "Multi-Agent Planning",
		description: "The UI sends your natural language prompt to a high-reasoning LLM (like Claude 3.7 or Gemini Pro). The agent parses the intent, selects the optimal tech stack (Next.js 15, Tailwind v4, Shadcn), and generates a comprehensive architecture plan.",
		icon: Sparkles,
		color: "from-blue-500/20 to-cyan-400/20",
		borderColor: "border-blue-500/30",
		glowColor: "shadow-blue-500/20",
		details: ["Prompt Interpretation", "Stack Selection", "Component Tree Planning"]
	},
	{
		step: "02",
		title: "Inngest Orchestration",
		description: "To bypass standard serverless timeouts, the entire generation process is offloaded to an event-driven Inngest pipeline. This ensures the long-running, multi-step agentic loop executes reliably in the background without dropping connections.",
		icon: Layers,
		color: "from-indigo-500/20 to-purple-500/20",
		borderColor: "border-indigo-500/30",
		glowColor: "shadow-indigo-500/20",
		details: ["Event-Driven Pipeline", "Timeout Circumvention", "Stateful Execution"]
	},
	{
		step: "03",
		title: "Virtual Cloud Sandbox",
		description: "An isolated E2B micro-VM is spun up in milliseconds. The generated files are flushed directly into this secure, cloud-native container. A headless Next.js development server is automatically ignited to serve the live preview.",
		icon: Cpu,
		color: "from-purple-500/20 to-pink-500/20",
		borderColor: "border-purple-500/30",
		glowColor: "shadow-purple-500/20",
		details: ["E2B Micro-VMs", "Isolated Environment", "Live Dev Server"]
	},
	{
		step: "04",
		title: "Auto-Healing Build Loop",
		description: "The pipeline doesn't just write code—it compiles it. Any build errors or missing dependencies detected in the sandbox terminal are piped back to the agent. The AI automatically patches the code and re-evaluates until the build is 100% stable.",
		icon: Shield,
		color: "from-emerald-500/20 to-teal-500/20",
		borderColor: "border-emerald-500/30",
		glowColor: "shadow-emerald-500/20",
		details: ["Terminal Error Parsing", "Zod Schema Validation", "Autonomous Patching"]
	},
	{
		step: "05",
		title: "Real-Time Streaming",
		description: "You don't wait in the dark. As the agent accumulates files, the database is progressively updated. The frontend polls these updates and renders a beautiful, staggered 3D visualization of your application being built, file by file.",
		icon: Activity,
		color: "from-amber-500/20 to-orange-500/20",
		borderColor: "border-amber-500/30",
		glowColor: "shadow-amber-500/20",
		details: ["Progressive DB Updates", "Staggered Animations", "Live UI Feedback"]
	}
];

const StepVisualizer = ({ step, Icon }: { step: string; Icon: any }) => {
	if (step === "01") {
		return (
			<div className="w-full h-full flex flex-col justify-center p-8 font-mono text-[11px] leading-relaxed relative z-10">
				<div className="text-gray-500 mb-4">{"// LLM Architectural Output"}</div>
				<div className="text-blue-400">{`{`}</div>
				<div className="pl-4"><span className="text-blue-300">"intent"</span><span className="text-gray-400">: </span><span className="text-yellow-300">"SaaS Dashboard"</span>,</div>
				<div className="pl-4"><span className="text-blue-300">"stack"</span><span className="text-gray-400">: </span><span className="text-blue-400">{`{`}</span></div>
				<div className="pl-8"><span className="text-blue-300">"framework"</span><span className="text-gray-400">: </span><span className="text-yellow-300">"Next.js 15"</span>,</div>
				<div className="pl-8"><span className="text-blue-300">"styling"</span><span className="text-gray-400">: </span><span className="text-yellow-300">"Tailwind v4"</span>,</div>
				<div className="pl-8"><span className="text-blue-300">"components"</span><span className="text-gray-400">: </span><span className="text-yellow-300">"Shadcn UI"</span></div>
				<div className="pl-4 text-blue-400">{`}`}</div>
				<div className="pl-4"><span className="text-blue-300">"status"</span><span className="text-gray-400">: </span><span className="text-green-400">"parsed"</span></div>
				<div className="text-blue-400">{`}`}</div>
			</div>
		);
	}

	if (step === "02") {
		return (
			<div className="w-full h-full flex flex-col justify-center items-center gap-6 relative z-10 p-8">
				<div className="w-full p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between">
					<span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Event: devx/generate</span>
					<span className="text-[10px] text-gray-500 font-mono">Inngest Queue</span>
				</div>
				<div className="w-px h-8 bg-gradient-to-b from-indigo-500/50 to-transparent animate-pulse" />
				<div className="w-full p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-between">
					<span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Step: CreateNetwork</span>
					<span className="text-[10px] text-green-400 font-mono animate-pulse">Running...</span>
				</div>
				<div className="w-px h-8 bg-gradient-to-b from-purple-500/50 to-transparent" />
				<div className="w-full p-4 rounded-xl border border-gray-500/30 bg-white/5 flex items-center justify-between opacity-50">
					<span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Step: FlushFiles</span>
					<span className="text-[10px] text-gray-500 font-mono">Pending</span>
				</div>
			</div>
		);
	}

	if (step === "03") {
		return (
			<div className="w-full h-full p-8 font-mono text-[11px] leading-loose relative z-10 bg-black/50">
				<div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
					<div className="size-3 rounded-full bg-red-500/80" />
					<div className="size-3 rounded-full bg-yellow-500/80" />
					<div className="size-3 rounded-full bg-green-500/80" />
					<span className="text-gray-500 ml-2">sandbox@e2b:~</span>
				</div>
				<div className="text-green-400">➜  app npm run dev</div>
				<div className="text-gray-400 mt-2">&gt; devx-app@0.1.0 dev</div>
				<div className="text-gray-400">&gt; next dev</div>
				<div className="text-gray-300 mt-4">▲ Next.js 15.0.0-rc</div>
				<div className="text-gray-400 mt-2">- Local:        http://localhost:3000</div>
				<div className="text-gray-400">- Network:      http://0.0.0.0:3000</div>
				<div className="text-blue-400 mt-4 flex items-center gap-2">
					<div className="size-2 bg-blue-400 rounded-full animate-ping" />
					✓ Ready in 143ms
				</div>
			</div>
		);
	}

	if (step === "04") {
		return (
			<div className="w-full h-full flex flex-col justify-center items-center gap-4 relative z-10 p-8">
				<div className="w-full p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex flex-col gap-2 relative overflow-hidden group">
					<span className="text-[10px] font-black uppercase text-red-400 tracking-widest">Build Error Detected</span>
					<span className="text-xs font-mono text-gray-400">Module not found: Can't resolve 'lucide-react'</span>
				</div>

				<div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-black tracking-widest">
					<div className="h-px w-8 bg-gray-500/50" />
					Zod Intercept
					<div className="h-px w-8 bg-gray-500/50" />
				</div>

				<div className="w-full p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col gap-2 relative overflow-hidden">
					<span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
						<CheckCircle2 className="size-3" /> Auto-Healed
					</span>
					<span className="text-xs font-mono text-gray-400">$ npm install lucide-react</span>
				</div>
			</div>
		);
	}

	if (step === "05") {
		return (
			<div className="w-full h-full flex justify-center items-center relative z-10 p-8 perspective-1000">
				<div className="relative w-full aspect-square flex items-center justify-center">
					{[3, 2, 1].map((i) => (
						<motion.div
							key={i}
							initial={{ y: 0, opacity: 1 }}
							animate={{ y: i * -15, scale: 1 - i * 0.05, opacity: 1 - i * 0.2 }}
							transition={{ repeat: Infinity, duration: 2, repeatType: "reverse", delay: i * 0.2 }}
							className="absolute w-48 h-64 bg-[#0a0a0a] border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-2 shadow-2xl"
							style={{ zIndex: 10 - i }}
						>
							<div className="w-full h-2 bg-amber-500/20 rounded-full" />
							<div className="w-3/4 h-2 bg-white/10 rounded-full mt-2" />
							<div className="w-1/2 h-2 bg-white/10 rounded-full" />
							<div className="w-full h-2 bg-white/10 rounded-full mt-4" />
							<div className="w-5/6 h-2 bg-white/10 rounded-full" />
							<div className="mt-auto self-end text-[9px] font-mono text-amber-500/50">+{i * 12} lines</div>
						</motion.div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="relative z-10 flex flex-col items-center gap-12">
			<motion.div className="p-16 rounded-[4rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl relative">
				<Icon className="size-32 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] relative z-10" />
			</motion.div>
			<div className="space-y-4 text-center">
				<div className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Node Status</div>
				<div className="text-3xl font-black italic uppercase tracking-tighter text-white">Active Build</div>
			</div>
		</div>
	);
};

export default function GuidePage() {
	const router = useRouter();
	const containerRef = useRef(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"]
	});

	const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
	const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

	return (
		<div ref={containerRef} className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-blue-500/30">
			{/* Scanline Overlay */}
			<div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none z-50" />

			{/* Ambient Background Lights */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[140px] rounded-full animate-pulse" />
				<div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[140px] rounded-full animate-pulse delay-1000" />
			</div>

			<main className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-40">
				{/* Top Navigation Bar */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] md:w-full max-w-4xl flex justify-between items-center px-6 md:px-8 py-4 rounded-3xl md:rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-3xl shadow-2xl"
				>
					<button
						onClick={() => router.back()}
						className="group flex items-center gap-3"
					>
						<div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/50 transition-all">
							<ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
						</div>
						<span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-white transition-colors">DevX Core</span>
					</button>
					<div className="flex items-center gap-6">
						<div className="hidden sm:flex items-center gap-2">
							<div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
							<span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Live Status: Stable</span>
						</div>
						<div className="hidden sm:block h-4 w-px bg-white/10" />
						<span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">v4.8.2 Protocol</span>
					</div>
				</motion.div>

				{/* Hero Hero Section */}
				<motion.div
					style={{ opacity, scale }}
					className="flex flex-col items-center text-center space-y-12 mb-60"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl shadow-xl"
					>
						<Zap className="size-4 text-blue-400 fill-blue-400 animate-pulse" />
						<span className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-400">Technical Manifesto</span>
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="text-4xl md:text-7xl font-black tracking-tighter leading-tight uppercase flex flex-col"
					>
						<span>Deconstructing</span>
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 text-glow italic">Complexity.</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="text-lg md:text-xl text-gray-500 max-w-4xl leading-relaxed italic font-medium"
					>
						DevX is a multi-agent orchestration engine that transforms natural language into production-grade Next.js applications using Inngest pipelines, E2B cloud sandboxes, and auto-healing build loops.
					</motion.p>

					<motion.div
						initial={{ height: 0 }}
						animate={{ height: "120px" }}
						transition={{ duration: 1.5, delay: 0.5 }}
						className="w-px bg-gradient-to-b from-blue-500 to-transparent"
					/>
				</motion.div>

				{/* Detailed Steps with 3D Warp */}
				<div className="space-y-40">
					{workflowSteps.map((item, idx) => (
						<motion.div
							key={item.step}
							initial={{ opacity: 0, y: 60 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							className={cn(
								"grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative",
								idx % 2 === 1 && "lg:flex-row-reverse"
							)}
						>
							<div className={cn("space-y-12", idx % 2 === 1 ? "lg:order-2" : "")}>
								<div className="space-y-8">
									<div className="flex items-center gap-6">
										<span className={cn(
											"text-5xl font-black italic opacity-20 text-transparent bg-clip-text bg-gradient-to-r",
											item.color
										)}>{item.step}</span>
										<h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">{item.title}</h3>
									</div>
									<p className="text-lg text-gray-400 leading-relaxed font-medium">
										{item.description}
									</p>
								</div>

								<div className="grid grid-cols-1 gap-6 pt-10 border-t border-white/5">
									<div className="flex items-center gap-3">
										<Terminal className="size-4 text-gray-600" />
										<span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Sub-Protocol Breakdown</span>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
										{item.details.map((detail) => (
											<div key={detail} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-4 hover:bg-white/[0.04] transition-all group">
												<CheckCircle2 className="size-4 text-blue-400 group-hover:scale-125 transition-transform" />
												<span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-tight">{detail}</span>
											</div>
										))}
									</div>
								</div>
							</div>

							<div className={cn("relative perspective-[2000px]", idx % 2 === 1 ? "lg:order-1" : "")}>
								<motion.div
									whileHover={{ rotateY: idx % 2 === 1 ? -15 : 15, rotateX: 10, scale: 1.05 }}
									transition={{ type: "spring", stiffness: 100, damping: 20 }}
									className={cn(
										"relative aspect-[4/5] rounded-[4rem] bg-gradient-to-br p-[1px] shadow-[0_100px_100px_rgba(0,0,0,0.6)]",
										item.borderColor,
										item.glowColor
									)}
								>
									<div className="absolute inset-0 bg-[#0a0a0a] rounded-[4rem] overflow-hidden flex items-center justify-center">
										{/* Industrial Grid */}
										<div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
										<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)] opacity-80" />

										<StepVisualizer step={item.step} Icon={item.icon} />
									</div>
								</motion.div>

								{/* Floating Component HUD Element */}
								<motion.div
									animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
									transition={{ duration: 5, repeat: Infinity }}
									className="absolute -right-8 -bottom-8 p-8 rounded-[2rem] bg-black/80 border border-white/20 backdrop-blur-3xl shadow-2xl z-30 hidden md:block"
								>
									<Shield className="size-8 text-emerald-400 mb-4" />
									<div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hardened Node</div>
								</motion.div>
							</div>
						</motion.div>
					))}
				</div>

				{/* Technical Core Deep Dive */}
				<div className="mt-60 grid grid-cols-1 md:grid-cols-2 gap-12">
					<motion.div
						whileHover={{ y: -10 }}
						className="p-16 rounded-[4rem] bg-white/[0.02] border border-white/10 space-y-10 group relative overflow-hidden"
					>
						<div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
							<Shield className="size-40" />
						</div>
						<Shield className="size-12 text-emerald-400" />
						<div className="space-y-6 relative z-10">
							<h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Zod-Driven Resilience.</h3>
							<p className="text-lg text-gray-500 max-w-md leading-relaxed">
								Every prompt and sandbox file operation is strictly validated through Zod schemas. If an AI hallucination occurs, the pipeline catches the error and auto-corrects it before it ever reaches the VM.
							</p>
						</div>
					</motion.div>

					<motion.div
						whileHover={{ y: -10 }}
						className="p-16 rounded-[4rem] bg-white/[0.02] border border-white/10 space-y-10 group relative overflow-hidden"
					>
						<div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
							<Globe className="size-40" />
						</div>
						<Globe className="size-12 text-blue-400" />
						<div className="space-y-6 relative z-10">
							<h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Live Virtualization.</h3>
							<p className="text-lg text-gray-500 max-w-md leading-relaxed">
								DevX completely bypasses local environment headaches by spinning up dedicated E2B cloud micro-VMs for every project, providing an instant, secure, and shareable live preview URL.
							</p>
						</div>
					</motion.div>
				</div>

				{/* Final Call to Synthesis */}
				<div className="mt-80 flex flex-col items-center text-center space-y-16">
					<div className="space-y-6">
						<h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Synthesize Your Vision.</h2>
						<p className="text-lg text-gray-500 uppercase tracking-[0.2em] font-black italic">The era of manual boilerplate is over.</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-8">
						<Link href="/sign-up">
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="px-20 py-8 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.3em] text-sm shadow-[0_20px_60px_rgba(255,255,255,0.2)] hover:bg-blue-500 hover:text-white transition-all"
							>
								Initiate Build
							</motion.button>
						</Link>
						<Link href="/pricing">
							<motion.button
								whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
								whileTap={{ scale: 0.95 }}
								className="px-20 py-8 rounded-[2rem] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-sm backdrop-blur-xl transition-all"
							>
								Review Plans
							</motion.button>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
