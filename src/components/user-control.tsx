"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { SettingsIcon, LogOutIcon, CreditCardIcon, HeartIcon } from "lucide-react";

interface Props {
  showName?: boolean;
}

export function UserControl({ showName }: Props) {
  const { user, isSignedIn } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { has } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const hasProAccess = has?.({ plan: "pro" }) ?? false;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Standard loading state to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="size-9 rounded-xl bg-white/3 border border-white/10 animate-pulse shrink-0" />
    );
  }

  // If not signed in or user data missing, show nothing (or redirect handled by Clerk)
  if (!isSignedIn || !user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group outline-none shrink-0"
        >
          {/* Outer Ring Effect */}
          <div className="absolute -inset-1 bg-linear-to-tr from-blue-600/20 to-purple-600/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative size-9 rounded-xl border border-white/10 overflow-hidden bg-neutral-900 shadow-xl group-hover:border-blue-500/50 transition-colors">
            <Image
              src={user.imageUrl}
              alt={user.fullName || "User"}
              width={36}
              height={36}
              className="size-full object-cover"
              unoptimized
            />
            {/* Online Indicator */}
            <div className="absolute bottom-1 right-1 size-1.5 rounded-full bg-emerald-500 border border-neutral-900 shadow-[0_0_8px_#10b981]" />
          </div>
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-72 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl p-2.5 overflow-hidden ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Profile Header */}
        <div className="flex items-center gap-4 px-3 py-4 bg-white/2 rounded-xl border border-white/5 mb-2">
          <div className="relative shrink-0">
            <div className="absolute -inset-2 bg-blue-500/10 blur-xl rounded-full" />
            <Image
              src={user.imageUrl}
              alt={user.fullName || "User"}
              width={48}
              height={48}
              className="size-12 rounded-xl object-cover border border-white/10 relative z-10"
              unoptimized
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-black text-white text-[13px] uppercase tracking-wider truncate">
              {user.fullName || "Sync Node"}
            </span>
            <span className="text-[10px] text-gray-500 font-bold tracking-widest truncate uppercase opacity-60">
              {user.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>

        <div className="px-1 py-1 space-y-1">
          <DropdownMenuItem
            onClick={() => openUserProfile()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer group focus:bg-white/5 focus:text-white outline-none"
          >
            <SettingsIcon size={16} className="text-gray-600 group-hover:text-blue-400 group-focus:text-blue-400 transition-colors" />
            <span className="text-[11px] font-black uppercase tracking-widest">Account Hub</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push("/pricing")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer group focus:bg-white/5 focus:text-white outline-none"
          >
            <CreditCardIcon size={16} className="text-gray-600 group-hover:text-emerald-400 group-focus:text-emerald-400 transition-colors" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest">Billing & Plan</span>
              <span className="text-[8px] text-gray-600 uppercase font-black tracking-tighter">
                {hasProAccess ? "Pro Level Active" : "Upgrade Plan"}
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/5 mx-2 my-1.5" />

          <DropdownMenuItem
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors cursor-pointer group focus:bg-red-500/10 focus:text-red-400 outline-none"
          >
            <LogOutIcon size={16} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest text-inherit">Terminate Session</span>
          </DropdownMenuItem>
        </div>

        {/* Neural Deco */}
        <div className="mt-2 px-3 py-2 pt-3 border-t border-white/5 flex items-center justify-between opacity-30">
          <div className="flex gap-1">
            <div className="size-1 rounded-full bg-blue-500" />
            <div className="size-1 rounded-full bg-blue-500/40" />
            <div className="size-1 rounded-full bg-blue-500/20" />
          </div>
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">v4.0.2 Stable</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
