"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Linkedin,
  Instagram,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

// Real X (formerly Twitter) Logo Component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298l13.313 17.404z" />
  </svg>
);

export const Footer = () => {
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);

  const socialLinks = [
    { name: "GitHub", icon: Github, href: "https://github.com", color: "hover:text-white" },
    { name: "X", icon: XIcon, href: "https://x.com", color: "hover:text-white" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com", color: "hover:text-blue-600" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com", color: "hover:text-pink-500" },
  ];

  return (
    <footer className="relative w-full border-t border-white/5 bg-black/50 backdrop-blur-md py-10 mt-20">
      {/* Subtle Top Glow */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="w-full px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">

          {/* Brand & Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logo.svg"
                alt="Dev X"
                width={24}
                height={24}
                className="w-6 h-6 transition-transform group-hover:scale-110"
              />
              <h3 className="text-xl font-black text-white tracking-tighter">
                Dev<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-500"> X</span>
              </h3>
            </Link>
            <p className="text-xs text-gray-600 font-medium">
              © 2026 Dev X. Architecting the future.
            </p>
          </div>

          {/* Center Links */}
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-gray-500 hover:text-white transition-colors font-medium">Terms</Link>
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-white transition-colors font-medium">Privacy</Link>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
              <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Operational</span>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                onMouseEnter={() => setHoveredSocial(social.name)}
                onMouseLeave={() => setHoveredSocial(null)}
                className={cn(
                  "p-2.5 rounded-lg bg-white/3 border border-white/5 text-gray-500 transition-all duration-300 relative group",
                  social.color
                )}
              >
                <social.icon className="size-4 transition-transform group-hover:scale-110" />
                <AnimatePresence>
                  {hoveredSocial === social.name && (
                    <motion.div
                      layoutId="footer-social-glow-slim"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-current opacity-10 blur-md rounded-lg"
                    />
                  )}
                </AnimatePresence>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
};
