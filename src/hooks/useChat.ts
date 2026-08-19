"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, ChatStats, UiMessage } from "@/lib/types";
import { readErrorMessage, readNdjson } from "@/lib/ndjson";

type ChatChunk = {
  message?: { role?: string; content?: string };
  done?: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
  error?: string;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildStats(chunk: ChatChunk): ChatStats {
  const evalTokens = chunk.eval_count ?? 0;
  const evalDurationNs = chunk.eval_duration ?? 0;
  return {
    totalDurationMs: (chunk.total_duration ?? 0) / 1e6,
    loadDurationMs: (chunk.load_duration ?? 0) / 1e6,
    promptTokens: chunk.prompt_eval_count ?? 0,
    evalTokens,
    tokensPerSecond: evalDurationNs > 0 ? evalTokens / (evalDurationNs / 1e9) : 0,
  };
}

export function useChat(model: string | null) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const send = useCallback(
    async (text: string) => {
      const prompt = text.trim();
      if (!prompt || !model || streaming) return;

      const userMessage: UiMessage = { id: newId(), role: "user", content: prompt };
      const assistantId = newId();
      const assistantMessage: UiMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        model,
      };

      // Snapshot history before the optimistic append so we send clean payload.
      const history: ChatMessage[] = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const patch = (updater: (m: UiMessage) => UiMessage) => {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? updater(m) : m)));
      };

      try {
        const res = await fetch("/api/ollama/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const message = await readErrorMessage(res, `Request failed (${res.status}).`);
          patch((m) => ({ ...m, error: message }));
          return;
        }

        for await (const chunk of readNdjson<ChatChunk>(res.body)) {
          if (chunk.error) {
            patch((m) => ({ ...m, error: chunk.error }));
            break;
          }
          const delta = chunk.message?.content;
          if (delta) patch((m) => ({ ...m, content: m.content + delta }));
          if (chunk.done) patch((m) => ({ ...m, stats: buildStats(chunk) }));
        }
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === "AbortError";
        if (!aborted) {
          const message = err instanceof Error ? err.message : "Generation failed.";
          patch((m) => ({ ...m, error: message }));
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [messages, model, streaming],
  );

  return { messages, streaming, send, stop, reset };
}
