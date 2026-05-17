"use client";

import { motion } from "framer-motion";
import { FaAws } from "react-icons/fa6";
import {
  SiClerk,
  SiCloudflare,
  SiDocker,
  SiFirebase,
  SiNextdotjs,
  SiOpenai,
  SiPostman,
  SiReact,
  SiTailwindcss,
  SiTrpc,
  SiPrisma,
  SiClaude,
  SiGooglegemini,
} from "react-icons/si";
import { FiCodesandbox } from "react-icons/fi";

const poweredBy = [
  { name: "Nextjs", tooltip: "Nextjs — React Framework", icon: <SiNextdotjs />, color: "#888888" },
  { name: "Clerk", tooltip: "Clerk — Auth", icon: <SiClerk />, color: "#3B82F6" },
  { name: "OpenAI", tooltip: "OpenAI — GPT 5", icon: <SiOpenai />, color: "#10A37F" },
  { name: "AWS", tooltip: "AWS — Cloud Platform", icon: <FaAws />, color: "#FF9900" },
  { name: "tRPC", tooltip: "tRPC — Type-safe APIs", icon: <SiTrpc />, color: "#2596be" },
  { name: "Cloudflare", tooltip: "Cloudflare — CDN & Security", icon: <SiCloudflare />, color: "#F38020" },
  { name: "Docker", tooltip: "Docker — Containers", icon: <SiDocker />, color: "#2496ED" },
  { name: "e2b", tooltip: "e2b — Code Hosting", icon: <FiCodesandbox />, color: "#F7DF1E" },
  { name: "TailwindCSS", tooltip: "Tailwind CSS — Styling", icon: <SiTailwindcss />, color: "#38BDF8" },
  { name: "Postman", tooltip: "Postman — API Testing", icon: <SiPostman />, color: "#FF6C37" },
  { name: "Prisma", tooltip: "Prisma — Database ORM", icon: <SiPrisma />, color: "#2D3748" },
  { name: "Firebase", tooltip: "Firebase — Backend Platform", icon: <SiFirebase />, color: "#FFCA28" },
  { name: "Claude", tooltip: "Claude — Anthropic LLM", icon: <SiClaude />, color: "#FF6C37" },
  { name: "Gemini", tooltip: "Gemini — Google LLM", icon: <SiGooglegemini />, color: "#4285F4" },
];

export const PoweredBy = () => {
  // Duplicate for seamless loop
  const duplicatedItems = [...poweredBy, ...poweredBy];

  return (
    <div className="w-full relative py-8 select-none">
      {/* Decorative background elements for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent rounded-[2rem] blur-3xl -z-10 h-1/2" />

      {/* The main marquee container with 3D perspective */}
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] py-4 perspective-1000">
        <div className="flex w-full">
          <motion.div
            className="flex gap-20 items-center py-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
            whileHover={{ animationPlayState: "paused" }}
          >
            {duplicatedItems.map((tool, idx) => (
              <motion.div
                key={`${tool.name}-${idx}`}
                className="flex items-center gap-4 group/item relative cursor-pointer"
                initial={{ opacity: 0.3, filter: "grayscale(100%)", scale: 0.9 }}
                whileHover={{
                  opacity: 1,
                  filter: "grayscale(0%)",
                  scale: 1.15,
                  rotateY: 12,
                  rotateX: -8,
                  translateY: -5,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* Subtle tool-specific glow on hover */}
                <div
                  className="absolute inset-0 blur-2xl opacity-0 group-hover/item:opacity-40 transition-opacity duration-500 scale-150"
                  style={{ backgroundColor: tool.color }}
                />

                <div
                  className="text-3xl relative z-10 transition-all duration-300 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  style={{ color: tool.color }}
                >
                  {tool.icon}
                </div>

                <div className="flex flex-col relative z-10">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] group-hover/item:text-white transition-colors duration-300">
                    {tool.name}
                  </span>
                  <span className="text-[7px] text-blue-400/60 font-black uppercase tracking-[0.2em] opacity-0 group-hover/item:opacity-100 transition-all duration-300 -translate-y-1 group-hover/item:translate-y-0">
                    {tool.tooltip.split(' — ')[0]}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
