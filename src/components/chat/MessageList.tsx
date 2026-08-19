"use client";

import { useEffect, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import type { UiMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

type Props = {
  messages: UiMessage[];
  streaming: boolean;
  modelName: string | null;
};

const STARTERS = [
  "Explain the KV cache in one paragraph.",
  "Write a TypeScript function that debounces an async call.",
  "What tradeoffs come with Q4 quantization?",
];

export function MessageList({ messages, streaming, modelName }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  // Only auto-scroll when the user is already near the bottom.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pinnedRef.current) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)] text-[var(--color-accent)]">
          <MessageSquareText className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-fg)]">
            {modelName ? `Chatting with ${modelName}` : "Pick a model to get started"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
            Runs entirely on your machine. Nothing is sent anywhere.
          </p>
        </div>
        <ul className="mt-2 space-y-1 text-xs text-[var(--color-fg-subtle)]">
          {STARTERS.map((s) => (
            <li key={s}>&ldquo;{s}&rdquo;</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-5">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            streaming={streaming && i === messages.length - 1 && m.role === "assistant"}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
