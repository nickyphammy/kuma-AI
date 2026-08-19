import { NextResponse } from "next/server";
import { unloadModel } from "@/lib/ollama";
import { errorResponse, readModelBody } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Free a model's memory (VRAM/RAM). The weights stay on disk. */
export async function POST(request: Request) {
  try {
    const { model } = await readModelBody(request);
    await unloadModel(model);
    return NextResponse.json({ ok: true, model });
  } catch (err) {
    return errorResponse(err);
  }
}
