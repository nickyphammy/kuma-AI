/**
 * Read a `\n`-delimited JSON stream, yielding one parsed object per line.
 * Keeps a buffer across chunks so a JSON object split across two network
 * chunks is not dropped. Malformed lines are skipped rather than thrown.
 */
export async function* readNdjson<T>(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<T, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;
        try {
          yield JSON.parse(line) as T;
        } catch {
          /* skip malformed line */
        }
      }
    }

    const tail = buffer.trim();
    if (tail) {
      try {
        yield JSON.parse(tail) as T;
      } catch {
        /* skip malformed tail */
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Extract the `error` field from a non-streaming JSON error response. */
export async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
