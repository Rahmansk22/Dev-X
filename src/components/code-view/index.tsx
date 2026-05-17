"use client";

import Prism from "prismjs";
import { useCallback, useState, useEffect, useRef } from "react";
import { CopyCheckIcon, CopyIcon, Code2Icon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import "prismjs/components/prism-markup";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";

import "./code-theme.css";

interface Props {
  code: string;
  lang: string;
  filename?: string;
}

export const CodeView = ({ code, lang, filename }: Props) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, lang]);

  const lines = code.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full w-full bg-[#080808] overflow-hidden"
    >
      {/* SaaS Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0c0c0c] border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-0.5 bg-white/5 rounded border border-white/5">
            <Code2Icon size={12} className="text-blue-400" />
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">{lang}</span>
          </div>
          {filename && (
            <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">{filename}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:bg-white/10"
            )}
          >
            {copied ? (
              <>
                <CopyCheckIcon size={12} /> COPIED
              </>
            ) : (
              <>
                <CopyIcon size={12} /> COPY
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 code-editor-scroll bg-[#080808] relative group/editor w-full overflow-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex min-h-full w-max min-w-full">
          {/* Line Numbers gutter */}
          <div
            className="sticky left-0 z-20 shrink-0 w-12 bg-[#0c0c0c] flex flex-col pt-3 font-mono text-[13px] text-gray-700 select-none text-right pr-3 border-r border-white/5"
            style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.4)" }}
          >
            {lines.map((_, i) => (
              <div key={i} className="h-[22px] leading-[22px]">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Area */}
          <div className="relative bg-[#080808]">
            <pre
              className="m-0 p-3 pt-3 font-mono text-[14px] leading-[22px] bg-transparent"
              style={{ tabSize: 2, whiteSpace: "pre" }}
            >
              <code ref={codeRef} className={`language-${lang}`}>
                {code}
              </code>
            </pre>
            <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-blue-500/[0.02] via-transparent to-transparent opacity-0 group-hover/editor:opacity-100 transition-opacity duration-700" />
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-1.5 bg-[#0c0c0c] border-t border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">IDE MODE</span>
          </div>
          <div className="text-[9px] text-gray-600 font-mono">Lines: {lines.length}</div>
        </div>
        <div className="text-[9px] text-gray-600 font-mono tracking-widest">UTF-8</div>
      </div>
    </motion.div>
  );
};
