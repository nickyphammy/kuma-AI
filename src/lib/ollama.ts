/**
 * Server-side Ollama client. Never import this from a "use client" file.
 *
 * Every browser-facing call goes through `src/app/api/ollama/*`, which uses these
 * helpers. That keeps CORS out of the picture and gives us one place to shape errors.
 */
import type { InstalledModel, RunningModel } from "./types";

export const OLLAMA_HOST = (process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(
  /\/+$/,
  "",
);

export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 600_000);

/** Thrown when the daemon answers with a non-2xx, or cannot be reached at all. */
export class OllamaError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "OllamaError";
    this.status = status;
  }
}

function unreachableMessage(err: unknown): string {
  const detail = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED|fetch failed|ENOTFOUND|EHOSTUNREACH/i.test(detail)) {
    return `Cannot reach the Ollama daemon at ${OLLAMA_HOST}. Start it with \`ollama serve\`.`;
  }
  return detail;
}

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

/** Raw fetch against the daemon. Returns the Response so callers can stream it. */
export async function ollamaFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const { method = "GET", body, signal, timeoutMs = OLLAMA_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_HOST}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted && !signal?.aborted) {
      throw new OllamaError(`Ollama request to ${path} timed out after ${timeoutMs}ms.`, 504);
    }
    throw new OllamaError(unreachableMessage(err), 503);
  }

  // Streaming callers need the timer cleared only once the body is consumed; for
  // simplicity we clear now and rely on the caller aborting via its own signal.
  clearTimeout(timer);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) detail = parsed.error;
    } catch {
      /* keep raw text */
    }
    throw new OllamaError(detail || `Ollama returned ${res.status} for ${path}.`, res.status);
  }

  return res;
}

async function ollamaJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await ollamaFetch(path, options);
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Raw upstream shapes                                                 */
/* ------------------------------------------------------------------ */

type RawDetails = {
  family?: string;
  parameter_size?: string;
  quantization_level?: string;
};

type RawTagModel = {
  name: string;
  model?: string;
  digest: string;
  size: number;
  modified_at: string;
  details?: RawDetails;
};

type RawPsModel = {
  name: string;
  model?: string;
  digest: string;
  size: number;
  size_vram: number;
  expires_at: string;
  details?: RawDetails;
};

/* ------------------------------------------------------------------ */
/* Public helpers                                                      */
/* ------------------------------------------------------------------ */

export async function getVersion(): Promise<string> {
  const data = await ollamaJson<{ version?: string }>("/api/version", { timeoutMs: 5_000 });
  return data.version ?? "unknown";
}

export async function listInstalled(): Promise<InstalledModel[]> {
  const data = await ollamaJson<{ models?: RawTagModel[] }>("/api/tags", { timeoutMs: 15_000 });
  const models = data.models ?? [];
  return models
    .map((m) => ({
      name: m.name,
      digest: m.digest,
      size: m.size ?? 0,
      modifiedAt: m.modified_at ?? new Date().toISOString(),
      family: m.details?.family ?? "unknown",
      parameterSize: m.details?.parameter_size ?? "—",
      quantization: m.details?.quantization_level ?? "—",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listRunning(): Promise<RunningModel[]> {
  const data = await ollamaJson<{ models?: RawPsModel[] }>("/api/ps", { timeoutMs: 15_000 });
  const models = data.models ?? [];
  const now = Date.now();

  return models
    .map((m) => {
      const sizeTotal = m.size ?? 0;
      const sizeVram = m.size_vram ?? 0;
      const expiresMs = new Date(m.expires_at ?? 0).getTime();
      return {
        name: m.name,
        digest: m.digest,
        family: m.details?.family ?? "unknown",
        parameterSize: m.details?.parameter_size ?? "—",
        quantization: m.details?.quantization_level ?? "—",
        sizeTotal,
        sizeVram,
        sizeCpu: Math.max(sizeTotal - sizeVram, 0),
        vramPercent: sizeTotal > 0 ? (sizeVram / sizeTotal) * 100 : 0,
        expiresAt: m.expires_at ?? "",
        expiresInSec: Number.isFinite(expiresMs) ? Math.max((expiresMs - now) / 1000, 0) : 0,
      };
    })
    .sort((a, b) => b.sizeTotal - a.sizeTotal);
}

/** Evict a model from memory without touching the weights on disk. */
export async function unloadModel(model: string): Promise<void> {
  await ollamaFetch("/api/generate", {
    method: "POST",
    body: { model, keep_alive: 0 },
    timeoutMs: 30_000,
  });
}

/** Permanently remove a model's weights from disk. */
export async function deleteModel(model: string): Promise<void> {
  await ollamaFetch("/api/delete", {
    method: "DELETE",
    body: { model },
    timeoutMs: 60_000,
  });
}

/** Streaming chat. Returns the raw NDJSON response for passthrough. */
export function streamChat(
  model: string,
  messages: { role: string; content: string }[],
  options: { signal?: AbortSignal; params?: Record<string, unknown> } = {},
): Promise<Response> {
  return ollamaFetch("/api/chat", {
    method: "POST",
    body: { model, messages, stream: true, options: options.params ?? {} },
    signal: options.signal,
  });
}

/** Streaming model download. Returns the raw NDJSON response for passthrough. */
export function streamPull(model: string, signal?: AbortSignal): Promise<Response> {
  return ollamaFetch("/api/pull", {
    method: "POST",
    body: { model, stream: true },
    signal,
  });
}
