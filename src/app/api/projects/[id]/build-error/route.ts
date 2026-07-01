import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Sandbox } from "e2b";
import { getCurrentUserId } from "@/lib/auth";
import { SANDBOX_WORKSPACE_DIR } from "@/lib/sandbox-preview";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const project = await prisma.project.findUnique({ where: { id: projectId, userId } });
    if (!project?.sandboxId) return NextResponse.json({ error: "No sandbox" }, { status: 404 });
    let sandbox: Sandbox;
    try { sandbox = await Sandbox.connect(project.sandboxId); }
    catch { return NextResponse.json({ error: "Cannot connect" }, { status: 503 }); }
    const homeDir = SANDBOX_WORKSPACE_DIR;
    const candidates: string[] = [];
    for (const p of [`${homeDir}/devx-dev.log`, `/tmp/devx-dev.log`]) {
      try {
        const log = await sandbox.files.read(p).catch(() => null);
        if (log && log.length > 10) { const s = extractError(log); if (s) { candidates.push(s); break; } }
      } catch {}
    }
    if (!candidates.length) {
      try {
        const npm = await sandbox.files.read(`${homeDir}/npm-error.log`).catch(() => null);
        if (npm && npm.length > 10) candidates.push(npm.slice(-2000));
      } catch {}
    }
    if (!candidates.length) {
      try {
        const r = await sandbox.commands.run(`cd '${homeDir}' && timeout 30 npx next build 2>&1 | tail -80`, { timeoutMs: 35000 });
        const out = (r.stdout || "") + (r.stderr || "");
        if (out.trim().length > 20) candidates.push(out.slice(-2500));
      } catch (e: any) {
        const out = (e?.stdout || "") + (e?.stderr || e?.message || "");
        if (out.trim().length > 20) candidates.push(out.slice(-2500));
      }
    }
    return NextResponse.json({ error: candidates.join("\n---\n").trim() || null, projectId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

function extractError(log: string): string | null {
  const kws = ["Failed to compile","Build Error","Parsing ecmascript","SyntaxError:","error TS","Module not found","Cannot find module"];
  for (const kw of kws) {
    const idx = log.lastIndexOf(kw);
    if (idx !== -1) return log.slice(Math.max(0, idx - 200)).split("\n").slice(0, 80).join("\n");
  }
  return log.split("\n").slice(-60).join("\n") || null;
}