"use client";

import { Loader2, CpuIcon, Zap } from "lucide-react";
import { motion } from "framer-motion";

/**
 * REFINED DEV X LOADER
 * Removed the "Processing Stream" text list as per user request.
 * Now shows a clean, high-fidelity "Active Intelligence" state.
 */
export const MessageLoading = () => {
  return (
    <div className="flex justify-start pb-10 px-4">
      <div className="flex flex-col items-start w-full max-w-[95%] gap-3">

        {/* Identity header */}
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center p-1.5 relative shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <img src="/logo.svg" className="size-full object-contain" alt="DevX Engine" />
              <div className="absolute -top-0.5 -right-0.5 size-2 bg-blue-400 rounded-full border-2 border-black animate-ping" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none">DEV-X ENGINE</span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter tabular-nums pt-1 flex items-center gap-1">
                <Zap size={8} /> ORCHESTRATING SPECIALISTS
              </span>
            </div>
          </div>
        </div>

        {/* Clean Shimmer Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-2xl border border-white/[0.06] overflow-hidden relative group"
          style={{ backgroundColor: '#0c0c0c' }}
        >
          <div className="px-5 py-6 flex items-center gap-4">
             <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="size-5 rounded-full border-2 border-blue-500/20 border-t-blue-500"
              />
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-white tracking-tight">Initializing Pro Generation...</span>
                <span className="text-[11px] text-slate-500">Assembling Agency team and preparing codebase.</span>
              </div>
          </div>

          {/* High-speed progress shimmer at bottom */}
          <div className="h-[2px] w-full relative" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <motion.div
              className="h-full absolute inset-y-0 left-0"
              style={{
                background: 'linear-gradient(90deg, #3b82f6, #a855f7, #06b6d4)',
                boxShadow: '0 0 12px rgba(59,130,246,0.6)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MessageLoading;
