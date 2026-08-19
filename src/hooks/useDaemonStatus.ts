"use client";

import { useCallback, useEffect, useState } from "react";
import type { DaemonStatus } from "@/lib/types";

const POLL_MS = 8000;

export function useDaemonStatus() {
  const [status, setStatus] = useState<DaemonStatus>({ state: "checking" });

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/ollama/version", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; version?: string; error?: string };
      setStatus(
        data.ok
          ? { state: "online", version: data.version ?? "unknown" }
          : { state: "offline", error: data.error ?? "Ollama is not reachable." },
      );
    } catch (err) {
      setStatus({
        state: "offline",
        error: err instanceof Error ? err.message : "Ollama is not reachable.",
      });
    }
  }, []);

  useEffect(() => {
    void check();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [check]);

  return { status, check };
}
