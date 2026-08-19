"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MODEL_CATALOG } from "@/lib/catalog";
import type { PullProgress } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { readErrorMessage, readNdjson } from "@/lib/ndjson";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installedNames: string[];
  onPulled: () => void;
};

export function PullModelDialog({ open, onOpenChange, installedNames, onPulled }: Props) {
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState("");
  const [pulling, setPulling] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const installed = useMemo(() => new Set(installedNames), [installedNames]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODEL_CATALOG;
    return MODEL_CATALOG.filter((m) =>
      [m.name, m.label, m.publisher, m.description, ...m.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const resetProgress = () => {
    setStatus("");
    setCompleted(0);
    setTotal(0);
    setError(null);
    setDone(null);
  };

  const pull = useCallback(
    async (name: string) => {
      const model = name.trim();
      if (!model || pulling) return;

      resetProgress();
      setPulling(model);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ollama/pull", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setError(await readErrorMessage(res, `Pull failed (${res.status}).`));
          return;
        }

        for await (const chunk of readNdjson<PullProgress>(res.body)) {
          if (chunk.error) {
            setError(chunk.error);
            return;
          }
          if (chunk.status) setStatus(chunk.status);
          if (typeof chunk.completed === "number") setCompleted(chunk.completed);
          if (typeof chunk.total === "number") setTotal(chunk.total);
        }

        setDone(model);
        onPulled();
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === "AbortError";
        if (!aborted) setError(err instanceof Error ? err.message : "Pull failed.");
      } finally {
        abortRef.current = null;
        setPulling(null);
      }
    },
    [onPulled, pulling],
  );

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPulling(null);
    setStatus("Cancelled.");
  };

  const percent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pulling) return; // don't close mid-download
        if (!next) resetProgress();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pull a model</DialogTitle>
          <DialogDescription>
            Downloads open-source weights to your machine via Ollama. Nothing leaves your computer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-3 border-b border-[var(--color-border)] px-5 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter the catalog — try 'code', 'reasoning', 'tiny'"
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div className="flex gap-2">
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manual.trim()) void pull(manual);
                }}
                placeholder="…or type any Ollama reference, e.g. llama3.3:70b"
                className="h-9 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 font-mono text-xs text-[var(--color-fg)] placeholder:font-sans placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
              <Button
                size="md"
                disabled={!manual.trim() || pulling !== null}
                onClick={() => void pull(manual)}
              >
                <Download className="h-4 w-4" />
                Pull
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
            <div className="grid gap-2">
              {filtered.map((entry) => {
                const isInstalled = installed.has(entry.name);
                const isPulling = pulling === entry.name;
                return (
                  <div
                    key={entry.name}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 transition-colors",
                      isPulling && "border-[var(--color-accent)]",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-fg)]">
                          {entry.label}
                        </span>
                        <code className="rounded bg-[var(--color-bg-subtle)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-fg-muted)]">
                          {entry.name}
                        </code>
                        {entry.tags.includes("recommended") && <Badge tone="accent">start here</Badge>}
                        {entry.tags.includes("code") && <Badge>code</Badge>}
                        {entry.tags.includes("reasoning") && <Badge>reasoning</Badge>}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-fg-muted)]">
                        {entry.description}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-fg-subtle)]">
                        {entry.publisher} · {entry.size}
                      </p>
                    </div>
                    {isInstalled ? (
                      <span className="flex shrink-0 items-center gap-1.5 pt-1 text-xs text-[var(--color-success)]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        installed
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pulling !== null}
                        onClick={() => void pull(entry.name)}
                        className="shrink-0"
                      >
                        {isPulling ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {isPulling ? "Pulling" : "Pull"}
                      </Button>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--color-fg-subtle)]">
                  No catalog match. You can still type the exact reference above.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-col">
          {(pulling || status || error || done) && (
            <div className="w-full space-y-1.5">
              {error ? (
                <p className="flex items-start gap-2 text-xs text-[var(--color-danger)]">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              ) : done ? (
                <p className="flex items-center gap-2 text-xs text-[var(--color-success)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {done} is ready to use.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
                    <span className="truncate font-mono">{status || "starting…"}</span>
                    {total > 0 && (
                      <span className="ml-3 shrink-0 tabular-nums">
                        {formatBytes(completed)} / {formatBytes(total)} · {Math.round(percent)}%
                      </span>
                    )}
                  </div>
                  <Progress value={percent} indeterminate={total === 0 && pulling !== null} />
                </>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            {pulling ? (
              <Button variant="danger" size="sm" onClick={cancel}>
                Cancel download
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
