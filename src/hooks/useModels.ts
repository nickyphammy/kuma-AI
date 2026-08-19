"use client";

import { useCallback, useEffect, useState } from "react";
import type { InstalledModel } from "@/lib/types";
import { readErrorMessage } from "@/lib/ndjson";

export function useModels() {
  const [models, setModels] = useState<InstalledModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ollama/tags", { cache: "no-store" });
      if (!res.ok) {
        setError(await readErrorMessage(res, "Could not load installed models."));
        setModels([]);
        return;
      }
      const data = (await res.json()) as { models: InstalledModel[] };
      setModels(data.models ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load installed models.");
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { models, loading, error, refresh };
}
