"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Crown, Sparkles, Zap, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_HIGHLIGHTS = [
  { icon: <Crown className="size-4 text-amber-400" />, text: "Access to DevX Max & Ultimate Engines" },
  { icon: <Sparkles className="size-4 text-blue-400" />, text: "Unlimited Code Generation" },
  { icon: <Zap className="size-4 text-purple-400" />, text: "Priority Multi-Agent Orchestration" },
  { icon: <ShieldCheck className="size-4 text-emerald-400" />, text: "Private Project Deployment" },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgradeClick = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      router.push("/pricing");
      setTimeout(() => {
        setIsRedirecting(false);
        onClose();
      }, 500);
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with extreme blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm overflow-hidden relative rounded-[2rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] pointer-events-auto bg-[#050505] p-1"
            >
              {/* Internal Glows */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

              <div className="relative z-10 bg-[#0a0a0a] rounded-[2.3rem] overflow-hidden">
                {/* Header Section */}
                <div className="relative p-8 pb-4 text-center">
                  {/* Close Button */}
                  <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all z-20"
                  >
                    <X className="size-4" />
                  </button>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 mx-auto">
                    <Sparkles className="size-3.5 text-blue-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Premium Logic Enabled</span>
                  </div>

                  <div className="relative inline-block mb-6">
                     <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse" />
                     <div className="relative size-16 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">
                        <Crown className="size-8 text-white" />
                     </div>
                  </div>

                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-3">
                    Upgrade to <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-500">PRO</span>
                  </h2>
                  <p className="text-gray-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                    Unlock the full potential of DevX and build production-ready apps at warp speed.
                  </p>
                </div>

                {/* Feature Grid - Scrollable with hidden scrollbar */}
                <div className="px-6 py-2">
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-2 hide-scrollbar">
                    {FEATURE_HIGHLIGHTS.map((feature, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all"
                      >
                        <div className="size-6 rounded-lg bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
                          {feature.icon}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-wider transition-colors">
                          {feature.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="p-6 pt-2 flex flex-col gap-3">
                  <Button 
                    disabled={isRedirecting}
                    onClick={handleUpgradeClick}
                    className="h-12 rounded-xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-500 hover:text-white transition-all shadow-2xl relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-2">
                      {isRedirecting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Initializing...</span>
                        </>
                      ) : (
                        "View Pricing Plans"
                      )}
                    </span>
                  </Button>
                  
                  <button 
                    onClick={onClose}
                    className="h-10 text-[9px] font-black text-gray-600 hover:text-gray-400 uppercase tracking-[0.5em] transition-all"
                  >
                    Maybe Later
                  </button>
                </div>

                {/* System Status */}
                <div className="px-8 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">System Ready</span>
                  </div>
                  <span className="text-[8px] font-mono text-gray-700 uppercase">Build v1.4.2_stable</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
