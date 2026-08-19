"use client";

import { AlertCircle, Bot, User } from "lucide-react";
import type { UiMessage } from "@/lib/types";
import { formatDuration, formatTokensPerSecond } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  message: UiMessage;
  /** True for the last assistant message while tokens are still arriving. */
  streaming?: boolean;
};

export function MessageBubble({ message, streaming }: Props) {
  const isUser = message.role === "user";
  const empty = message.content.length === 0;

  return (
    <div className={cn("flex gap-3 px-1", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-subtle)] text-[var(--color-accent)]">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={cn("min-w-0 max-w-[min(46rem,80%)]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
              : "border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg)]",
          )}
        >
          <span className="whitespace-pre-wrap break-words">
            {empty && streaming ? (
              <span className="text-[var(--color-fg-subtle)]">thinking…</span>
            ) : (
              message.content
            )}
          </span>
          {streaming && !empty && <span className="kuma-caret" aria-hidden />}
        </div>

        {message.error && (
          <p className="mt-1.5 flex items-start gap-1.5 px-1 text-xs text-[var(--color-danger)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {message.error}
          </p>
        )}

        {message.stats && (
          <p className="mt-1.5 px-1 font-mono text-[11px] text-[var(--color-fg-subtle)] tabular-nums">
            {formatTokensPerSecond(message.stats.tokensPerSecond)} ·{" "}
            {formatDuration(message.stats.totalDurationMs)} · {message.stats.evalTokens} out /{" "}
            {message.stats.promptTokens} in
            {message.stats.loadDurationMs > 250 &&
              ` · ${formatDuration(message.stats.loadDurationMs)} load`}
            {message.model && ` · ${message.model}`}
          </p>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
