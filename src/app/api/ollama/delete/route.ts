import { NextResponse } from "next/server";
import { deleteModel } from "@/lib/ollama";
import { errorResponse, readModelBody } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Destructive: removes the model's weights from disk. Requires a re-pull to use again. */
export async function POST(request: Request) {
  try {
    const { model } = await readModelBody(request);
    await deleteModel(model);
    return NextResponse.json({ ok: true, model });
  } catch (err) {
    return errorResponse(err);
  }
}
