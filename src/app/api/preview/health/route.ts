import { NextRequest, NextResponse } from "next/server";
import { isPreviewUrlReachable } from "@/lib/sandbox-preview";

function isAllowedPreviewUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") {
      return false;
    }

    return parsed.hostname.endsWith(".e2b.app");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url || !isAllowedPreviewUrl(url)) {
      return NextResponse.json({ ok: false, reachable: false, error: "Invalid preview URL" }, { status: 400 });
    }

    // Keep checks fast so UI polling doesn't add minutes of latency.
    const reachable = await isPreviewUrlReachable(url, 1200);
    return NextResponse.json({ ok: true, reachable }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, reachable: false, error: "Health check failed" }, { status: 500 });
  }
}
