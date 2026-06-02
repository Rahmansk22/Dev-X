import { EmergencyPreviewPayload } from "./sandbox-preview";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildEmergencyPreviewHtml(payload: EmergencyPreviewPayload): string {
  const safePayload = {
    title: payload.title || "DEVX AGENT PROTOCOL",
    message: payload.message,
    details: payload.details || "",
    projectId: payload.projectId || "",
    files: (payload.files || []).slice(0, 40),
    logs: (payload.logs || []).slice(0, 5).map((log) => log.slice(-4000)),
  };

  const fileItems = safePayload.files
    .map((file) => {
      return (
        '<div class="px-3 py-2 bg-violet-500/5 border border-violet-500/10 text-[10px] font-mono text-violet-300/70 truncate tracking-tight flex items-center gap-2 rounded">' +
        '<svg class="size-3 text-violet-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        escapeHtml(file) +
        "</div>"
      );
    })
    .join("");

  const logBlocks = safePayload.logs
    .map((log, index) => {
      const traceStreamName = "TRACE_STREAM_0" + (index + 1);
      return (
        '<div class="bg-black/60 border border-white/5 rounded-xl overflow-hidden relative group mb-6 shadow-2xl">' +
        '<div class="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/10">' +
        '<div class="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">' +
        traceStreamName +
        "</div>" +
        '<div class="flex gap-2">' +
        '<div class="size-2 rounded-full bg-red-500/30"></div>' +
        '<div class="size-2 rounded-full bg-amber-500/30"></div>' +
        '<div class="size-2 rounded-full bg-emerald-500/30"></div>' +
        "</div>" +
        "</div>" +
        '<pre class="p-6 text-[12px] leading-relaxed font-mono text-violet-100/90 whitespace-pre-wrap break-all custom-scrollbar overflow-y-auto max-h-[60vh]">' +
        escapeHtml(log) +
        "</pre>" +
        "</div>"
      );
    })
    .join("");

  return `
<!doctype html>
<html lang="en" class="h-full bg-[#030303]">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DEVX AGENT | BUILD_INTERCEPT</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@400;800&display=swap" rel="stylesheet">
  <style>
    :root { --devx-primary: #8b5cf6; --devx-accent: #06b6d4; }
    body { font-family: 'JetBrains Mono', monospace; background: #030303; color: #fff; overflow: hidden; }
    .header-font { font-family: 'Plus Jakarta Sans', sans-serif; }
    .scanline { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.05) 50%); z-index: 100; pointer-events: none; background-size: 100% 4px; }
    .devx-grid { background-image: radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.08) 1px, transparent 0); background-size: 40px 40px; }
    @keyframes logo-pulse { 0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.3)); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(139, 92, 246, 0.6)); } 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.3)); } }
    .animated-logo { animation: logo-pulse 3s infinite ease-in-out; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 10px; }
    .code-accent { border-left: 2px solid var(--devx-primary); }
    #diagnostic-overlay { transform: translateY(100%); transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    #diagnostic-overlay.expanded { transform: translateY(0); }
  </style>
</head>
<body class="selection:bg-violet-500/30">
  <div class="scanline"></div>
  <div class="fixed inset-0 devx-grid pointer-events-none opacity-40"></div>

  <div class="relative h-screen flex flex-col p-6 pointer-events-auto">
    
    <!-- DEVX TOP HUD -->
    <header class="flex justify-between items-center mb-6 z-[60] bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl">
        <div class="flex items-center gap-5">
            <div class="relative size-12 flex items-center justify-center">
                <img src="/logo.svg" alt="DevX" class="size-8 animated-logo" onerror="this.style.display='none'; document.getElementById('fallback-logo').style.display='block'"/>
                <svg id="fallback-logo" style="display:none" class="size-8 text-violet-500 animated-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div>
                <div class="text-[10px] font-bold text-violet-400 uppercase tracking-[0.5em] mb-1">DEVX_AGENT_PROTOCOL_ACTIVE</div>
                <div class="header-font text-2xl font-black tracking-tight uppercase italic">AGENT <span class="text-violet-500">REPAIR_SYSTEM</span></div>
            </div>
        </div>
        <div class="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-white/30">
            <div class="flex flex-col items-end">
                <div class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-red-500 animate-pulse"></span> STATUS: <span class="text-red-400 font-bold">HEALTH_CRITICAL</span></div>
                <div>SECTOR: 7-SANDBOX</div>
            </div>
            <div class="h-8 w-px bg-white/10"></div>
            <div class="flex flex-col items-end">
                <div>LATENCY: 12ms</div>
                <div class="text-violet-500/50">BUILD: V_9.4</div>
            </div>
        </div>
    </header>

    <!-- CENTER REPAIR CONSOLE -->
    <main class="flex-1 overflow-hidden relative flex flex-col items-center justify-center">
        <div class="absolute inset-0 bg-radial from-violet-500/5 to-transparent pointer-events-none"></div>
        
        <div class="text-center space-y-8 z-10 max-w-3xl px-6">
            <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest mb-4">
                <svg class="size-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                BUILD_EXECUTION_FAILURE_INTERCEPTED
            </div>
            
            <h1 class="header-font text-6xl md:text-8xl font-black tracking-tighter leading-none italic uppercase -rotate-1">
                DEV<span class="text-violet-500">X</span> <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">AGENT</span>
            </h1>
            
            <p class="text-[13px] md:text-[15px] text-neutral-400 leading-relaxed code-accent pl-8 py-3 mx-auto max-w-xl text-left bg-white/5 border border-white/5 rounded-r-xl">
                Our automated healing agents are currently mapping this build error. <span class="text-white">Your code is safe in the sandbox.</span> The DevX Agent is calculating a surgical patch for the compilation failure.
            </p>
            
            <div class="flex items-center justify-center gap-6 pt-10">
                <button id="repair-btn" onclick="copyErrorAndFix(this)" class="group relative px-12 py-5 bg-violet-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(139,92,246,0.4)]">
                    <span id="btn-text" class="relative z-10">PATCH_COMPLETE</span>
                </button>
                <button onclick="toggleDiagnostics()" class="px-12 py-5 border border-white/10 bg-white/[0.03] text-white/50 text-[11px] font-black uppercase tracking-[0.4em] rounded-xl hover:text-white hover:bg-white/10 transition-all italic flex items-center gap-3">
                    <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    Manual_Override
                </button>
            </div>
        </div>

        <!-- FULL-SCREEN DIAGNOSTIC OVERLAY (HIDDEN BY DEFAULT) -->
        <div id="diagnostic-overlay" class="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-3xl flex flex-col p-8 md:p-16">
            <div class="flex justify-between items-center mb-12 border-b border-white/10 pb-8">
                <div class="flex items-center gap-5">
                    <div class="size-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                         <svg class="size-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </div>
                    <div>
                        <div class="text-[10px] font-black text-violet-400 tracking-[0.5em] uppercase italic flex items-center gap-3">
                            <span class="size-2 rounded-full bg-violet-500 animate-ping"></span>
                            DIAGNOSTIC_TRACE_ENGINE_v4.2
                        </div>
                        <div class="header-font text-3xl font-black tracking-tight text-white uppercase italic">DETAILED_BUILD_LOGS</div>
                    </div>
                </div>
                <button onclick="toggleDiagnostics()" class="text-[11px] font-black text-white/30 hover:text-white uppercase tracking-[0.3em] border border-white/10 px-8 py-3 rounded-full transition-all hover:bg-white/10 active:scale-95">ESC_VIEW</button>
            </div>
            
            <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 overflow-hidden">
                <!-- WORKSPACE MAP -->
                <div class="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
                    <div class="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        WORKSPACE_MAP
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-4">
                        ${fileItems}
                    </div>
                </div>
                
                <!-- TELEMETRY STREAM (THE LOGS) -->
                <div class="lg:col-span-9 flex flex-col gap-6 overflow-hidden">
                    <div class="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                         <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                         TELEMETRY_STREAM (SANDBOX_STDOUT)
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-20">
                        ${logBlocks}
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- DEVX STATUS BAR -->
    <footer class="flex justify-between items-end pt-6 mt-auto border-t border-white/10 font-mono text-[10px] text-white/20 uppercase tracking-[0.5em] z-[60]">
        <div class="space-y-2">
            <div id="footer-status" class="text-violet-500 font-bold flex items-center gap-3">
                <span class="size-2 rounded-full bg-violet-500 animate-pulse"></span>
                DEVX_CORE::IDLE
            </div>
            <div class="text-white/40 italic">DISTRIBUTION: DEVX_REPAIR_0.9.4_X64</div>
        </div>
        <div class="text-right flex flex-col items-end gap-2">
            <div class="flex items-center gap-6 text-violet-400/40">
                <span>SECURE_LINK: E2B_ENC_AES</span>
                <span>TUNNEL_ACTIVE</span>
            </div>
            <div class="font-black text-violet-500/40 italic">AWAITING_REPAIR_COMMAND_SYNC</div>
        </div>
    </footer>
  </div>

  <script>
    function toggleDiagnostics() {
        const overlay = document.getElementById('diagnostic-overlay');
        overlay.classList.toggle('expanded');
    }

    let countdown = 3;
    const btn = document.getElementById('repair-btn');
    const btnText = document.getElementById('btn-text');
    
    const repairSequence = setInterval(() => {
        if(countdown <= 0) { 
            clearInterval(repairSequence);
            copyErrorAndFix(btn); 
            return; 
        }
        btnText.innerHTML = "DEPLOYING_PATCH_0" + countdown;
        countdown--;
    }, 1000);

    async function copyErrorAndFix(btn) {
        clearInterval(repairSequence);
        const projectId = "${safePayload.projectId}";
        const errorText = document.querySelector('pre') ? document.querySelector('pre').innerText : "Unknown Build Error";
        if (!projectId) return;

        btn.disabled = true;
        btnText.innerHTML = "REPAIR_COMMAND_SENT";
        document.getElementById('footer-status').innerHTML = "DEVX_AGENT::REPAIR_ACTIVE_09";
        document.getElementById('footer-status').classList.remove('text-violet-500');
        document.getElementById('footer-status').classList.add('text-cyan-400', 'animate-pulse');
        btn.classList.add('bg-white', 'text-black', 'scale-105');

        try {
            const response = await fetch("/api/projects/" + projectId + "/autofix", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: errorText })
            });
            if (response.ok) {
                btnText.innerHTML = "PATCH_STABLE_RELOAD";
                setTimeout(() => window.parent.location.reload(), 3000);
            }
        } catch (e) {
            btnText.innerHTML = "RETRYING_CONNECTION...";
            setTimeout(() => copyErrorAndFix(btn), 3000);
        }
    }
  </script>
</body>
</html>
  `;
}
