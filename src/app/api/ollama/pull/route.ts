import { streamPull } from "@/lib/ollama";
import { errorResponse, passthroughStream, readModelBody } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3600;

/** Streams NDJSON download progress: `{ status, digest?, total?, completed? }`. */
export async function POST(request: Request) {
  try {
    const { model } = await readModelBody(request);
    const upstream = await streamPull(model, request.signal);
    return passthroughStream(upstream);
  } catch (err) {
    return errorResponse(err);
  }
}
