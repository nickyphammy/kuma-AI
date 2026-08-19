"use client";

import { Cpu, Loader2, PowerOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplitBar } from "@/components/ui/progress";
import type { RunningModel } from "@/lib/types";
import { formatBytes, formatCountdown, formatPercent } from "@/lib/format";

type Props = {
  model: RunningModel;
  busy: boolean;
  onUnload: (name: string) => void;
};

export function RunningModelRow({ model, busy, onUnload }: Props) {
  const onGpu = model.vramPercent >= 99.5;
  const onCpuOnly = model.sizeVram === 0;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-[13px] text-[var(--color-fg)]">{model.name}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-fg-subtle)]">
            {model.parameterSize} · {model.quantization}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onUnload(model.name)}
          title="Free this model's memory. Weights stay on disk."
          className="shrink-0"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" />}
          Unload
        </Button>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] tabular-nums">
          <span className="font-medium text-[var(--color-fg-muted)]">
            {formatBytes(model.sizeTotal)} resident
          </span>
          <span className="text-[var(--color-fg-subtle)]">
            {onGpu
              ? "100% GPU"
              : onCpuOnly
                ? "100% CPU"
                : `${formatPercent(model.vramPercent)} GPU`}
          </span>
        </div>

        <SplitBar vramPercent={model.vramPercent} />

        <div className="flex items-center gap-3 text-[11px] text-[var(--color-fg-subtle)] tabular-nums">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-[var(--color-success)]" />
            {formatBytes(model.sizeVram)} VRAM
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3 text-[var(--color-warning)]" />
            {formatBytes(model.sizeCpu)} RAM
          </span>
        </div>

        {onCpuOnly && (
          <p className="text-[11px] text-[var(--color-warning)]">
            Running entirely on CPU — expect slow generation.
          </p>
        )}

        <p className="text-[11px] text-[var(--color-fg-subtle)]">
          auto-evicts in {formatCountdown(model.expiresInSec)}
        </p>
      </div>
    </div>
  );
}
