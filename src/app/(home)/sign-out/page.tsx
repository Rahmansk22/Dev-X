"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-950 to-blue-900">
      <div className="glass rounded-3xl shadow-2xl p-10 flex flex-col items-center max-w-sm w-full border border-white/30">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="mb-4 text-blue-400">
          <path fill="currentColor" d="M16.5 12a.75.75 0 0 1 .75-.75h-7.19l2.22-2.22a.75.75 0 1 1 1.06-1.06l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 1 1-1.06-1.06l2.22-2.22h7.19A.75.75 0 0 1 16.5 12Z"/>
        </svg>
        <h1 className="text-2xl font-bold text-white mb-2">Sign Out</h1>
        <p className="text-white/80 mb-6 text-center">Are you sure you want to sign out of your Dev X account?</p>
        <SignOutButton>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 w-full text-lg"
            onClick={() => {
              // Clerk handles sign out, then redirect manually
              setTimeout(() => router.push("/"), 500);
            }}
          >
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
