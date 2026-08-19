import { NextResponse } from "next/server";
import { OllamaError } from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Turn any thrown value into a uniform `{ error }` JSON response. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof OllamaError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Read and validate a JSON body that must contain a non-empty `model` string. */
export async function readModelBody(
  request: Request,
): Promise<{ model: string } & Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new OllamaError("Request body must be JSON.", 400);
  }
  if (typeof body !== "object" || body === null) {
    throw new OllamaError("Request body must be a JSON object.", 400);
  }
  const model = (body as { model?: unknown }).model;
  if (typeof model !== "string" || model.trim() === "") {
    throw new OllamaError("`model` is required and must be a non-empty string.", 400);
  }
  return { ...(body as Record<string, unknown>), model: model.trim() };
}

/**
 * Pipe an upstream NDJSON body to the client, appending a trailing `{"error":...}`
 * line if the upstream dies mid-stream so the UI can surface it.
 */
export function passthroughStream(upstream: Response): Response {
  const body = upstream.body;
  if (!body) {
    return NextResponse.json({ error: "Ollama returned an empty stream." }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream interrupted.";
        // Ignore client-initiated aborts — nothing to report.
        if (!/abort/i.test(message)) {
          controller.enqueue(encoder.encode(`\n${JSON.stringify({ error: message })}\n`));
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        reader.releaseLock();
      }
    },
    cancel() {
      body.cancel().catch(() => undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
