import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Sandbox } from "e2b";
import { getCurrentUserId } from "@/lib/auth";
import { SANDBOX_WORKSPACE_DIR } from "@/lib/sandbox-preview";

/**
 * Terminal API — Execute commands in the project's E2B sandbox.
 * 
 * POST /api/projects/:id/terminal
 * Body: { command: string }
 * Returns: { stdout, stderr, exitCode }
 */

// Commands that should never be executed in the sandbox
const BLOCKED_COMMANDS = [
  "rm -rf /",
  "rm -rf /*",
  "shutdown",
  "reboot",
  "halt",
  "poweroff",
  "mkfs",
  "dd if=",
  ":(){:|:&};:",  // fork bomb
];

const COMMAND_TIMEOUT_MS = 30_000; // 30 seconds

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { command } = await req.json();

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    // Auth check
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Block dangerous commands
    const normalizedCmd = command.trim().toLowerCase();
    for (const blocked of BLOCKED_COMMANDS) {
      if (normalizedCmd.includes(blocked)) {
        return NextResponse.json(
          {
            stdout: "",
            stderr: `\x1b[31mBlocked: "${command}" is not allowed for safety reasons.\x1b[0m`,
            exitCode: 1,
          },
          { status: 200 }
        );
      }
    }

    // Get project and sandbox
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
      select: { sandboxId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!project.sandboxId) {
      return NextResponse.json(
        {
          stdout: "",
          stderr: "\x1b[33mNo active sandbox. Generate an app first, then use the terminal.\x1b[0m",
          exitCode: 1,
        },
        { status: 200 }
      );
    }

    // Connect to sandbox and execute
    const sandbox = await Sandbox.connect(project.sandboxId);
    const workDir = SANDBOX_WORKSPACE_DIR;

    // Wrap command to run in the workspace directory
    const wrappedCommand = `cd '${workDir}' && ${command}`;

    const result = await sandbox.commands.run(wrappedCommand, {
      timeoutMs: COMMAND_TIMEOUT_MS,
    });

    return NextResponse.json({
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      exitCode: result.exitCode ?? 0,
    });
  } catch (err: any) {
    // Handle command exit with non-zero code (CommandExitError) gracefully
    if (err && typeof err === "object" && "result" in err) {
      const cmdResult = err.result;
      return NextResponse.json({
        stdout: cmdResult?.stdout || "",
        stderr: cmdResult?.stderr || "",
        exitCode: cmdResult?.exitCode ?? 1,
      });
    }

    // Handle command timeout
    if (err?.message?.includes("timeout") || err?.message?.includes("Timeout")) {
      return NextResponse.json({
        stdout: "",
        stderr: `\x1b[31mCommand timed out after ${COMMAND_TIMEOUT_MS / 1000}s. Try a shorter operation.\x1b[0m`,
        exitCode: 124,
      });
    }

    // Handle sandbox not found / expired
    if (err?.message?.includes("404") || err?.status === 404) {
      return NextResponse.json({
        stdout: "",
        stderr: "\x1b[33mSandbox expired. Wake up the agent first to restore the environment.\x1b[0m",
        exitCode: 1,
      });
    }

    console.error("[Terminal API] Error:", err);
    return NextResponse.json(
      {
        stdout: "",
        stderr: `\x1b[31mError: ${err.message || "Unknown error"}\x1b[0m`,
        exitCode: 1,
      },
      { status: 200 }
    );
  }
}
