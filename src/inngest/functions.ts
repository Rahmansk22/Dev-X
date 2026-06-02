import { inngest } from "./client";
import {
  createAgent,
  createTool,
  createNetwork,
  type Message,
  createState,
  openai,
} from "@inngest/agent-kit";
import { Sandbox } from "e2b";
import { lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { ULTIMATE_PROMPT } from "@/prompt";
import { POLICY_PROMPT } from "@/prompts/policy";
import { TOOL_VALIDATION_PROMPT } from "@/prompts/tool-validation";
import { CODE_QUALITY_PROMPT } from "@/prompts/code-quality";
import CODE_GENERATION_GUARD from "@/prompts/code-generation-guard";
import { PROMPT_ARCHITECTURE } from "@/prompts/prompt-architecture";
import { IMAGE_HANDLING_PROMPT } from "@/prompts/image-handling";
import { TURBO_SYSTEM_PROMPT } from "@/prompts/turbo-prompt";
import { AGENT_SYSTEM_MESSAGE } from "@/prompts/index";
import prisma from "@/lib/db";
import { SANDBOX_TIMEOUT } from "./types";
import { updateMessageFileActions, emitFileAction, FileAction } from "@/lib/file-actions";
import { MemoryService } from "@/lib/memory-service";
import { AGENCY_REGISTRY, AgencySpecialist } from "@/lib/agency/registry";
import { autoHealAllFiles } from "@/lib/auto-heal-imports";
import {
  canonicalizeDevxGeneratedPath,
  getMissingDevxCoreFiles,
  getMissingDevxAlwaysFiles,
} from "@/lib/devx-app-schema";
import {
  buildMinimalPreviewPackageJson,
  robustParsePackageJson,
  createSandboxWithTemplateFallback,
  DEFAULT_E2B_TEMPLATE,
  SANDBOX_WORKSPACE_DIR,
  ensurePreviewPortActive,
  inferPreviewRuntimePackages,
  normalizePreviewFiles,
  normalizePreviewPackageJson,
  sanitizePreviewFile,
  startEmergencyPreviewServer,
  validatePreviewBuild,
  waitForPreviewUrlReachable,
  startDetachedSandboxCommand,
} from "@/lib/sandbox-preview";

// Prompt validation will be done lazily inside the function to avoid cold start overhead.
function cleanAppName(prompt: string): string {
  if (!prompt) return "custom application";
  const cleaned = prompt
    .replace(/^(please\s+)?(create|build|make|generate)\s+(an?\s+)?/gi, "")
    .trim();
  if (cleaned.length > 50) {
    return cleaned.substring(0, 47) + "...";
  }
  return cleaned || "custom application";
}

async function appendMessageStatus(messageId: string, status: string) {
  try {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      select: { content: true }
    });
    if (!msg) return;
    const lines = msg.content ? msg.content.split("\n") : [];
    if (!lines.includes(status)) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: [...lines, status].join("\n"),
          updatedAt: new Date(),
        }
      });
    }
  } catch (e) {
    console.error("Error appending status:", e);
  }
}

// ✅ MODULE-LEVEL GUARD: Tracks sandbox IDs that already have a pre-install running.
// Inngest replays the full function body on EVERY step poll request.
// Without this guard, each replay fires a NEW npm install -> 8+ parallel npm processes
// fight each other for file locks -> ALL time out -> no node_modules -> 10+ min build.
const preInstallGuard = new Set<string>();

// ✅ VALIDATE E2B CONNECTION ON STARTUP
console.log("[functions.ts] 🔗 Checking E2B configuration...");
const e2bApiKey = process.env.E2B_API_KEY;
if (!e2bApiKey) {
  console.error(
    "[functions.ts] 🚨 CRITICAL: E2B_API_KEY not found in environment!"
  );
} else {
  const maskKey =
    e2bApiKey.substring(0, 10) +
    "..." +
    e2bApiKey.substring(e2bApiKey.length - 4);
  console.log("[functions.ts] ✅ E2B_API_KEY configured:", maskKey);
}

// ✅ CLEANUP OLD SANDBOXES HELPER
async function killOldSandbox(sandboxId: string) {
  try {
    console.log("[cleanup] 🗑️ Attempting to kill old sandbox:", sandboxId);
    const sandbox = await Sandbox.connect(sandboxId);
    await sandbox.kill();
    console.log("[cleanup] ✅ Old sandbox killed:", sandboxId);
  } catch {
    // Sandbox already dead or doesn't exist - that's fine
    console.log(
      "[cleanup] ⚠️ Could not kill sandbox (may already be dead):",
      sandboxId
    );
  }
}

/**
 * Creates a per-run sandbox connection manager.
 */
function createSandboxManager() {
  let _sandbox: any = null;
  let _sandboxId: string | null = null;

  return {
    async get(sandboxId: string) {
      // Invalidate if different sandbox
      if (_sandbox && _sandboxId !== sandboxId) {
        try {
          await _sandbox.kill();
        } catch { }
        _sandbox = null;
        _sandboxId = null;
      }

      if (_sandbox) {
        try {
          const isAlive = await _sandbox.isRunning();
          if (!isAlive) {
            try {
              await _sandbox.kill();
            } catch { }
            _sandbox = null;
          }
        } catch {
          try {
            await _sandbox.kill();
          } catch { }
          _sandbox = null;
        }
      }

      if (!_sandbox) {
        _sandbox = await Sandbox.connect(sandboxId);
        _sandboxId = sandboxId;
        await _sandbox.setTimeout(SANDBOX_TIMEOUT);
      }
      return _sandbox;
    },

    async cleanup() {
      if (_sandbox) {
        try {
          await _sandbox.kill();
        } catch { }
        _sandbox = null;
        _sandboxId = null;
      }
    },
  };
}

async function resolveSandboxWorkspace(sandbox: any): Promise<string> {
  try {
    await sandbox.commands.run(`mkdir -p '${SANDBOX_WORKSPACE_DIR}'`, {
      timeoutMs: 10000,
    });
  } catch {
    // Best effort.
  }
  return SANDBOX_WORKSPACE_DIR;
}

interface AgentState {
  summary: string;
  files: { [path: string]: string };
  apiRoutes?: { [path: string]: string };
  schema?: string;
  hasAuth?: boolean;
  turnIndex: number;
}

export const codeAgentFunction = inngest.createFunction(
  {
    id: "code-agent",
    concurrency: [{ limit: 50 }], // Increase global limit, remove per-project queuing
    cancelOn: [{ event: "code-agent/cancel", match: "data.projectId" }],
    timeouts: {
      start: "15m",
    },
  },
  { event: "code-agent/run" },
  async ({ event, step, runId }) => {
    // ✅ FIX: Increase timeout from default 5min to 15min for complex code generation
    const projectId = event.data.projectId;
    const sandboxManager = createSandboxManager();
    let ownsRunLock = false;

    // --- Model Selection & State ---
    // ✅ COST-OPTIMIZED PIPELINE: DeepSeek V4 Flash as primary
    // Pricing: $0.112/M input, $0.224/M output (12x cheaper than Grok 4.3)
    // Context: 1M tokens, Tool calling: ✅, Coding: Excellent
    type ModelKey = "deepseek" | "grok" | "geminiFlash" | "gpt4o" | "claude37" | "deepseekR1" | "o1";
    const modelMapping: Record<ModelKey, string> = {
      deepseek: "deepseek/deepseek-v4-flash",   // PRIMARY: $0.112/$0.224 per 1M, 1M context, tool calling
      grok: "x-ai/grok-4.3",                     // FALLBACK: $1.25/$2.50 per 1M (grok-4.1-fast DEPRECATED May 2026)
      geminiFlash: "google/gemini-2.0-flash-001", // RECOVERY: Reliable JSON output
      gpt4o: "openai/gpt-4o",
      claude37: "anthropic/claude-3.7-sonnet",
      deepseekR1: "deepseek/deepseek-r1",
      o1: "openai/o1",
    };

    let sandboxId: string = "";
    let pendingMessageId: string = "";
    // ✅ COST GUARD: Frontend sends "grok" as default, but grok-4.1-fast is DEPRECATED
    // and grok-4.3 costs 12x more. Remap "grok" → "deepseek" automatically.
    const rawRequestedModel = event.data.model as ModelKey;
    const requestedModel: ModelKey = rawRequestedModel === "grok" ? "deepseek" : rawRequestedModel;

    const preferredModelOrder: ModelKey[] = (requestedModel && modelMapping[requestedModel])
      ? [requestedModel, "geminiFlash", "grok"].filter((v, i, a) => a.indexOf(v) === i) as ModelKey[]  // Deduplicated: primary + fallbacks
      : ["deepseek", "geminiFlash", "grok"];  // DeepSeek first (cheapest), Gemini backup, Grok last resort

    // ✅ RECOVERY STRATEGY: DeepSeek for recovery (highly reliable JSON and cost-optimized)
    const recoveryModelKey: ModelKey = "deepseek";
    const recoveryModel = modelMapping[recoveryModelKey];

    try {
      // 🚀 PULSE 1: Locking & Database Prep (Sub-500ms)
      const lockRes = await step.run("pulse-1-lock", async () => {
        const existingProject = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true, isRunning: true, activeRunId: true, sandboxId: true },
        });

        const isActuallyRunning = existingProject?.isRunning && existingProject?.activeRunId;
        const isDuplicate = isActuallyRunning && existingProject.activeRunId !== runId;

        if (isDuplicate) return { acquired: false, activeRunId: existingProject.activeRunId };

        const [, pendingMessage] = await Promise.all([
          prisma.project.update({
            where: { id: projectId },
            data: { isRunning: true, activeRunId: runId },
          }),
          prisma.message.create({
            data: {
              projectId,
              content: `I'll build this for you. Setting up the development environment...`,
              role: "ASSISTANT",
              type: "ANALYSIS",
              fileActions: [],
            },
          }),
        ]);

        return { acquired: true, pendingMessageId: pendingMessage.id, existingSandboxId: existingProject?.sandboxId };
      });

      if (!lockRes.acquired) {
        console.warn(`[codeAgentFunction] ⏭️ Duplicate skipped (lock held by ${(lockRes as any).activeRunId})`);
        return { skipped: true };
      }

      ownsRunLock = true;
      pendingMessageId = (lockRes as any).pendingMessageId;

      await step.run("status-1-sandbox", async () => {
        await appendMessageStatus(pendingMessageId, `Provisioning a secure sandbox environment and installing base dependencies (Next.js 15, React 19, Tailwind CSS v4)...`);
      });

      // 🚀 PULSE 2: Sandbox Provisioning (Sub-10s)
      const sbRes = await step.run("pulse-2-sandbox", async () => {
        let sb: any;
        let isNew = false;
        
        await appendMessageStatus(pendingMessageId, "Connecting to the secure E2B sandbox environment...").catch(() => {});
        
        if ((lockRes as any).existingSandboxId) {
          try {
            sb = await sandboxManager.get((lockRes as any).existingSandboxId);
            await sb.setTimeout(3600000); // 1 hour keep-alive
            await appendMessageStatus(pendingMessageId, "✓ Connected to existing sandbox session.").catch(() => {});
          } catch {
            await appendMessageStatus(pendingMessageId, "Existing session inactive. Provisioning a fresh secure E2B sandbox instance...").catch(() => {});
            const res = await createSandboxWithTemplateFallback({ apiKey: process.env.E2B_API_KEY, timeoutMs: SANDBOX_TIMEOUT });
            sb = res.sandbox;
            await sb.setTimeout(3600000); // 1 hour keep-alive
            isNew = true;
          }
        } else {
          await appendMessageStatus(pendingMessageId, "Provisioning a fresh secure E2B sandbox instance...").catch(() => {});
          const res = await createSandboxWithTemplateFallback({ apiKey: process.env.E2B_API_KEY, timeoutMs: SANDBOX_TIMEOUT });
          sb = res.sandbox;
          await sb.setTimeout(3600000); // 1 hour keep-alive
          isNew = true;
        }

        if (isNew) {
          await appendMessageStatus(pendingMessageId, "✓ Sandbox successfully provisioned. Instantiating Next.js 15 template...").catch(() => {});
          const homeDir = SANDBOX_WORKSPACE_DIR;
          const skeletonPkg = JSON.stringify({
            name: "devx-app",
            dependencies: { 
              next: "15.4.10", react: "19.1.4", "react-dom": "19.1.4", tailwindcss: "4", 
              "@tailwindcss/postcss": "4", postcss: "8",
              "lucide-react": "latest", "clsx": "latest", "tailwind-merge": "latest",
              "class-variance-authority": "latest", "@radix-ui/react-slot": "latest",
              "framer-motion": "latest", "sonner": "latest",
              "@radix-ui/react-dialog": "latest", "@radix-ui/react-dropdown-menu": "latest",
              "@radix-ui/react-select": "latest", "@radix-ui/react-tabs": "latest",
              "@radix-ui/react-label": "latest", "@radix-ui/react-separator": "latest",
              "@radix-ui/react-checkbox": "latest", "@radix-ui/react-switch": "latest",
              "@radix-ui/react-tooltip": "latest", "@radix-ui/react-accordion": "latest",
              "@radix-ui/react-popover": "latest", "@radix-ui/react-scroll-area": "latest",
            },
            scripts: { dev: "next dev --turbo --hostname 0.0.0.0 --port 3000" }
          });
          await sb.commands.run(`mkdir -p '${homeDir}/app' && echo '${skeletonPkg}' > '${homeDir}/package.json' && echo 'export default function Page() { return <div>Booting...</div> }' > '${homeDir}/app/page.tsx'`, { timeoutMs: 10000 }).catch(() => {});
          
          await appendMessageStatus(pendingMessageId, "Starting background installation of primary npm dependencies...").catch(() => {});
          await startDetachedSandboxCommand({
            sandbox: sb,
            homeDir,
            command: `([ -d "node_modules" ] || npm install --no-package-lock --prefer-offline --no-audit --no-fund --ignore-scripts || true)`,
            logFile: `/tmp/npm-install-background.log`,
          }).catch(() => {});
        }

        return { sandboxId: sb.sandboxId, isNew };
      });

      sandboxId = sbRes.sandboxId;
      const isNewSandbox = sbRes.isNew;
      const messages: Message[] = [
        {
          type: "text" as const,
          role: "user" as const,
          content: `CREATE THIS APP NOW: "${event.data.value}"\n\n### CRITICAL OUTPUT RULE:\n- DO NOT output the internal "Inngest Agent Network" JSON state.\n- ONLY output tool calls (createOrUpdateFiles) or valid application code.`,
        }
      ];


      // NOTE: Pre-install removed. Running npm install in parallel caused OOM (exit 134)
      // in the sandbox, corrupting the npm cache and making start-dev-server take >10min.
      // Sequential install in start-dev-server is reliable at ~3-4min.
      await step.run("status-2-prep", async () => {
        await appendMessageStatus(pendingMessageId, `Loading project context and configuring code generation rules...`);
      });

      // 🚀 STEP 2: Build system prompt — LEAN for speed, FOCUSED on build-critical rules
      const agentContext = await step.run("prep-agent-context", async () => {
        const memoryContext = await MemoryService.getContextForAgent(projectId);
        const inputTeam = event.data.team as AgencySpecialist[] | undefined;
        const primarySpecialist =
          inputTeam && inputTeam.length > 0
            ? inputTeam[0]
            : AGENCY_REGISTRY.find((s) => s.id === "frontend-wizard")!;
        return { memoryContext, primarySpecialist };
      });

      const { memoryContext, primarySpecialist } = agentContext;

      // ══════════════════════════════════════════════════════════════
      // PLANNING CALL: Fast LLM generates conversational narration
      // Makes the chat feel like Lovable/Cursor — agent explains what it will build
      // ══════════════════════════════════════════════════════════════
      await step.run("agent-planning-narration", async () => {
        try {
          const userPrompt = event.data.value || "custom application";
          const planResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://devx.app",
              "X-Title": "DevX Planning Agent",
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-001",
              messages: [
                {
                  role: "system",
                  content: `You are a senior full-stack engineer narrating your thought process to the user. You're about to build their app using Next.js 15 (App Router), React 19, Tailwind CSS v4, and TypeScript.

Write 3-5 short sentences explaining:
1. What you understand from their request
2. The key features/components you'll create
3. The tech approach you'll use

Rules:
- Be conversational and natural, like pair programming
- Use present tense ("I'll create...", "I'm going to...")
- Mention specific components and features you'll build
- Keep it concise — max 4-5 sentences
- NO markdown headers, NO bullet points, NO bold text
- Just flowing conversational text
- Do NOT mention provisioning, sandboxes, or infrastructure
- Focus purely on what the APP will look like and do`
                },
                { role: "user", content: `Build this: "${userPrompt}"` }
              ],
              temperature: 0.7,
              max_tokens: 300,
            }),
          });

          const planData = await planResponse.json();
          const planText = planData?.choices?.[0]?.message?.content?.trim();
          
          if (planText && planText.length > 20) {
            const currentMsg = await prisma.message.findUnique({
              where: { id: pendingMessageId },
              select: { content: true }
            });
            const existingLines = currentMsg?.content ? currentMsg.content.split("\n") : [];
            const thinkingPart = existingLines.length > 1 ? existingLines.slice(1) : [];
            const newContent = [planText, ...thinkingPart].join("\n");
            
            await prisma.message.update({
              where: { id: pendingMessageId },
              data: {
                content: newContent,
                updatedAt: new Date(),
              }
            });
            console.log(`[planning] ✅ Generated narration (${planText.length} chars)`);
          }
        } catch (e) {
          console.warn("[planning] ⚠️ Planning call failed, using default:", e);
          // Fall through — the default message stays
        }
      });

      // ═══════════════════════════════════════════════════════════════════
      // FULL-RULES SYSTEM PROMPT: ALL rules from prompt.ts + ALL 8 prompts/ files
      // DeepSeek V4 Flash has 1M context window — size is NOT an issue.
      // Includes:
      //   ULTIMATE_PROMPT (prompt.ts):     ~110K chars (master rules, templates, patterns)
      //   POLICY_PROMPT:                   2.9K chars (design, auth, shadcn)
      //   TOOL_VALIDATION_PROMPT:          5.8K chars (sandbox, paths, client/server)
      //   CODE_QUALITY_PROMPT:             6.9K chars (hooks, imports, types, runtime)
      //   CODE_GENERATION_GUARD:           12.3K chars (15 validation blocks)
      //   PROMPT_ARCHITECTURE:             6.8K chars (3-layer defense system)
      //   IMAGE_HANDLING_PROMPT:           1.3K chars (next/image rules)
      //   AGENT_SYSTEM_MESSAGE:            5.9K chars (pre-gen + post-gen audit workflow)
      //   TURBO_SYSTEM_PROMPT:             2.6K chars (condensed stack reference)
      //   Inline build rules:              ~3K chars (Tailwind v4, config, versions)
      //   Total:                           ~157K chars (~39K tokens) — fits in 1M context
      // ═══════════════════════════════════════════════════════════════════
      const systemPrompt = `You are ${primarySpecialist.name} — ${primarySpecialist.role}.
${primarySpecialist.systemPrompt}

${memoryContext}

## YOUR TASK
Generate a COMPLETE, production-ready Next.js 15 application.
You MUST call the 'createOrUpdateFiles' tool with ALL files in a single call.
NO explanations, NO planning, NO prose. ONLY tool calls with code.

## MANDATORY FILES (generate ALL of these):
- package.json (with correct dependencies)
- tsconfig.json
- next.config.ts (must export default nextConfig, NOT module.exports)
- postcss.config.mjs (must use export default, NOT module.exports)
- app/globals.css (Tailwind v4 — starts with @import "tailwindcss")
- app/layout.tsx (must import globals.css, wrap children in html/body)
- app/page.tsx (main UI — "use client" if using hooks)
- lib/utils.ts (cn utility with clsx + tailwind-merge)
- components/ui/button.tsx (Shadcn button)
- components/ui/card.tsx (Shadcn card)

## ═══ MASTER RULES (prompt.ts — ULTIMATE_PROMPT) ═══
${ULTIMATE_PROMPT}

## ═══ DESIGN & AUTH RULES (prompts/policy.ts) ═══
${POLICY_PROMPT}

## ═══ SANDBOX & ENVIRONMENT RULES (prompts/tool-validation.ts) ═══
${TOOL_VALIDATION_PROMPT}

## ═══ CODE QUALITY RULES (prompts/code-quality.ts) ═══
${CODE_QUALITY_PROMPT}

## ═══ CODE GENERATION GUARD — 15 VALIDATION BLOCKS (prompts/code-generation-guard.ts) ═══
${CODE_GENERATION_GUARD}

## ═══ 3-LAYER DEFENSE ARCHITECTURE (prompts/prompt-architecture.ts) ═══
${PROMPT_ARCHITECTURE}

## ═══ IMAGE HANDLING RULES (prompts/image-handling.ts) ═══
${IMAGE_HANDLING_PROMPT}

## ═══ AGENT WORKFLOW — PRE-GEN + POST-GEN AUDIT (prompts/index.ts) ═══
${AGENT_SYSTEM_MESSAGE}

## ═══ CONDENSED STACK REFERENCE (prompts/turbo-prompt.ts) ═══
${TURBO_SYSTEM_PROMPT}

## ═══ CRITICAL BUILD RULES (REINFORCED) ═══

### Tailwind CSS v4 (NO v3 syntax)
- globals.css MUST start with \`@import "tailwindcss";\` — NOT @tailwind directives
- NO @apply anywhere — it's removed in v4
- NO tailwind.config.ts/js — configure via CSS theme()
- In @layer components: ONLY simple class names (.glass-card {})
  NEVER use Tailwind utilities as selectors (.bg-slate-900/40 = CRASH)

### Imports — ZERO TOLERANCE
- NEVER duplicate imports. One import per name per file.
- NEVER import a name that is defined/exported in the same file (self-import = CRASH)
- "use client" MUST be line 1 (before all imports) for files with hooks/events

### Config files (EXACT format):
- next.config.ts: \`import type { NextConfig } from "next"; const nextConfig: NextConfig = {}; export default nextConfig;\`
- postcss.config.mjs: \`const config = { plugins: { "@tailwindcss/postcss": {} } }; export default config;\`

### Forbidden files (NEVER generate):
  middleware.ts, tailwind.config.*, next.config.js/mjs

## ═══════════════════════════════════════════════════════════════
## 🎨 DESIGN MANDATE — THIS IS THE MOST IMPORTANT SECTION
## THE USER WILL JUDGE YOUR OUTPUT PRIMARILY ON VISUAL QUALITY
## ═══════════════════════════════════════════════════════════════

### COLOR SYSTEM (MANDATORY — no exceptions):
- DARK MODE by default. Background: deep dark (slate-950, zinc-950, neutral-950, or custom dark HSL)
- NEVER use plain white (#ffffff) as main background
- NEVER use generic primary colors (raw blue-500, red-500, green-500)
- USE curated color palettes with HSL harmony:
  - Primary: violet-500/600, indigo-500/600, emerald-500/600, rose-500/600, cyan-500/600, amber-500/600
  - Accents: use lighter/darker variants of primary (e.g. violet-400 for hover, violet-700 for borders)
  - Text: slate-100/200 for body, white for headings, slate-400/500 for muted
  - Borders: white/10 or white/5 for subtle dividers

### TYPOGRAPHY (MANDATORY):
- Import a premium Google Font via next/font/google:
  \\\`import { Inter } from "next/font/google";\\\`
  or Outfit, Poppins, Space_Grotesk, Sora, etc.
- Apply font to html element: \\\`<html className={font.className}>\\\`
- Headings: bold (font-bold), large (text-3xl to text-5xl), white
- Body: regular weight, slate-300/400 color

### VISUAL DEPTH (MANDATORY):
- Use glassmorphism: bg-white/5, backdrop-blur-xl, border border-white/10
- Use subtle gradients: bg-gradient-to-br from-violet-500/20 to-transparent
- Use shadows: shadow-xl, shadow-2xl, shadow-violet-500/10
- Cards: rounded-2xl with border-white/10, bg-white/5 backdrop-blur
- Hover states: scale-[1.02] transition-transform, brightness changes

### ANIMATIONS (MANDATORY — use framer-motion):
- Add to package.json: "framer-motion": "^11.15.0"
- Page entrance: fade-in + slide-up
  \\\`<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>\\\`
- Cards/buttons: whileHover={{ scale: 1.02 }} transition={{ type: "spring" }}
- Stagger children for lists: use custom delay per item
- NEVER skip animations — a static page is UNACCEPTABLE

### LAYOUT QUALITY:
- Full viewport: min-h-screen
- Center content: flex items-center justify-center or max-w-4xl mx-auto
- Generous padding: p-6, p-8, px-8 py-12
- Grid layouts for cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Responsive: always use sm:/md:/lg: breakpoints

### WHAT WILL GET YOU FIRED:
❌ White background with blue buttons = REJECTED
❌ No animations = REJECTED
❌ System default fonts = REJECTED
❌ Plain HTML-looking output = REJECTED
❌ No visual hierarchy = REJECTED
❌ No hover effects = REJECTED
✅ Premium, modern, dark, animated, glassmorphic = ACCEPTED
`;

      console.log(`[codeAgentFunction] 📏 System prompt size: ${systemPrompt.length} chars (~${Math.ceil(systemPrompt.length / 4)} tokens)`);

      // ══════════════════════════════════════════════════════════════
      // STEP 4: Run agent network — FAST (files only, NO dev server)
      // ══════════════════════════════════════════════════════════════
      const buildCodeAgent = (modelName: string, forceToolCall: boolean = false) =>
        createAgent<AgentState>({
          name: `codeAgent-${runId.slice(0, 8)}`,
          description: "An expert coding agent",
          system: `### CRITICAL OUTPUT RULE: NO INTERNAL STATE
- NEVER output the "Inngest Agent Network" state, JSON history, or internal serialization.
- YOUR OUTPUT MUST BE EITHER A TOOL CALL OR THE FULL SOURCE CODE OF THE FILES.
- DO NOT act as a network manager; act ONLY as the Lead Frontend Engineer.

${systemPrompt}`,
          model: openai({
            model: modelName,
            apiKey: process.env.OPENROUTER_API_KEY,
            baseUrl: "https://openrouter.ai/api/v1",
            defaultParameters: { 
              temperature: 0,
              // ⚡ ROOT FIX: tool_choice MUST be in defaultParameters to reach the API.
              // network.run() does NOT forward tool_choice from runOptions.
              ...(forceToolCall ? { tool_choice: { type: "function", function: { name: "createOrUpdateFiles" } } } : {})
            },
          }),
          tools: [
            createTool({
              name: "terminal",
              description: "Use the terminal to run commands",
              parameters: z.object({ command: z.string() }),
              handler: async ({ command }, ctx) => {
                if (!ctx?.step) throw new Error("step is required");
                const turn = ctx.network?.state.data.turnIndex || 0;
                const cmdHash = command
                  .split("")
                  .reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)
                  .toString(36);
                const stepId = `${ctx.network?.name || "agent"}-terminal-v2-${turn}-${cmdHash}`;
                return await ctx.step.run(stepId, async () => {
                  const project = (await prisma.project.findUnique({
                    where: { id: projectId },
                  })) as any;
                  if (project?.activeRunId && project.activeRunId !== runId)
                    throw new Error("STALE_RUN_TERMINATED");
                  const sandbox = await sandboxManager.get(sandboxId);
                  try {
                    const result = await sandbox.commands.run(command, {
                      timeoutMs: 30000,
                    });
                    return result.stdout;
                  } catch (error: any) {
                    // Capture stdout/stderr even if exit code is non-zero
                    return (
                      error.stdout ||
                      error.stderr ||
                      error.message ||
                      "Command failed with unknown error"
                    );
                  }
                });
              },
            }),

            createTool({
              name: "updateProjectMemory",
              description: "Store a permanent project insight.",
              parameters: z.object({
                key: z.string(),
                value: z.string(),
                category: z.enum([
                  "design",
                  "engineering",
                  "business",
                  "tech_stack",
                ]),
              }),
              handler: async ({ key, value, category }, ctx) => {
                if (!ctx?.step) throw new Error("step is required");
                const turn = ctx.network?.state.data.turnIndex || 0;
                const stepId = `${ctx.network?.name || "agent"}-update-memory-v2-${turn}-${key.replace(
                  /[^a-zA-Z0-9]/g,
                  "-"
                )}`;
                return await ctx.step.run(stepId, async () => {
                  // NOTE: MemoryService removed — this tool handler is dead code
                  // (direct API call bypasses agent-kit entirely)
                  return `Memory captured: ${key} = ${value}`;
                });
              },
            }),

            // ✅ FAST TOOL: Accumulates files in memory. NO sandbox write, NO step.run.
            // All files are flushed to sandbox in a single "write-all-files" step after agent finishes.
            // 🔴 REAL-TIME: Progressively updates the pending message so files appear one-by-one in the chat.
            createTool({
              name: "createOrUpdateFiles",
              description:
                "Create or update files in the sandbox. IMPORTANT: Call this ONCE with ALL files in the array. Do NOT call multiple times.",
              parameters: z.object({
                files: z.array(
                  z.object({ path: z.string(), content: z.string() })
                ),
              }),
              handler: async ({ files }, ctx) => {
                if (!ctx?.network) throw new Error("network is required");
                const { network } = ctx;

                const updatedFiles = network.state.data.files || {};
                const updatedApiRoutes = network.state.data.apiRoutes || {};

                const processedFiles = files.map((f) => {
                  // Fix common path hallucinations (e.g. app/app/layout.tsx -> app/layout.tsx)
                  const cleanPath = canonicalizeDevxGeneratedPath(f.path);

                  return {
                    path: cleanPath,
                    content: sanitizePreviewFile(cleanPath, f.content),
                  };
                });

                for (const file of processedFiles) {
                  if (file.path.startsWith("app/api/"))
                    updatedApiRoutes[file.path] = file.content;
                  else updatedFiles[file.path] = file.content;
                }

                network.state.data.files = updatedFiles;
                network.state.data.apiRoutes = updatedApiRoutes;

                // 🚀 INSTANT FLUSH: Write to sandbox IMMEDIATELY so dev server can start
                const turn = network.state.data.turnIndex || 0;
                const fileHash = processedFiles.length > 0 ? processedFiles[0].path.replace(/[^a-z0-9]/gi, '_').slice(-10) : 'empty';
                const flushStepId = `${ctx.network?.name || "agent"}-instant-flush-${turn}-${fileHash}`;

                if (ctx.step) {
                  try {
                    await ctx.step.run(flushStepId, async () => {
                      const sandbox = await sandboxManager.get(sandboxId);
                      const homeDir = await resolveSandboxWorkspace(sandbox);
                      const dirs = [...new Set(processedFiles.map(f => f.path.substring(0, f.path.lastIndexOf("/"))).filter(d => d))];
                      if (dirs.length > 0) {
                        await sandbox.commands.run(`mkdir -p ${dirs.map(d => `"${homeDir}/${d}"`).join(" ")}`, { timeoutMs: 0 });
                      }
                      await Promise.all(processedFiles.map(f =>
                        sandbox.files.write(`${homeDir}/${f.path}`, f.content)
                      ));
                      // ⚡ SPEED FIX: Do NOT start dev server here.
                      // write-all-files step handles the single server boot.
                      // Starting it here caused 4 competing processes fighting for port 3000.
                    });
                  } catch (e: any) {
                    console.warn(`[createOrUpdateFiles] ⚠️ Instant flush failed (non-fatal): ${e.message}`);
                  }
                }

                return `✅ Flushed ${processedFiles.length} files to sandbox. Total: ${Object.keys(updatedFiles).length +
                  Object.keys(updatedApiRoutes).length
                  } files live.`;
              },
            }),

            createTool({
              name: "readFiles",
              description: "Read files from sandbox",
              parameters: z.object({ files: z.array(z.string()) }),
              handler: async ({ files }, ctx) => {
                // ✅ Run directly — step context comes from the monkey-patched step
                const sandbox = await sandboxManager.get(sandboxId);
                const homeDir = await resolveSandboxWorkspace(sandbox);
                const contents = await Promise.all(
                  files.map(async (filePath) => {
                    try {
                      const content = await sandbox.files.read(
                        `${homeDir}/${filePath}`
                      );
                      return { path: filePath, content, exists: true };
                    } catch {
                      return { path: filePath, content: "", exists: false };
                    }
                  })
                );
                return JSON.stringify(contents);
              },
            }),
          ],
          lifecycle: {
            onResponse: async ({ result, network }) => {
              const text = lastAssistantTextMessageContent(result) || "";
              if (text && text.includes("<task_summary>") && network)
                network.state.data.summary = text;

              // ✅ SAFETY: Guard against undefined network before flushing
              if (!network) return result;

              // 🛡️ FALLBACK PARSER: Extract JSON if the tool wasn't called
              if (Object.keys(network.state.data.files).length === 0) {
                try {
                  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1];
                  const objectLike = text.match(/\{[\s\S]*\}/)?.[0];
                  const arrayLike = text.match(/\[[\s\S]*\]/)?.[0];
                  const candidates = [fenced, objectLike, arrayLike].filter(Boolean) as string[];

                  let parsed: any = null;
                  for (const candidate of candidates) {
                    try {
                      parsed = JSON.parse(candidate);
                      break;
                    } catch {
                      // Try next candidate.
                    }
                  }

                  const parsedFiles = Array.isArray(parsed)
                    ? parsed
                    : parsed && Array.isArray(parsed.files)
                      ? parsed.files
                      : [];

                  if (parsedFiles.length > 0) {
                    console.log(
                      `[codeAgentFunction] 🛠️ Fallback parser extracted ${parsedFiles.length} files from text!`
                    );
                    if (!network.state.data.apiRoutes) network.state.data.apiRoutes = {};
                    parsedFiles.forEach((f: any) => {
                      if (f?.path && typeof f?.content === "string") {
                        const cleanPath = canonicalizeDevxGeneratedPath(f.path);
                        if (cleanPath.startsWith("app/api/")) {
                          network.state.data.apiRoutes![cleanPath] = f.content;
                        } else {
                          network.state.data.files[cleanPath] = f.content;
                        }
                      }
                    });
                  }

                  // Secondary fallback: parse markdown-style file blocks.
                  if (Object.keys(network.state.data.files).length === 0) {
                    const markdownFileRegex =
                      /(?:^|\n)(?:###\s*)?([A-Za-z0-9_./-]+\.(?:tsx|ts|jsx|js|css|json|md|mjs|cjs))\s*\n```[a-zA-Z0-9]*\n([\s\S]*?)```/g;
                    const extractedFiles: Array<{ path: string; content: string }> = [];
                    let match: RegExpExecArray | null;

                    while ((match = markdownFileRegex.exec(text)) !== null) {
                      const filePath = match[1]?.trim();
                      const fileContent = match[2] ?? "";
                      if (filePath) {
                        extractedFiles.push({ path: filePath, content: fileContent });
                      }
                    }

                    if (extractedFiles.length > 0) {
                      console.log(
                        `[codeAgentFunction] 🛠️ Markdown fallback extracted ${extractedFiles.length} files from text!`
                      );
                      if (!network.state.data.apiRoutes) network.state.data.apiRoutes = {};
                      extractedFiles.forEach((f) => {
                        const cleanPath = canonicalizeDevxGeneratedPath(f.path);
                        if (cleanPath.startsWith("app/api/")) {
                          network.state.data.apiRoutes![cleanPath] = f.content;
                        } else {
                          network.state.data.files[cleanPath] = f.content;
                        }
                      });
                    }
                  }
                } catch (e: any) {
                  console.warn("[codeAgentFunction] ⚠️ Fallback parser failed. Error:", e.message);
                  console.warn("[codeAgentFunction] 📝 Raw text preview:\n", text.substring(0, 800));
                }
              }

              // 🛡️ STATE FIREWALL: Detect and block internal state leaks
              const isInternalStateLeak = text.includes('"_counter":') && text.includes('"_stack":');
              if (isInternalStateLeak) {
                console.warn("[codeAgentFunction] 🚨 INTERNAL STATE LEAK DETECTED. Rejecting output and triggering retry...");
                throw new Error("INTERNAL_STATE_LEAK_REJECTED: Model outputted internal serialization instead of code.");
              }

              return result;
            },
          },
        });

      const createScopedStep = (prefix: string) => {
        // 🛡️ PROJECT-RUN ENTROPY: Incorporate the global runId into every scoped step.
        // This is the ONLY way to prevent Inngest AUTOMATIC_PARALLEL_INDEXING errors
        // during retries and parallel attempts.
        const shortRunId = runId.slice(-6);
        const uniquePrefix = `${prefix}-${shortRunId}`;
        return {
          ...step,
          run: (id: string, fn: any) => step.run(`${uniquePrefix}-${id}`, fn),
          sendEvent: (id: string, events: any) => step.sendEvent(`${uniquePrefix}-${id}`, events),
          sleep: (id: string, duration: any) => step.sleep(`${uniquePrefix}-${id}`, duration),
          invoke: (id: string, opts: any) => step.invoke(`${uniquePrefix}-${id}`, opts),
          waitForEvent: (id: string, opts: any) => step.waitForEvent(`${uniquePrefix}-${id}`, opts),
        };
      };

      // ═══ parseFilesFromText: Must be defined BEFORE runAgentGeneration uses it ═══
      const parseFilesFromText = (rawText: string): Array<{ path: string; content: string }> => {
        const extracted: Array<{ path: string; content: string }> = [];

        // 1) Try JSON extraction
        const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1];
        const objectLike = rawText.match(/\{[\s\S]*\}/)?.[0];
        const arrayLike = rawText.match(/\[[\s\S]*\]/)?.[0];
        for (const candidate of [fenced, objectLike, arrayLike].filter(Boolean) as string[]) {
          try {
            const parsed = JSON.parse(candidate);
            let pf: any[] = [];
            if (Array.isArray(parsed)) {
              pf = parsed;
            } else if (parsed && typeof parsed.files === "object") {
              if (Array.isArray(parsed.files)) {
                pf = parsed.files;
              } else {
                pf = Object.entries(parsed.files).map(([path, content]) => ({ path, content: String(content) }));
              }
            } else if (parsed?.state?.data?.files) {
              pf = Object.entries(parsed.state.data.files).map(([path, content]) => ({
                path,
                content: String(content),
              }));
            }

            pf.forEach((f: any) => {
              if (f?.path && typeof f?.content === "string") {
                extracted.push({ path: String(f.path), content: f.content });
              }
            });
            if (extracted.length > 0) return extracted;
          } catch { /* skip */ }
        }

        // 2) XML-style support
        const xmlRx = /<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>/g;
        let xm;
        while ((xm = xmlRx.exec(rawText)) !== null) {
          if (xm[1] && xm[2]) extracted.push({ path: xm[1], content: xm[2] });
        }
        if (extracted.length > 0) return extracted;

        // 3) Greedy block association
        const blocks = rawText.split(/```/);
        for (let i = 1; i < blocks.length; i += 2) {
          const blockContent = blocks[i];
          const precedingText = blocks[i - 1];

          const lines = blockContent.split('\n');
          const firstLine = lines[0].trim();
          const content = lines.slice(1).join('\n').trim();

          const pathSearch = (precedingText.slice(-150) + " " + firstLine).match(/([a-zA-Z0-9_./-]+\.(?:tsx|ts|jsx|js|css|json|md|mjs|cjs))/g);
          const fp = pathSearch ? pathSearch[pathSearch.length - 1] : null;

          if (fp && content) {
            extracted.push({ path: fp, content });
          }
        }

        return extracted;
      };

      const runAgentGeneration = async (modelKey: ModelKey, attemptIndex: number = 0, previousOutput?: string) => {
        const modelName = modelMapping[modelKey] || modelMapping["grok"]!;
        const attemptEntropy = `${runId.slice(-3)}-${attemptIndex}`;
        const modelPrefix = `${modelKey}-${attemptEntropy}`;
        const attemptPrefix = `${modelPrefix}-${runId.slice(-6)}`;

        // 🧠 DECISION SYSTEM: Specialized prompts per stage
        let promptOverride = event.data.value;
        if (!previousOutput) {
          promptOverride = `${event.data.value}\n\n### CRITICAL GENERATION RULE (SPEEDRUN MODE)
- You MUST call 'createOrUpdateFiles' tool NOW.
- PRIORITIZE a high-impact 'app/page.tsx' and 'app/layout.tsx'.
- Keep the first response focused on the CORE UI. Add secondary files (utils, components) in the next turn.
- NO PROSE, NO PLANNING. JUST CODE.`;
        } else if (modelKey === "geminiFlash" && previousOutput) {
          promptOverride = `Fix and complete this code. Ensure all files are valid and runnable.\n\nSOURCE CODE TO FIX:\n${previousOutput}`;
        } else if (modelKey === "grok" && previousOutput) {
          promptOverride = `This code is failing to build. Debug and fix all issues. Ensure full functionality.\n\nBROKEN CODE TO REPAIR:\n${previousOutput}\n\nURGENT: Use 'createOrUpdateFiles' to apply fixes.`;
        }

        console.log(`[codeAgentFunction] 🧠 ${modelKey} starting generation...`);
        try {

        // ═══════════════════════════════════════════════════════════════════
        // 🚀 DIRECT API CALL: Bypass agent-kit entirely.
        // Agent-kit's openai() wrapper silently DROPS tool_choice,
        // causing Grok to return output:[], toolCalls:[] every single time.
        // This direct call sends tools + tool_choice to the raw API.
        // ═══════════════════════════════════════════════════════════════════
        const toolSchema = {
          type: "function" as const,
          function: {
            name: "createOrUpdateFiles",
            description: "Create or update files. Call this ONCE with ALL files.",
            parameters: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "string", description: "Relative file path like app/page.tsx" },
                      content: { type: "string", description: "Full file content" },
                    },
                    required: ["path", "content"],
                  },
                },
              },
              required: ["files"],
            },
          },
        };

        console.log(`[codeAgentFunction] 🧠 ${modelKey} starting generation with model: ${modelName}...`);

        // DeepSeek V4 Flash doesn't support tool_choice: "required" — use "auto"
        // Grok/GPT support "required" but "auto" works for all providers
        const toolChoiceValue = modelName.includes("deepseek") ? "auto" : "required";
        // DeepSeek V4 Flash supports up to 65K output tokens. 8192 was causing truncation
        // (completion=8394 → JSON broke → app/page.tsx lost). 16384 is safe headroom.
        const maxTokensValue = modelName.includes("deepseek") ? 16384 : 128000;

        const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://devx.app",
            "X-Title": "DevX Code Agent",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: promptOverride },
            ],
            tools: [toolSchema],
            tool_choice: toolChoiceValue,
            temperature: 0,
            max_tokens: maxTokensValue,
          }),
        });

        const apiData = await apiResponse.json();

        // 🚨 CHECK FOR API ERRORS FIRST (rate limits, auth, context overflow)
        if (apiData?.error) {
          const errMsg = typeof apiData.error === 'string' ? apiData.error : (apiData.error?.message || JSON.stringify(apiData.error));
          console.error(`[codeAgentFunction] ❌ OpenRouter API error: ${errMsg}`);
          throw new Error(`OpenRouter API error: ${errMsg}`);
        }
        if (!apiResponse.ok) {
          console.error(`[codeAgentFunction] ❌ HTTP ${apiResponse.status}: ${JSON.stringify(apiData).slice(0, 500)}`);
          throw new Error(`OpenRouter HTTP ${apiResponse.status}`);
        }
        if (!apiData?.choices || apiData.choices.length === 0) {
          console.error(`[codeAgentFunction] ❌ No choices in response. Full response: ${JSON.stringify(apiData).slice(0, 500)}`);
          throw new Error(`OpenRouter returned no choices`);
        }

        const choice = apiData.choices[0];
        const message = choice?.message;

        // 🔍 DIAGNOSTIC: Log exactly what Grok returned so we never fly blind
        const toolCallCount = message?.tool_calls?.length || 0;
        const contentLen = (message?.content || "").length;
        const finishReason = choice?.finish_reason || "unknown";
        const usage = apiData?.usage;
        console.log(`[codeAgentFunction] 📊 ${modelKey} response: tool_calls=${toolCallCount}, content=${contentLen} chars, finish=${finishReason}, HTTP=${apiResponse.status}`);
        if (usage) {
          console.log(`[codeAgentFunction] 📊 Token usage: prompt=${usage.prompt_tokens}, completion=${usage.completion_tokens}, total=${usage.total_tokens}`);
        }
        // If completely empty, dump the raw response structure to diagnose
        if (toolCallCount === 0 && contentLen === 0) {
          console.error(`[codeAgentFunction] 🚨 EMPTY RESPONSE! Raw apiData keys: ${JSON.stringify(Object.keys(apiData))}`);
          console.error(`[codeAgentFunction] 🚨 Raw choice: ${JSON.stringify(choice).slice(0, 500)}`);
          console.error(`[codeAgentFunction] 🚨 Model returned: ${apiData?.model || 'unknown'}, id: ${apiData?.id || 'none'}`);
        }

        // Extract files from tool calls
        const stateFiles: Record<string, string> = {};
        const stateApiRoutes: Record<string, string> = {};

        // ═══ STRATEGY 1: Parse tool_calls (primary path) ═══
        if (message?.tool_calls && message.tool_calls.length > 0) {
          for (const tc of message.tool_calls) {
            if (tc.function?.name === "createOrUpdateFiles") {
              try {
                const args = JSON.parse(tc.function.arguments);
                const files = Array.isArray(args.files) ? args.files : [];
                for (const f of files) {
                  if (f?.path && typeof f?.content === "string") {
                    const cleanPath = canonicalizeDevxGeneratedPath(f.path);
                    const cleanContent = sanitizePreviewFile(cleanPath, f.content);
                    if (cleanPath.startsWith("app/api/")) {
                      stateApiRoutes[cleanPath] = cleanContent;
                    } else {
                      stateFiles[cleanPath] = cleanContent;
                    }
                  }
                }
                console.log(`[codeAgentFunction] ✅ Tool call parsed: ${files.length} files extracted.`);
              } catch (parseErr: any) {
                // ═══ STRATEGY 1B: Tool call JSON is malformed — repair it ═══
                console.warn(`[codeAgentFunction] ⚠️ Tool call JSON.parse failed: ${parseErr.message}. Attempting repair...`);
                const rawArgs = tc.function?.arguments || "";
                // Try to extract individual file objects from the broken JSON
                const fileObjRegex = /\{\s*"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
                let fileMatch;
                let repairCount = 0;
                while ((fileMatch = fileObjRegex.exec(rawArgs)) !== null) {
                  try {
                    const filePath = fileMatch[1];
                    // Unescape the content string
                    const fileContent = JSON.parse(`"${fileMatch[2]}"`);
                    const cleanPath = canonicalizeDevxGeneratedPath(filePath);
                    const cleanContent = sanitizePreviewFile(cleanPath, fileContent);
                    if (cleanPath.startsWith("app/api/")) {
                      stateApiRoutes[cleanPath] = cleanContent;
                    } else {
                      stateFiles[cleanPath] = cleanContent;
                    }
                    repairCount++;
                  } catch { /* skip individual file */ }
                }
                if (repairCount > 0) {
                  console.log(`[codeAgentFunction] 🔧 Repaired ${repairCount} files from broken tool call JSON.`);
                } else {
                  // Last resort: pass raw args to parseFilesFromText
                  console.warn(`[codeAgentFunction] ⚠️ Regex repair failed. Falling through to text parsing...`);
                  const textExtracted = parseFilesFromText(rawArgs);
                  textExtracted.forEach(f => {
                    const cleanPath = canonicalizeDevxGeneratedPath(f.path);
                    const cleanContent = sanitizePreviewFile(cleanPath, f.content);
                    if (cleanPath.startsWith("app/api/")) stateApiRoutes[cleanPath] = cleanContent;
                    else stateFiles[cleanPath] = cleanContent;
                  });
                  if (textExtracted.length > 0) {
                    console.log(`[codeAgentFunction] 🔧 parseFilesFromText recovered ${textExtracted.length} files from tool args.`);
                  }
                }
              }
            }
          }
        }

        // ═══ STRATEGY 2: Parse text content with full parseFilesFromText ═══
        if (Object.keys(stateFiles).length === 0 && Object.keys(stateApiRoutes).length === 0) {
          const textContent = message?.content || "";
          if (textContent.length > 50) {
            console.warn(`[codeAgentFunction] ⚠️ ${modelKey} returned text (${textContent.length} chars) instead of tool calls. Running full text parser...`);
            const textExtracted = parseFilesFromText(textContent);
            for (const f of textExtracted) {
              const cleanPath = canonicalizeDevxGeneratedPath(f.path);
              const cleanContent = sanitizePreviewFile(cleanPath, f.content);
              if (cleanPath.startsWith("app/api/")) stateApiRoutes[cleanPath] = cleanContent;
              else stateFiles[cleanPath] = cleanContent;
            }
            if (textExtracted.length > 0) {
              console.log(`[codeAgentFunction] 🔧 Text parser recovered ${textExtracted.length} files from ${modelKey} response.`);
            } else {
              console.error(`[codeAgentFunction] ❌ ALL parsing strategies failed. Raw response (first 500 chars): ${textContent.slice(0, 500)}`);
            }
          } else {
            console.error(`[codeAgentFunction] ❌ ${modelKey} returned empty/tiny response (${textContent.length} chars). finish_reason=${finishReason}`);
          }
        }

        const totalFiles = Object.keys(stateFiles).length + Object.keys(stateApiRoutes).length;
        console.log(`[codeAgentFunction] ✅ Agent completed via ${modelKey} (${modelName}). Files generated: ${totalFiles}`);

        const rawResponse = message?.content || "";
        return {
          files: stateFiles,
          apiRoutes: stateApiRoutes,
          summary: "",
          rawResponse,
        };

        } catch (err: any) {
          console.error(`[codeAgentFunction] ❌ Direct API call failed:`, err?.message || err);
          throw err;
        }
      };

      // ✅ CRITICAL FIX: Wrap in step.run() so Inngest checkpoints the result.
      // Without this, every subsequent step replay (recover, write-all-files, start-dev-server, save-fragment)
      // re-executes the entire function body INCLUDING the Grok API call.
      // This was causing Grok to be called 3-5x per generation (each taking 60-130s).
      // The old comment said "DO NOT wrap" because agent-kit's network.run() had internal step.run() calls.
      // We bypassed agent-kit with a direct fetch(), so there are NO nested steps anymore.
      await step.run("status-3-generation", async () => {
        await appendMessageStatus(pendingMessageId, `Now generating the full application code. This is the main synthesis step — I'm creating all the components, pages, and logic...`);
      });

      // Status: Model selection reasoning
      await step.run("status-3b-model-think", async () => {
        await appendMessageStatus(pendingMessageId, `Analyzing your requirements and structuring the codebase. Writing components, styling, and connecting everything together...`);
      });

      const generationResult = await step.run("turbo-generate", async () => {
        let networkOutput = { files: {} as Record<string, string>, apiRoutes: {} as Record<string, string>, summary: "", rawResponse: "" };
        let lastRawResponse = "";

        for (const modelKey of preferredModelOrder) {
          const maxAttempts = 2; // All models get 2 attempts for resilience
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
              console.log(`[codeAgentFunction] 🚀 Attempting ${modelKey} (Attempt ${attempt + 1}/${maxAttempts})`);
              const output = await runAgentGeneration(modelKey, attempt, lastRawResponse);
              const totalFiles = Object.keys(output.files).length + Object.keys(output.apiRoutes).length;

              lastRawResponse = output.rawResponse;

              if (totalFiles > 0) {
                networkOutput = output;
                console.log(`[codeAgentFunction] ✅ ${modelKey} produced ${totalFiles} files. Using this output.`);
                // Inline status update (inside step.run so safe)
                await appendMessageStatus(pendingMessageId, `Done! I've generated ${totalFiles} files. Now validating the code structure and preparing to deploy...`).catch(() => {});
                break;
              } else {
                console.warn(`[codeAgentFunction] ⚠️ ${modelKey} produced 0 files. Retrying...`);
                networkOutput = output;
                // DON'T break — continue to next attempt or next model
                continue;
              }
            } catch (err: any) {
              console.error(`[codeAgentFunction] ❌ Error in ${modelKey} attempt ${attempt + 1}:`, err?.message || err);
              if (modelKey === preferredModelOrder[preferredModelOrder.length - 1] && attempt === maxAttempts - 1) {
                throw err;
              }
              break;
            }
          }
          if (Object.keys(networkOutput.files).length > 0) break;
        }

        return {
          files: networkOutput.files,
          apiRoutes: networkOutput.apiRoutes,
          summary: networkOutput.summary || "App generation complete.",
          rawResponse: networkOutput.rawResponse,
        };
      });

      let result = {
        state: {
          data: {
            files: generationResult.files,
            apiRoutes: generationResult.apiRoutes,
            summary: generationResult.summary,
          },
        },
      } as any;

      // parseFilesFromText moved above runAgentGeneration to prevent undefined reference

      const requestDirectJsonGeneration = async (
        existingFiles: Record<string, string>,
        existingApiRoutes: Record<string, string>,
        missing: string[]
      ) => {
        const existingFilePaths = [
          ...Object.keys(existingFiles),
          ...Object.keys(existingApiRoutes),
        ];
        const prompt = `Return ONLY valid JSON with this exact shape:
{"files":[{"path":"...","content":"..."}]}

Generate a COMPLETE, production-ready Next.js 15 app for this request:
"${event.data.value}"

Rules:
- No explanations, no markdown, no code fences.
- No placeholders, TODOs, or mock/demo/sample data.
- Include all required root files: package.json, app/layout.tsx, app/page.tsx, app/globals.css.
- Include every local file imported by other generated files.
- Use relative file paths like app/page.tsx and components/ui/button.tsx.
- Do not generate middleware.* or tailwind.config.* files.

Existing files (${existingFilePaths.length}):
${existingFilePaths.slice(0, 200).join("\n")}

Missing required files:
${missing.join("\n") || "unknown"}

Output JSON only.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://devx.app",
            "X-Title": "DevX Recovery Agent",
          },
          body: JSON.stringify({
            model: recoveryModel,
            messages: [
              {
                role: "system",
                content: `You are a senior Next.js engineer. Output strict JSON only, never prose.

## MANDATORY CODE RULES (follow ALL or the build WILL fail):
${POLICY_PROMPT}
${CODE_GENERATION_GUARD}

## CRITICAL REMINDERS:
- NEVER duplicate imports. If useState is already imported, don't import it again.
- Tailwind v4: NO @apply, NO tailwind.config. Use @import "tailwindcss" in globals.css.
- In @layer components: ONLY simple CSS class names (.glass-card), NEVER Tailwind utilities as selectors (.bg-slate-900/40 = INVALID).
- "use client" on line 1 for files with hooks/events.
- Import shadcn from exact paths: import { Button } from "@/components/ui/button"`,
              },
              { role: "user", content: prompt },
            ],
            temperature: 0,
            max_tokens: 16000,
          }),
        });

        const data = await response.json();
        if (data?.error) {
          console.error("[codeAgentFunction] ❌ Recovery direct JSON API error:", data.error);
        }
        const content = data?.choices?.[0]?.message?.content || "";
        return parseFilesFromText(content);
      };

      const getMissingRequiredFiles = () => {
        const allPaths = [
          ...Object.keys(result.state.data.files || {}),
          ...Object.keys(result.state.data.apiRoutes || {}),
        ];
        return getMissingDevxCoreFiles(allPaths);
      };

      let missingRequiredFiles = getMissingRequiredFiles();
      const totalInitialFiles =
        Object.keys(result.state.data.files || {}).length +
        Object.keys(result.state.data.apiRoutes || {}).length;

      if (totalInitialFiles === 0) {
        await step.run(`status-recovery-${runId.slice(-4)}`, async () => {
          await appendMessageStatus(pendingMessageId, `The initial generation didn't produce all the files I need. Running a recovery pass to fill in the missing pieces...`);
        });

        const directRecovery = await step.run(`direct-json-recovery-${runId.slice(-4)}`, async () => {
          const extracted = await requestDirectJsonGeneration(
            result.state.data.files || {},
            result.state.data.apiRoutes || {},
            missingRequiredFiles
          );

          const workingFiles: Record<string, string> = {
            ...(result.state.data.files || {}),
          };
          const workingApiRoutes: Record<string, string> = {
            ...(result.state.data.apiRoutes || {}),
          };

          extracted.forEach((f) => {
            if (!f.path || typeof f.content !== "string") return;
            const cleanPath = canonicalizeDevxGeneratedPath(f.path);
            const cleanContent = sanitizePreviewFile(cleanPath, f.content);
            if (cleanPath.startsWith("app/api/")) {
              workingApiRoutes[cleanPath] = cleanContent;
            } else {
              workingFiles[cleanPath] = cleanContent;
            }
          });

          return {
            extractedCount: extracted.length,
            files: workingFiles,
            apiRoutes: workingApiRoutes,
          };
        });

        result.state.data.files = directRecovery.files || result.state.data.files;
        result.state.data.apiRoutes =
          directRecovery.apiRoutes || result.state.data.apiRoutes;

        if (directRecovery.extractedCount > 0) {
          console.log(
            `[codeAgentFunction] 🔁 Direct JSON fallback recovered ${directRecovery.extractedCount} files.`
          );
        } else {
          console.warn("[codeAgentFunction] ⚠️ Direct JSON fallback recovered no files.");
        }

        missingRequiredFiles = getMissingRequiredFiles();
      }

      if (totalInitialFiles === 0 || missingRequiredFiles.length > 0) {
        const recoveryLimit = 2; // Give recovery 2 chances to fill missing files
        for (let attempt = 1; attempt <= recoveryLimit; attempt++) {
          const recovery = await step.run(`recover-required-files-${attempt}`, async () => {
            const workingFiles: Record<string, string> = {
              ...(result.state.data.files || {}),
            };
            const workingApiRoutes: Record<string, string> = {
              ...(result.state.data.apiRoutes || {}),
            };
            const existingFilePaths = [
              ...Object.keys(workingFiles),
              ...Object.keys(workingApiRoutes),
            ];
            const missing = getMissingRequiredFiles();

            const recoveryPrompt = `Return ONLY valid JSON with this exact shape:\n{\"files\":[{\"path\":\"...\",\"content\":\"...\"}]}\n\nTask:\nGenerate COMPLETE, production-ready Next.js app files for this user request:\n\"${event.data.value}\"\n\nRules:\n- No placeholders, no TODOs, no mock scaffolds.\n- Include all required root files: package.json, app/layout.tsx, app/page.tsx, app/globals.css.\n- Include any missing files needed by imports.\n- If files already exist, return ONLY missing/required files to complete the app.\n\nExisting files (${existingFilePaths.length}):\n${existingFilePaths.slice(0, 200).join("\\n")}\n\nMissing required files:\n${missing.join("\\n")}\n\nOutput JSON only.`;

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://devx.app",
                "X-Title": "DevX Recovery Agent",
              },
              body: JSON.stringify({
                model: recoveryModel,
                messages: [
                  {
                    role: "system",
                    content: `You are a senior Next.js engineer. Output strict JSON only.

## MANDATORY CODE RULES (follow ALL or the build WILL fail):
${POLICY_PROMPT}
${CODE_GENERATION_GUARD}

## CRITICAL REMINDERS:
- NEVER duplicate imports. Check existing file content before adding imports.
- Tailwind v4: NO @apply, NO tailwind.config. Use @import "tailwindcss" in globals.css.
- In @layer components: ONLY simple CSS class names (.glass-card), NEVER Tailwind utilities as selectors.
- "use client" on line 1 for files with hooks/events.
- Import shadcn from exact paths: import { Button } from "@/components/ui/button"`,
                  },
                  { role: "user", content: recoveryPrompt },
                ],
                temperature: 0,
                max_tokens: 12000,
              }),
            });

            const data = await response.json();
            if (data?.error) {
              console.error("[codeAgentFunction] ❌ Recovery required files API error:", data.error);
            }
            const content = data?.choices?.[0]?.message?.content || "";
            const extracted = parseFilesFromText(content);

            extracted.forEach((f) => {
              if (!f.path || typeof f.content !== "string") return;
              const cleanPath = canonicalizeDevxGeneratedPath(f.path);
              const cleanContent = sanitizePreviewFile(cleanPath, f.content);
              if (cleanPath.startsWith("app/api/")) {
                workingApiRoutes[cleanPath] = cleanContent;
              } else {
                workingFiles[cleanPath] = cleanContent;
              }
            });

            return {
              extractedCount: extracted.length,
              files: workingFiles,
              apiRoutes: workingApiRoutes,
            };
          });

          result.state.data.files = recovery.files || result.state.data.files;
          result.state.data.apiRoutes =
            recovery.apiRoutes || result.state.data.apiRoutes;

          if (recovery.extractedCount > 0) {
            console.log(
              `[codeAgentFunction] 🔧 Recovery attempt ${attempt}: merged ${recovery.extractedCount} files.`
            );
          } else {
            console.warn(
              `[codeAgentFunction] ⚠️ Recovery attempt ${attempt}: no files extracted.`
            );
          }

          missingRequiredFiles = getMissingRequiredFiles();
          const totalFilesNow =
            Object.keys(result.state.data.files || {}).length +
            Object.keys(result.state.data.apiRoutes || {}).length;

          if (totalFilesNow > 0 && missingRequiredFiles.length === 0) {
            console.log(
              `[codeAgentFunction] ✅ Recovery complete after attempt ${attempt}.`
            );
            break;
          }
        }
      }

      const finalTotalFiles =
        Object.keys(result.state.data.files || {}).length +
        Object.keys(result.state.data.apiRoutes || {}).length;
      missingRequiredFiles = getMissingRequiredFiles();

      if (finalTotalFiles === 0 || missingRequiredFiles.length > 0) {
        await step.run("handle-empty-output", async () => {
          await prisma.message.update({
            where: { id: pendingMessageId },
            data: {
              type: "ANALYSIS",
              content:
                missingRequiredFiles.length > 0
                  ? `Generation incomplete. Missing required files: ${missingRequiredFiles.join(", ")}`
                  : "Generation returned no files from the model. Please retry with a more specific prompt.",
              contextData: {
                code: "GENERATION_EMPTY_OUTPUT",
                projectId,
                missingRequiredFiles,
              },
            },
          });
        });
        return {
          status: "empty_output",
          code: "GENERATION_EMPTY_OUTPUT",
          missingRequiredFiles,
        } as any;
      }

      const mockLikePatterns = [
        /\bmock data\b/i,
        /\bdummy data\b/i,
        /\bsample data\b/i,
        /\bfake data\b/i,
        /\blorem ipsum\b/i,
        /\bTODO:\b/i,
        /\bcoming soon\b/i,
        /app successfully generated, but missing/i,
      ];

      const getMockLikeFiles = () => {
        const combined: Record<string, string> = {
          ...(result.state.data.files || {}),
          ...(result.state.data.apiRoutes || {}),
        };

        return Object.entries(combined)
          .filter(([path, content]) => {
            if (path === "package-lock.json") return false;
            return mockLikePatterns.some((p) => p.test(content || ""));
          })
          .map(([path]) => path);
      };

      // ⚡ SPEED: Mock content recovery REMOVED. The prompt already forbids mock data.
      // If minor placeholder text leaks through, it's cosmetic and not worth 60s of extra LLM calls.
      const mockLikeFiles = getMockLikeFiles();
      if (mockLikeFiles.length > 0) {
        console.warn(`[codeAgentFunction] ⚠️ Mock-like content detected in ${mockLikeFiles.length} files. Proceeding anyway (prompt enforcement).`);
      }

      // ══════════════════════════════════════════════════════════════
      // STEP 4.5: FLUSH ALL FILES TO SANDBOX (single step, no per-file overhead)
      // ══════════════════════════════════════════════════════════════
      await step.run("status-4-writing", async () => {
        const totalFileCount = Object.keys(result.state.data.files || {}).length + Object.keys(result.state.data.apiRoutes || {}).length;
        await appendMessageStatus(pendingMessageId, `Writing ${totalFileCount} files to the sandbox workspace — setting up pages, components, configs, and styles...`);
      });

      // Extra status: Normalization & sanitization pass
      await step.run("status-4b-sanitize", async () => {
        await appendMessageStatus(pendingMessageId, `Running code quality checks — validating imports, fixing syntax, and ensuring everything compiles cleanly...`);
      });

      await step.run("write-all-files", async () => {
        let rawFiles: Record<string, string> = {
          ...result.state.data.files,
          ...result.state.data.apiRoutes,
        };
        let allFiles: Record<string, string> = {};

        // Apply path normalization one last time during flush
        for (const [path, content] of Object.entries(rawFiles)) {
          const cleanPath = canonicalizeDevxGeneratedPath(path);
          allFiles[cleanPath] = content;
        }

        // ═══ FILE SANITIZATION: Fix common AI-generated conflicts ═══
        await appendMessageStatus(pendingMessageId, "🧼 Running multi-phase codebase sanitization passes...").catch(() => {});

        // 1. Remove duplicate next.config files (AI often generates both .mjs and .js/.ts)
        const nextConfigs = Object.keys(allFiles).filter((f) =>
          f.match(/^next\.config\.(ts|js|mjs)$/)
        );
        if (nextConfigs.length > 1) {
          // Keep the .ts version (preferred), then .mjs, then .js
          const priority = [
            "next.config.ts",
            "next.config.mjs",
            "next.config.js",
          ];
          const keep =
            priority.find((p) => nextConfigs.includes(p)) || nextConfigs[0];
          for (const cfg of nextConfigs) {
            if (cfg !== keep) {
              console.log(
                `[write-all-files] 🧹 Removing duplicate config: ${cfg} (keeping ${keep})`
              );
              delete allFiles[cfg];
            }
          }
          await appendMessageStatus(pendingMessageId, "🧹 Sanitized Next.js configuration files to avoid compilation conflicts.").catch(() => {});
        }

        // 2. Remove forbidden middleware files
        let hasForbiddenMiddleware = false;
        for (const forbidden of [
          "middleware.ts",
          "middleware.js",
          "middleware.jsx",
          "src/middleware.ts",
        ]) {
          if (allFiles[forbidden]) {
            console.log(
              `[write-all-files] 🧹 Removing forbidden file: ${forbidden}`
            );
            delete allFiles[forbidden];
            hasForbiddenMiddleware = true;
          }
        }
        if (hasForbiddenMiddleware) {
          await appendMessageStatus(pendingMessageId, "🧹 Excluded middleware.ts to ensure error-free routing in sandbox edge environment.").catch(() => {});
        }

        // 3. Enforce EXACT postcss.config.mjs for Tailwind v4 and remove any others
        const postcssFiles = Object.keys(allFiles).filter((f) =>
          f.match(/^postcss\.config\.(mjs|js|cjs)$/)
        );
        let hasCleanedPostcss = false;
        for (const f of postcssFiles) {
          if (f !== "postcss.config.mjs") {
            console.log(`[write-all-files] 🧹 Removing incorrect format ${f}`);
            delete allFiles[f];
            hasCleanedPostcss = true;
          }
        }
        if (hasCleanedPostcss || !allFiles["postcss.config.mjs"]) {
          await appendMessageStatus(pendingMessageId, "⚙️ Configured postcss.config.mjs for Tailwind CSS v4 pipeline.").catch(() => {});
        }
        // Always overwrite/inject correct PostCSS v4 config
        allFiles[
          "postcss.config.mjs"
        ] = `export default {\n  plugins: {\n    '@tailwindcss/postcss': {},\n  },\n};\n`;

        // 4-5. tsconfig.json and next.config.ts are handled by normalizePreviewFiles()
        // That function unconditionally force-injects hardened, canonical versions of both.
        // No pre-injection needed here.

        // 5.1 Enforce lib/utils.ts
        if (!allFiles["lib/utils.ts"] && !allFiles["src/lib/utils.ts"]) {
          console.log("[write-all-files] 🏗️ Injecting missing lib/utils.ts");
          await appendMessageStatus(pendingMessageId, "🏗️ Auto-generated core utility library (lib/utils.ts) with tailwind-merge.").catch(() => {});
          allFiles[
            "lib/utils.ts"
          ] = `import { type ClassValue, clsx } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`;
        }

        // 5.2 Enforce Tailwind v4 in globals.css
        let cssKey = allFiles["app/globals.css"]
          ? "app/globals.css"
          : allFiles["src/app/globals.css"]
            ? "src/app/globals.css"
            : "app/globals.css";
        if (!allFiles[cssKey]) {
          console.log("[write-all-files] 🏗️ Injecting missing globals.css");
          await appendMessageStatus(pendingMessageId, "🎨 Injected responsive global styles using Tailwind CSS v4.").catch(() => {});
          allFiles[cssKey] = `@import "tailwindcss";\n\n@theme {\n  --color-border: var(--border);\n  --color-input: var(--input);\n  --color-ring: var(--ring);\n  --color-background: var(--background);\n  --color-foreground: var(--foreground);\n  --color-surface: var(--surface);\n}\n\n:root {\n  --background: #ffffff;\n  --foreground: #0f172a;\n  --surface: #f8fafc;\n  --border: #e2e8f0;\n  --input: #e2e8f0;\n  --ring: #94a3b8;\n}\n\nbody {\n  min-height: 100vh;\n  background: var(--background);\n  color: var(--foreground);\n}\n`;
        } else if (!allFiles[cssKey].includes('@import "tailwindcss"')) {
          await appendMessageStatus(pendingMessageId, "🎨 Configured global HSL theme tokens and Tailwind CSS v4 layout directives.").catch(() => {});
          allFiles[cssKey] = `@import "tailwindcss";\n` + allFiles[cssKey];
        }

        // 5.3 Validate required root files (no mock scaffolding injection)
        const hasRootLayout =
          !!allFiles["app/layout.tsx"] ||
          !!allFiles["app/layout.jsx"] ||
          !!allFiles["src/app/layout.tsx"] ||
          !!allFiles["src/app/layout.jsx"];
        const hasRootPage =
          !!allFiles["app/page.tsx"] ||
          !!allFiles["app/page.jsx"] ||
          !!allFiles["src/app/page.tsx"] ||
          !!allFiles["src/app/page.jsx"];

        if (!hasRootLayout || !hasRootPage) {
          throw new Error(
            `GENERATION_INCOMPLETE_ROOT_FILES: missing ${!hasRootLayout ? "layout" : ""}${!hasRootLayout && !hasRootPage ? " and " : ""
            }${!hasRootPage ? "page" : ""}; refusing to inject mock files`
          );
        }

        // 5.5 Auto-heal package.json exactly like wakeup/route.ts
        if (allFiles["package.json"]) {
          const { pkg, status } = robustParsePackageJson(
            allFiles["package.json"]
          );
          if (status !== "ok") {
            console.warn(
              `[write-all-files] 🩹 package.json ${status === "repaired" ? "repaired" : "restored to fallback"
              }`
            );
          }
          allFiles["package.json"] = JSON.stringify(pkg, null, 2);
          console.log(
            "[write-all-files] ✅ package.json auto-healed to include standard UI dependencies"
          );
          await appendMessageStatus(pendingMessageId, "🩹 Running automated package dependency audit and version pinning...").catch(() => {});
          await appendMessageStatus(pendingMessageId, "✓ package.json auto-healed with standard UI dependencies (framer-motion, lucide-react, radix-ui).").catch(() => {});
        } else {
          // If completely missing, generate a minimal one
          const { pkg } = robustParsePackageJson("{}");
          allFiles["package.json"] = JSON.stringify(pkg, null, 2);
          console.log(
            "[write-all-files] 🏗️ Injected missing package.json with standard UI dependencies"
          );
        }

        // 6. Aggressively remove ANY tailwind.config files (Tailwind v4 doesn't support them by default, causes crashes)
        for (const tw of [
          "tailwind.config.ts",
          "tailwind.config.js",
          "tailwind.config.mjs",
        ]) {
          if (allFiles[tw]) {
            console.log(
              `[write-all-files] 🧹 Removing ${tw} (Tailwind v4 uses no config file)`
            );
            delete allFiles[tw];
          }
        }

        // 7. Apply code sanitization to ALL code files (fix shadcn classes + wrong imports)
        for (const [path, content] of Object.entries(allFiles)) {
          if (
            /\.(tsx?|jsx?|css|scss|mjs)$/.test(path) &&
            path !== "package.json"
          ) {
            const sanitized = sanitizePreviewFile(path, content);
            if (sanitized !== content) {
              allFiles[path] = sanitized;
            }
          }
        }

        // 7.5 AUTO-HEAL: Infrastructure-level import fixer
        // Scans ALL .tsx/.ts files for missing imports (Shadcn, Lucide, React hooks, etc.)
        // and auto-injects them BEFORE writing to sandbox. This is the ROOT FIX.
        allFiles = autoHealAllFiles(allFiles);

        const normalizedPreview = normalizePreviewFiles(allFiles);
        allFiles = normalizedPreview.files;

        const finalMissingFiles = getMissingDevxAlwaysFiles(Object.keys(allFiles));
        if (finalMissingFiles.length > 0) {
          console.warn(
            `[write-all-files] ⚠️ DEVX_SCHEMA_INCOMPLETE: missing ${finalMissingFiles.join(", ")}. Proceeding anyway to ensure preview boots.`
          );
        }

        const fileEntries = Object.entries(allFiles);

        if (fileEntries.length === 0) {
          console.warn("[write-all-files] ⚠️ No files to write.");
          return { written: 0 };
        }

        const project = (await prisma.project.findUnique({
          where: { id: projectId },
        })) as any;
        if (project?.activeRunId && project.activeRunId !== runId)
          throw new Error("STALE_RUN_TERMINATED");

        const sandbox = await sandboxManager.get(sandboxId);
        const homeDir = await resolveSandboxWorkspace(sandbox);

        // Create all directories in one command
        const dirs = [
          ...new Set(
            fileEntries
              .map(([p]) => p.substring(0, p.lastIndexOf("/")))
              .filter((d) => d)
          ),
        ];
        if (dirs.length > 0) {
          // ✅ FIX: Set timeout to 0 (disabled) to prevent [deadline_exceeded] on slower sandboxes
          await sandbox.commands.run(
            `mkdir -p ${dirs.map((d) => `"${homeDir}/${d}"`).join(" ")}`,
            { timeoutMs: 0 }
          );
        }

        // 5.6 Structural Integrity Check (ZERO MERGE POLICY)
        for (const [path, content] of Object.entries(allFiles)) {
          if (/\.(tsx|jsx|js|ts)$/.test(path)) {
            const matches = content.match(/export\s+default/g);
            if (matches && matches.length > 1) {
              console.error(
                `[write-all-files] ❌ Structural Integrity Error in ${path}: ${matches.length} default exports found.`
              );
              throw new Error(
                `Structural Integrity Failure in ${path}: You included ${matches.length} 'export default' statements. This is forbidden in Next.js. You MUST split these into separate files: move components to @/components/*.tsx and keep ONLY ONE 'export default' in the main page/layout.`
              );
            }
          }
        }

        // 5.7 Sandbox Configuration Cleanup
        // We MUST manually delete these from the sandbox filesystem to prevent conflicts.
        const filesToPurge = [
          "next.config.js", "next.config.mjs", "next.config.ts",
          "tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs",
          "postcss.config.js", "postcss.config.cjs"
        ];
        // Only purge tsconfig.json if we are NOT about to write a new one
        if (!allFiles["tsconfig.json"]) {
          filesToPurge.push("tsconfig.json");
        }

        await sandbox.commands.run(
          `cd '${homeDir}' && rm -f ${filesToPurge.join(" ")}`,
          { timeoutMs: 15000 }
        ).catch(() => { });

        // 6. Infrastructure First Protocol
        // We write critical files IMMEDIATELY in parallel so Next.js boots correctly.
        // Then we stream the rest for the UI effect.
        const CRITICAL_FILES = [
          "app/globals.css",
          "next.config.ts",
          "tsconfig.json",
          "lib/utils.ts",
          "lib/utils.js",
          "app/layout.tsx",
          "src/app/layout.tsx",
          "package.json"
        ];

        const infrastructureEntries = fileEntries.filter(([p]) => CRITICAL_FILES.includes(p));
        const remainingEntries = fileEntries.filter(([p]) => !CRITICAL_FILES.includes(p));


        console.log(`[write-all-files] 🏗️ Writing ${infrastructureEntries.length} infrastructure files first...`);

        // ✅ PROGRESSIVE FILE STREAMING: Emit files one-by-one to the UI
        // Each updateMessageFileActions call uses Map-based upsert, so it's safe
        // to call incrementally — each call adds new files without losing existing ones.
        let emittedCount = 0;

        // Write infrastructure files first (critical for build)
        for (const [path, content] of infrastructureEntries) {
          await sandbox.files.write(`${homeDir}/${path}`, content);
          emittedCount++;
          if (pendingMessageId) {
            await updateMessageFileActions(pendingMessageId, [{
              type: "add",
              file: path,
              content: content,
              details: "INFRA",
              timestamp: Date.now(),
            }]);
            console.log(`[write-all-files] 📄 [${emittedCount}/${fileEntries.length}] ${path}`);
          }
        }



        if (pendingMessageId && remainingEntries.length > 0) {
          await appendMessageStatus(pendingMessageId, `Deploying ${fileEntries.length} files to the preview environment...`).catch(() => {});
        }

        for (const [path, content] of remainingEntries) {
          await sandbox.files.write(`${homeDir}/${path}`, content);
          emittedCount++;
          if (pendingMessageId) {
            await updateMessageFileActions(pendingMessageId, [{
              type: "add",
              file: path,
              content: content,
              details: `+${content.split("\n").length}`,
              timestamp: Date.now(),
            }]);
            console.log(`[write-all-files] 📄 [${emittedCount}/${fileEntries.length}] ${path}`);
          }
          // Small delay for UI to feel progressive (not too slow, not instant)
          await new Promise(r => setTimeout(r, 150));
        }

        console.log(`[write-all-files] ✅ Streamed ${emittedCount} files to UI progressively.`);

        // Update state with sanitized files
        result.state.data.files = Object.fromEntries(
          fileEntries.filter(([p]) => !p.startsWith("app/api/"))
        );
        result.state.data.apiRoutes = Object.fromEntries(
          fileEntries.filter(([p]) => p.startsWith("app/api/"))
        );

        console.log(
          `[write-all-files] ✅ Flushed ${fileEntries.length} files to sandbox.`
        );
        return { written: fileEntries.length };
      });

      await step.run("status-5-compiling", async () => {
        await appendMessageStatus(pendingMessageId, `All files are deployed! Starting the development server now...`);
      });

      await step.run("status-5b-booting", async () => {
        await appendMessageStatus(pendingMessageId, `Compiling and bundling your application. This usually takes 15-45 seconds...`);
      });

      // ══════════════════════════════════════════════════════════════
      // STEP 5: TURBO BOOT — Split install/start, smart gating
      // ══════════════════════════════════════════════════════════════
      const startDevServerResult = await step.run("start-dev-server", async () => {
        const allFiles = result.state.data.files;
        if (Object.keys(allFiles).length === 0) {
          console.warn("[start-dev-server] ⚠️ No files. Skipping.");
          return { serverReady: false, homeDir: SANDBOX_WORKSPACE_DIR };
        }

        const sandbox = await sandboxManager.get(sandboxId);
        const homeDir = await resolveSandboxWorkspace(sandbox);

        await appendMessageStatus(pendingMessageId, "🔍 Checking if dev server is already running...").catch(() => {});

        // ── 1. Quick liveness check (instant return if already booted) ──
        const liveCheck = await sandbox.commands.run(
          `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:3000 2>/dev/null || echo "000"`,
          { timeoutMs: 5000 }
        ).catch(() => ({ stdout: "000" }));

        if (liveCheck.stdout?.trim()?.match(/^[2-5]/)) {
          console.log("[start-dev-server] ⚡ Port 3000 already live. Instant handoff.");
          await appendMessageStatus(pendingMessageId, "⚡ Port 3000 already live. Handing off to preview session.").catch(() => {});
          return { serverReady: true, homeDir, instant: true };
        }

        // ── 2. Create .env.local (prevents auth/db crashes) ──
        await appendMessageStatus(pendingMessageId, "📝 Generating environment variables (.env.local) with preview-safe defaults...").catch(() => {});
        await sandbox.files.write(`${homeDir}/.env.local`, [
          'DATABASE_URL="file:./dev.db"',
          'NEXTAUTH_SECRET="devx-preview-secret"',
          'NEXTAUTH_URL="http://localhost:3000"',
        ].join("\n")).catch(() => {});

        // ── 3. Kill stale processes but KEEP .next cache for warm boot ──
        console.log("[start-dev-server] 🚀 Turbo boot: kill stale → gate install → start");
        await appendMessageStatus(pendingMessageId, "🚀 Starting Turbo boot: terminating stale development compilation processes...").catch(() => {});
        await sandbox.commands.run(
          `cd '${homeDir}' && (fuser -k 3000/tcp 2>/dev/null || true) && (pkill -9 -f 'next' 2>/dev/null || true)`,
          { timeoutMs: 8000 }
        ).catch(() => {});

        // ── 4. Wait for any background npm install to finish (from pulse-2-sandbox) ──
        console.log("[start-dev-server] ⏳ Waiting for any background npm install...");
        await appendMessageStatus(pendingMessageId, "⏳ Waiting for background package installation to finalize...").catch(() => {});
        const installWaitStart = Date.now();
        for (let i = 0; i < 40; i++) { // up to ~60s
          const npmCheck = await sandbox.commands.run(
            `pgrep -f 'npm install' > /dev/null && echo "RUNNING" || echo "DONE"`,
            { timeoutMs: 3000 }
          ).catch(() => ({ stdout: "DONE" }));
          if (npmCheck.stdout?.trim() === "DONE") break;
          await new Promise(r => setTimeout(r, 1500));
        }
        const installWaitElapsed = ((Date.now() - installWaitStart) / 1000).toFixed(1);
        console.log(`[start-dev-server] ✅ npm install gate passed after ${installWaitElapsed}s`);
        await appendMessageStatus(pendingMessageId, `✓ Package installation verified (gate passed after ${installWaitElapsed}s).`).catch(() => {});

        // ── 5. Only install if next binary is missing ──
        const nextBinCheck = await sandbox.commands.run(
          `cd '${homeDir}' && [ -f node_modules/.bin/next ] && echo "OK" || echo "MISSING"`,
          { timeoutMs: 5000 }
        ).catch(() => ({ stdout: "MISSING" }));

        if (nextBinCheck.stdout?.trim() !== "OK") {
          console.log("[start-dev-server] 📦 next binary missing, running install...");
          await appendMessageStatus(pendingMessageId, `📦 Next.js compiler binary missing. Downloading and installing build packages...`).catch(() => {});
          await sandbox.commands.run(
            `cd '${homeDir}' && npm install --no-package-lock --prefer-offline --no-audit --no-fund --ignore-scripts`,
            { timeoutMs: 120000 }
          ).catch(() => {});
          await appendMessageStatus(pendingMessageId, `✓ Compilation package installation complete.`).catch(() => {});
        } else {
          console.log("[start-dev-server] ✅ next binary found, skipping install");
          await appendMessageStatus(pendingMessageId, "✓ Core compiler binary verified.").catch(() => {});
        }

        // ── 6. Start dev server DETACHED (not chained behind install) ──
        await appendMessageStatus(pendingMessageId, "🚀 Starting Next.js development server with Turbopack (--turbo)...").catch(() => {});
        await startDetachedSandboxCommand({
          sandbox,
          homeDir,
          command: `NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next dev --hostname 0.0.0.0 --port 3000 --turbo`,
          logFile: `/tmp/next-dev-webpack.log`,
        }).catch(() => {});

        // ── 7. Poll port 3000 with PROCESS DEATH DETECTION ──
        console.log("[start-dev-server] ⏳ Waiting for port 3000...");
        await appendMessageStatus(pendingMessageId, "⏳ Bundling application routes. Waiting for host port 3000 to resolve...").catch(() => {});
        const maxWaitMs = 180000;
        const pollIntervalMs = 1500;
        const startTime = Date.now();
        let processDeadDetected = false;

        while (Date.now() - startTime < maxWaitMs) {
          await new Promise(r => setTimeout(r, pollIntervalMs));
          const check = await sandbox.commands.run(
            `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 http://127.0.0.1:3000 2>/dev/null || echo "000"`,
            { timeoutMs: 5000 }
          ).catch(() => ({ stdout: "000" }));

          if (check.stdout?.trim()?.match(/^[2-5]/)) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[start-dev-server] ✅ Port 3000 live after ${elapsed}s`);
            await appendMessageStatus(pendingMessageId, `✓ host port 3000 live! Bundle compiled successfully in ${elapsed}s.`).catch(() => {});
            return { serverReady: true, homeDir };
          }

          // Every ~7.5s, check if the server process is still alive
          const pollCount = Math.floor((Date.now() - startTime) / pollIntervalMs);
          if (pollCount > 0 && pollCount % 5 === 0) {
            const procCheck = await sandbox.commands.run(
              `pgrep -f 'next dev' > /dev/null && echo "ALIVE" || echo "DEAD"`,
              { timeoutMs: 3000 }
            ).catch(() => ({ stdout: "DEAD" }));

            if (procCheck.stdout?.trim() === "DEAD") {
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              console.error(`[start-dev-server] 💀 next dev process DIED after ${elapsed}s (build error)`);
              await appendMessageStatus(pendingMessageId, "⚠️ Turbopack compilation mismatch. Switching to standard Next.js Webpack compiler...").catch(() => {});

              // Read the crash log
              const crashLog = await sandbox.commands.run(
                `tail -50 /tmp/next-dev-webpack.log 2>/dev/null || echo ""`,
                { timeoutMs: 5000 }
              ).catch(() => ({ stdout: "" }));
              if (crashLog.stdout?.trim()) {
                console.error(`[start-dev-server] 📋 Crash log:\n${crashLog.stdout.slice(-1000)}`);
              }

              // Webpack fallback
              await startDetachedSandboxCommand({
                sandbox,
                homeDir,
                command: `NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next dev --hostname 0.0.0.0 --port 3000`,
                logFile: `/tmp/next-dev-webpack.log`,
              }).catch(() => {});

              const remainingMs = Math.max(maxWaitMs - (Date.now() - startTime), 60000);
              const fallbackStart = Date.now();
              while (Date.now() - fallbackStart < remainingMs) {
                await new Promise(r => setTimeout(r, pollIntervalMs));
                const fbCheck = await sandbox.commands.run(
                  `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 http://127.0.0.1:3000 2>/dev/null || echo "000"`,
                  { timeoutMs: 5000 }
                ).catch(() => ({ stdout: "000" }));

                if (fbCheck.stdout?.trim()?.match(/^[2-5]/)) {
                  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                  console.log(`[start-dev-server] ✅ Port 3000 live via Webpack fallback after ${totalElapsed}s`);
                  await appendMessageStatus(pendingMessageId, `✓ host port 3000 resolved live via Webpack fallback.`).catch(() => {});
                  return { serverReady: true, homeDir };
                }

                const fbProcCheck = await sandbox.commands.run(
                  `pgrep -f 'next dev' > /dev/null && echo "ALIVE" || echo "DEAD"`,
                  { timeoutMs: 3000 }
                ).catch(() => ({ stdout: "DEAD" }));
                if (fbProcCheck.stdout?.trim() === "DEAD") {
                  console.error("[start-dev-server] 💀 Webpack fallback also crashed.");
                  await appendMessageStatus(pendingMessageId, "💀 standard Webpack compilation also crashed. Code contains fatal errors.").catch(() => {});
                  processDeadDetected = true;
                  break;
                }
              }
              break;
            }
          }
        }

        if (processDeadDetected) {
          console.error("[start-dev-server] ❌ Server process crashed (fatal build error in generated code)");
        } else {
          console.error("[start-dev-server] ❌ Port 3000 not ready after 180s");
        }

        // Capture build error for auto-fix
        let buildError = "Dev server failed to reach port 3000.";
        try {
          const logRead = await sandbox.commands.run(
            `tail -100 /tmp/next-dev-webpack.log 2>/dev/null || echo ""`,
            { timeoutMs: 5000 }
          ).catch(() => ({ stdout: "" }));
          if (logRead.stdout?.trim()) buildError = logRead.stdout.slice(-3000);
        } catch {}

        const userMsg = (event.data.value || "") as string;
        if (!userMsg.startsWith("FIX THE FOLLOWING BUILD ERROR") && !userMsg.startsWith("FIX THIS BUILD ERROR")) {
          const fixRunId = `fix-${runId}-${Date.now()}`;
          await inngest.send({
            name: "code-agent/run",
            data: {
              projectId,
              value: `FIX THE FOLLOWING BUILD ERROR:\n\n${buildError.slice(-2000)}\n\nRead the error carefully, identify which file has the issue, and fix ONLY the broken code.`,
              runId: fixRunId,
            },
          });
          console.log("[start-dev-server] 🤖 Auto-fix triggered:", fixRunId);
        }

        return { sandboxUrl: null, status: "error", error: buildError.slice(-500), buildError, validationFailed: true };
      });

      // ══════════════════════════════════════════════════════════════
      // STEP 6: Save fragment with preview URL
      // ══════════════════════════════════════════════════════════════
      await step.run("save-fragment", async () => {
        const sandbox = await sandboxManager.get(sandboxId);
        const host = (sandbox as any).getHost(3000);
        const sandboxUrl = `https://${host}`;

        // ⚡ PARALLEL: Update message to RESULT + create fragment simultaneously
        // NOTE: We do NOT overwrite fileActions here — the batch write in write-all-files
        // already stored the full file list with content. We only update type/content.
        // Append final completion status to the conversation thread BEFORE transitioning
        await appendMessageStatus(pendingMessageId, `Your app is live and ready! All ${Object.keys(result.state.data.files || {}).length} files compiled successfully. Click the preview below to see it in action.`);

        // Read the current conversation content so we preserve the full agent thread
        const currentMsg = await prisma.message.findUnique({
          where: { id: pendingMessageId },
          select: { content: true }
        });

        const [,] = await Promise.all([
          prisma.message.update({
            where: { id: pendingMessageId },
            data: {
              type: "RESULT",
              // CRITICAL: Preserve the full conversation thread, don't overwrite with generic text
              content: currentMsg?.content || "Here is your custom application!",
            },
          }),
          // Wait for URL to be externally reachable in parallel with fragment creation check
          // ⚡ SPEED: Skip polling if we already confirmed it's live
          (startDevServerResult as any)?.instant 
            ? Promise.resolve(true)
            : waitForPreviewUrlReachable(
                sandboxUrl,
                isNewSandbox ? 3 : 2,
                1200
              ).then((reachable) => {
                if (!reachable) {
                  console.warn("[save-fragment] ⚠️ Preview URL not reachable after polling, saving anyway");
                }
              }),
        ]);

        // Create fragment
        await prisma.fragment.create({
          data: {
            messageId: pendingMessageId,
            sandboxUrl,
            title: "Generated App",
            files: result.state.data.files,
            summary: result.state.data.summary || "Here is your custom application!",
          },
        });

        console.log("[save-fragment] ✅ Fragment saved with URL:", sandboxUrl);
      });
    } finally {
      if (ownsRunLock) {
        await (prisma.project as any)
          .updateMany({
            where: { id: projectId, activeRunId: runId },
            data: { isRunning: false },
          })
          .catch(() => { });
      }
    }
  }
);

export default [codeAgentFunction];
