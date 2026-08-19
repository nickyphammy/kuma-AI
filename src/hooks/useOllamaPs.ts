"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunningModel } from "@/lib/types";
import { readErrorMessage } from "@/lib/ndjson";

const POLL_MS = 3000;

type Totals = { resident: number; vram: number; cpu: number; count: number };

const EMPTY_TOTALS: Totals = { resident: 0, vram: 0, cpu: 0, count: 0 };

/** Polls `ollama ps` every 3s. Pauses while the tab is hidden to avoid pointless load. */
export function useOllamaPs(enabled = true) {
  const [running, setRunning] = useState<RunningModel[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/ollama/ps", { cache: "no-store" });
      if (!res.ok) {
        setError(await readErrorMessage(res, "Could not read running models."));
        setRunning([]);
        setTotals(EMPTY_TOTALS);
        return;
      }
      const data = (await res.json()) as { models: RunningModel[]; totals: Totals };
      setRunning(data.models ?? []);
      setTotals(data.totals ?? EMPTY_TOTALS);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read running models.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  // Local countdown so the eviction timer ticks between polls.
  useEffect(() => {
    const id = setInterval(() => {
      setRunning((prev) =>
        prev.map((m) => ({ ...m, expiresInSec: Math.max(m.expiresInSec - 1, 0) })),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return { running, totals, error, loading, refresh };
}
