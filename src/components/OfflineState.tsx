"use client";

import { PlugZap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)] text-[var(--color-danger)]">
        <PlugZap className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-fg)]">Ollama isn&apos;t running</h1>
        <p className="mt-1 max-w-md text-sm text-[var(--color-fg-muted)]">{error}</p>
      </div>
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 text-left">
        <p className="text-xs font-medium text-[var(--color-fg-muted)]">Start it with:</p>
        <code className="mt-2 block rounded bg-[var(--color-bg)] px-3 py-2 font-mono text-xs text-[var(--color-accent)]">
          ollama serve
        </code>
        <p className="mt-3 text-[11px] text-[var(--color-fg-subtle)]">
          Or just launch the Ollama desktop app. kumaUI reconnects on its own — this page checks
          every 8 seconds.
        </p>
      </div>
      <Button variant="secondary" size="md" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Retry now
      </Button>
    </div>
  );
}
