"use client";

import Link from "next/link";
import { CrownIcon, ZapIcon, ClockIcon, InfoIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { intervalToDuration } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";

interface Props {
  points: number;
  msBeforeNext: number;
}

export const Usage = ({ points, msBeforeNext }: Props) => {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(msBeforeNext);
  const { has } = useAuth();

  // Animated counter for points with high-stiffness for "Real-time" feel
  const springPoints = useSpring(points, { stiffness: 200, damping: 20 });
  const displayPoints = useTransform(springPoints, (latest) => Math.round(latest));

  useEffect(() => {
    springPoints.set(points);
  }, [points, springPoints]);

  useEffect(() => {
    setMounted(true);
    if (msBeforeNext > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [msBeforeNext]);

  useEffect(() => {
    setTimeLeft(msBeforeNext);
  }, [msBeforeNext]);

  const hasProAccess = useMemo(() => {
    if (!mounted) return false;
    return has?.({ plan: "pro" }) ?? false;
  }, [has, mounted]);

  const [displayVal, setDisplayVal] = useState(points);
  const [isSpending, setIsSpending] = useState(false);

  useEffect(() => {
    const unsubscribe = displayPoints.on("change", (latest) => {
      setDisplayVal(latest);
    });
    return () => unsubscribe();
  }, [displayPoints]);

  useEffect(() => {
    if (points < displayVal) {
      setIsSpending(true);
      const timer = setTimeout(() => setIsSpending(false), 800);
      return () => clearTimeout(timer);
    }
  }, [points, displayVal]);

  const formatTime = () => {
    if (timeLeft <= 0) return "soon";
    const { days, hours, minutes } = intervalToDuration({ start: 0, end: timeLeft });
    const parts = [];
    if (days && days > 0) parts.push(`${days}d`);
    if (hours && hours > 0) parts.push(`${hours}h`);
    if (minutes !== undefined) parts.push(`${minutes}m`);
    return parts.length === 0 ? "soon" : parts.join(" ");
  };

  const maxPoints = hasProAccess ? 500 : 20;
  const creditPercentage = Math.min((points / maxPoints) * 100, 100);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="group relative w-full perspective-1000 z-40"
    >
      <div
        className={cn(
          "relative flex items-center justify-between gap-4 px-4 py-2.5 rounded-2xl border bg-black/40 backdrop-blur-2xl transition-all duration-500 overflow-hidden",
          isSpending
            ? "border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/20"
            : "border-white/[0.06] hover:border-white/[0.12] shadow-xl"
        )}
      >
        {/* 🚀 Real-time Telemetry Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent animate-pulse" />
        </div>

        {/* ⚡ Credit Display Group */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.div
            animate={isSpending ? {
              scale: [1, 1.3, 1],
              rotate: [0, 15, -15, 0],
              filter: ["brightness(1)", "brightness(2)", "brightness(1)"]
            } : {}}
            className={cn(
              "size-8 rounded-xl flex items-center justify-center transition-colors border shadow-inner",
              hasProAccess
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            )}
          >
            <ZapIcon className="size-4 fill-current opacity-80" />

            {/* Spending Burst */}
            <AnimatePresence>
              {isSpending && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-500/40 rounded-xl"
                />
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-black text-white tracking-widest uppercase">
                <span className="font-mono tabular-nums">{displayVal}</span>
                <span className="text-gray-600 ml-1">/ {maxPoints}</span>
              </span>
              <AnimatePresence>
                {isSpending && (
                  <motion.span
                    initial={{ opacity: 0, x: -5, scale: 0.5 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] text-blue-400 font-black tracking-tighter"
                  >
                    -1
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              <ClockIcon size={10} className="text-gray-700" />
              <span>Reset in {formatTime()}</span>
            </div>
          </div>
        </div>

        {/* 📊 Neural Utilization Track (The slim center bar) */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative w-full h-1.5 bg-white/[0.02] border border-white/[0.04] rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${creditPercentage}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "h-full rounded-full relative shadow-[0_0_10px_rgba(59,130,246,0.3)]",
                hasProAccess
                  ? "bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-[length:200%_100%] animate-shimmer"
                  : "bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"
              )}
            />
          </div>
        </div>

        {/* 👑 Action Button */}
        <div className="flex items-center gap-2">
          {!hasProAccess ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                className="h-8 px-4 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl bg-amber-500 hover:bg-amber-600 text-black border-none shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all group/upg"
              >
                <Link href="/pricing" className="flex items-center gap-2">
                  <CrownIcon size={12} className="group-hover/upg:animate-bounce" />
                  <span>Go Pro</span>
                  <ChevronRightIcon size={12} className="opacity-50" />
                </Link>
              </Button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <CrownIcon size={12} className="text-blue-400" />
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Enterprise Tier</span>
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ Low Power Alert Overlay */}
      <AnimatePresence>
        {!hasProAccess && points < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-8 left-0 right-0 p-2 flex items-center justify-center gap-2 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 backdrop-blur-lg border border-red-500/20 rounded-full shadow-2xl">
              <InfoIcon size={10} className="text-red-400 animate-pulse" />
              <span className="text-[8px] font-bold text-red-100 uppercase tracking-widest">Critically low thermal credits. Replenishment required.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

