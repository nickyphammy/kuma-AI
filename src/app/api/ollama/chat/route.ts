import { OllamaError, streamChat } from "@/lib/ollama";
import type { ChatMessage } from "@/lib/types";
import { errorResponse, passthroughStream, readModelBody } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3600;

const VALID_ROLES = new Set(["system", "user", "assistant"]);

function parseMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new OllamaError("`messages` must be a non-empty array.", 400);
  }
  return raw.map((entry, i) => {
    if (typeof entry !== "object" || entry === null) {
      throw new OllamaError(`messages[${i}] must be an object.`, 400);
    }
    const { role, content } = entry as { role?: unknown; content?: unknown };
    if (typeof role !== "string" || !VALID_ROLES.has(role)) {
      throw new OllamaError(`messages[${i}].role must be system, user, or assistant.`, 400);
    }
    if (typeof content !== "string") {
      throw new OllamaError(`messages[${i}].content must be a string.`, 400);
    }
    return { role: role as ChatMessage["role"], content };
  });
}

/**
 * Streams NDJSON chat chunks straight from Ollama:
 * `{ message: { role, content }, done: false }` ... then a final
 * `{ done: true, total_duration, load_duration, prompt_eval_count, eval_count, eval_duration }`.
 */
export async function POST(request: Request) {
  try {
    const body = await readModelBody(request);
    const messages = parseMessages(body.messages);
    const params =
      typeof body.options === "object" && body.options !== null
        ? (body.options as Record<string, unknown>)
        : {};

    const upstream = await streamChat(body.model, messages, {
      signal: request.signal,
      params,
    });
    return passthroughStream(upstream);
  } catch (err) {
    return errorResponse(err);
  }
}
