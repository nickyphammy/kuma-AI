"use client";

import { useCallback, useState } from "react";
import { Activity, AlertCircle, HardDrive, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOllamaPs } from "@/hooks/useOllamaPs";
import type { InstalledModel } from "@/lib/types";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { readErrorMessage } from "@/lib/ndjson";
import { RunningModelRow } from "./RunningModelRow";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

type Props = {
  installed: InstalledModel[];
  onModelsChanged: () => void;
  enabled: boolean;
};

export function ResourcePanel({ installed, onModelsChanged, enabled }: Props) {
  const { running, totals, error, loading, refresh } = useOllamaPs(enabled);
  const [busyModel, setBusyModel] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InstalledModel | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const post = useCallback(async (path: string, model: string) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    if (!res.ok) throw new Error(await readErrorMessage(res, `Request failed (${res.status}).`));
  }, []);

  const unload = useCallback(
    async (name: string) => {
      setBusyModel(name);
      setActionError(null);
      try {
        await post("/api/ollama/unload", name);
        await refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Unload failed.");
      } finally {
        setBusyModel(null);
      }
    },
    [post, refresh],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const name = pendingDelete.name;
    setBusyModel(name);
    setActionError(null);
    try {
      await post("/api/ollama/delete", name);
      setPendingDelete(null);
      onModelsChanged();
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyModel(null);
    }
  }, [onModelsChanged, pendingDelete, post, refresh]);

  const totalDisk = installed.reduce((sum, m) => sum + m.size, 0);

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      {/* Running models */}
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
              Loaded in memory
            </h2>
          </div>
          {running.length > 0 && <Badge tone="accent">{running.length}</Badge>}
        </header>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {error && (
            <p className="flex items-start gap-2 text-xs text-[var(--color-danger)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          {actionError && (
            <p className="flex items-start gap-2 rounded-md bg-[color-mix(in_oklch,var(--color-danger)_14%,transparent)] p-2 text-xs text-[var(--color-danger)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {actionError}
            </p>
          )}

          {loading && running.length === 0 && !error && (
            <p className="flex items-center gap-2 py-4 text-xs text-[var(--color-fg-subtle)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Reading ollama ps…
            </p>
          )}

          {!loading && running.length === 0 && !error && (
            <div className="py-6 text-center">
              <p className="text-xs text-[var(--color-fg-subtle)]">Nothing loaded right now.</p>
              <p className="mt-1 text-[11px] text-[var(--color-fg-subtle)]">
                Send a message and the model will appear here within a few seconds.
              </p>
            </div>
          )}

          {running.map((m) => (
            <RunningModelRow
              key={m.digest + m.name}
              model={m}
              busy={busyModel === m.name}
              onUnload={(name) => void unload(name)}
            />
          ))}
        </div>

        {running.length > 0 && (
          <div className="shrink-0 border-t border-[var(--color-border)] px-4 py-2.5 text-[11px] text-[var(--color-fg-muted)] tabular-nums">
            <div className="flex items-center justify-between">
              <span>Total resident</span>
              <span className="font-medium text-[var(--color-fg)]">
                {formatBytes(totals.resident)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[var(--color-fg-subtle)]">
              <span>{formatBytes(totals.vram)} VRAM</span>
              <span>{formatBytes(totals.cpu)} RAM</span>
            </div>
          </div>
        )}
      </div>

      {/* Installed models */}
      <div className="flex max-h-[45%] min-h-0 flex-col border-t border-[var(--color-border)]">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-[var(--color-fg-muted)]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
              On disk
            </h2>
          </div>
          <span className="text-[11px] text-[var(--color-fg-subtle)] tabular-nums">
            {installed.length} · {formatBytes(totalDisk)}
          </span>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {installed.length === 0 ? (
            <p className="py-4 text-center text-xs text-[var(--color-fg-subtle)]">
              No models installed yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {installed.map((m) => (
                <li key={m.digest + m.name} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12px] text-[var(--color-fg)]">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-[var(--color-fg-subtle)] tabular-nums">
                      {formatBytes(m.size)} · {formatRelativeTime(m.modifiedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 hover:text-[var(--color-danger)]"
                    disabled={busyModel === m.name}
                    onClick={() => setPendingDelete(m)}
                    title={`Delete ${m.name} from disk`}
                    aria-label={`Delete ${m.name} from disk`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="shrink-0 border-t border-[var(--color-border)] px-4 py-2 text-[10px] text-[var(--color-fg-subtle)]">
          Memory view refreshes every 3s · Unload frees RAM, Delete frees disk
        </p>
      </div>

      <ConfirmDeleteDialog
        model={pendingDelete}
        busy={busyModel === pendingDelete?.name}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </aside>
  );
}
