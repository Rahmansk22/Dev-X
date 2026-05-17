"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { UserControl } from "@/components/user-control";
import { useScroll } from "@/hooks/use-scroll";
import { InteractiveHoverButton } from "@/components/21stdev/interactive-hover-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ArrowRight,
  Cpu,
  Shield,
  Users,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  Zap,
  Activity,
  Brain,
  Globe,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const isScrolled = useScroll();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "DevX Plans", href: "/pricing" },
    { name: "DevX Works", href: "/guide" },
  ];

  const resources = [
    {
      title: "Architecture Manifesto",
      href: "/guide",
      description: "How multi-agent orchestration and E2B sandboxes work.",
      icon: <Brain className="w-5 h-5 text-blue-400" />
    },
    {
      title: "Component Registry",
      href: "/showcase",
      description: "Browse the verified Shadcn and Tailwind v4 library.",
      icon: <Layers className="w-5 h-5 text-purple-400" />
    },
    {
      title: "Pipeline Security",
      href: "/privacy",
      description: "Zod validation, sanitization, and VM isolation protocols.",
      icon: <Shield className="w-5 h-5 text-emerald-400" />
    },
    {
      title: "Developer Hub",
      href: "/careers",
      description: "Join the engineers building autonomous UI systems.",
      icon: <Users className="w-5 h-5 text-amber-400" />
    },
  ];

  if (!mounted) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 h-20 bg-black border-b border-white/5 opacity-0" />
    );
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-20 transition-all duration-700",
        isScrolled
          ? "bg-black/60 backdrop-blur-3xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      {/* Left: Logo with Cinematic Glow */}
      <Link href="/" className="flex items-center gap-4 group relative z-[51]">
        <div className="relative p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all duration-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Image
            src="/logo.svg"
            alt="Dev X"
            width={28}
            height={28}
            className="relative z-10 transition-all duration-1000 group-hover:rotate-[360deg] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        </div>
        <div className="flex flex-col">
          <span className="font-black tracking-[0.3em] uppercase text-white transition-colors duration-500 text-xl group-hover:text-blue-400 hidden sm:block leading-none italic">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500">DEV</span>
            <span className="text-white brightness-125 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]"> X</span>
          </span>
          <span className="hidden sm:block text-[9px] font-black tracking-[0.5em] text-gray-500 group-hover:text-blue-500/50 transition-colors uppercase mt-1">Architectural OS</span>
        </div>
      </Link>

      {/* Center: Desktop Nav (Elite HUD Style) */}
      <nav className="hidden lg:flex items-center gap-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="relative group px-6 py-2 rounded-full transition-all duration-500 text-gray-400 hover:text-white hover:bg-white/5 text-[11px] font-black uppercase tracking-[0.2em] italic"
          >
            {item.name}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-blue-400 group-hover:w-2/3 transition-all duration-500 shadow-[0_0_8px_rgba(96,165,250,1)]" />
          </Link>
        ))}

        {/* Resources Dropdown - High End HUD Overlay */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group relative flex items-center gap-2 px-6 py-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-500 text-[11px] font-black uppercase tracking-[0.2em] italic outline-none">
              Resources
              <ChevronDown className="w-3 h-3 transition-transform duration-500 group-data-[state=open]:rotate-180 text-blue-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-[#050505]/95 border border-white/10 p-0 rounded-[2.5rem] w-[650px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-500"
            align="center"
            sideOffset={22}
          >
            <div className="flex">
              {/* Left Side: Neural Links */}
              <div className="flex-1 p-8 grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3 px-4 mb-4">
                  <Activity className="size-3 text-blue-500" />
                  <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Ecosystem Nodes</div>
                </div>
                {resources.map((item) => (
                  <DropdownMenuItem key={item.title} asChild className="focus:bg-transparent p-0">
                    <Link
                      href={item.href}
                      className="group flex items-center gap-6 p-4 rounded-[1.5rem] transition-all duration-300 hover:bg-white/5 outline-none cursor-pointer border border-transparent hover:border-white/5"
                    >
                      <div className="size-14 rounded-2xl bg-white/5 border border-white/5 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-all flex items-center justify-center shadow-xl">
                        {item.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                          {item.title}
                          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                        </div>
                        <div className="text-[11px] text-gray-500 group-hover:text-gray-400 transition-colors font-medium">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>

              {/* Right Side: Deployment Status / Active Node */}
              <div className="w-64 bg-white/[0.02] border-l border-white/5 p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-300 font-black uppercase tracking-widest">
                    <Activity className="size-3 text-blue-400" />
                    System Status
                  </div>
                  <h4 className="text-2xl font-black text-white leading-[0.9] italic tracking-tighter uppercase">
                    Inngest<br />
                    <span className="text-blue-400">Live</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Event-driven agentic pipeline is fully operational.</p>
                </div>
                <Link
                  href="/showcase"
                  className="relative z-10 w-full py-3 bg-white text-black text-[10px] font-black uppercase text-center rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-xl group/btn overflow-hidden"
                >
                  <span className="relative z-10">Review Protocol</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* Scanline pattern for dropdown */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Right: Interface Controls */}
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-4">
          <SignedOut>
            <SignUpButton>
              <div className="relative group">
                <div className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <InteractiveHoverButton text="Initiate Access" className="scale-90 font-black italic uppercase tracking-widest" />
              </div>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-500 shadow-xl">
              <UserControl />
            </div>
          </SignedIn>
        </div>

        {/* Mobile menu trigger - Industrial Style */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white shadow-xl"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] bg-[#050505]/98 border-white/10 p-0 text-white backdrop-blur-3xl">
            <SheetHeader className="p-8 border-b border-white/5">
              <SheetTitle className="text-left text-white font-black italic uppercase tracking-tighter text-2xl flex items-center gap-3">
                <Image src="/logo.svg" alt="Dev X" width={28} height={28} />
                DevX Terminal
              </SheetTitle>
            </SheetHeader>
            <div className="p-8 flex flex-col gap-12">
              {/* Nav Links */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <Globe className="size-3 text-gray-500" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Navigation Nodes</span>
                </div>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-4xl font-black italic uppercase tracking-tighter hover:text-blue-400 transition-all hover:translate-x-2"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Resources Links */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <Activity className="size-3 text-gray-500" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Protocol Assets</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {resources.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex gap-6 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 active:bg-white/10 transition-all"
                    >
                      <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-xl">
                        {item.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                          {item.title}
                          <ArrowRight className="size-3 text-blue-500" />
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Auth for Mobile */}
              <div className="sm:hidden mt-auto pt-10 border-t border-white/5">
                <SignedOut>
                  <SignUpButton>
                    <Button className="w-full bg-white text-black font-black italic uppercase tracking-widest h-14 rounded-[1.5rem] shadow-2xl hover:bg-blue-500 hover:text-white transition-all">
                      Initiate Final Access
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5 shadow-xl">
                    <UserControl />
                    <span className="text-sm font-black italic uppercase tracking-widest">Architect Profile</span>
                  </div>
                </SignedIn>
              </div>
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default Navbar;
