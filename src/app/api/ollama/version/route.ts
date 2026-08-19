import { NextResponse } from "next/server";
import { getVersion } from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const version = await getVersion();
    return NextResponse.json({ ok: true, version });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ollama is unreachable.";
    // 200 on purpose: "daemon is down" is a valid answer to a health probe.
    return NextResponse.json({ ok: false, error: message });
  }
}
