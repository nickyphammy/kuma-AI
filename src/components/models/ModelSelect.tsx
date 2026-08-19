"use client";

import { Download, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { InstalledModel } from "@/lib/types";
import { formatBytes } from "@/lib/format";

const PULL_SENTINEL = "__pull__";

type Props = {
  models: InstalledModel[];
  value: string | null;
  onChange: (model: string) => void;
  onRequestPull: () => void;
  onRefresh: () => void;
  disabled?: boolean;
};

export function ModelSelect({
  models,
  value,
  onChange,
  onRequestPull,
  onRefresh,
  disabled,
}: Props) {
  const hasModels = models.length > 0;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value ?? undefined}
        onValueChange={(next) => {
          if (next === PULL_SENTINEL) onRequestPull();
          else onChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-[320px]">
          <SelectValue placeholder={hasModels ? "Select a model" : "No models installed"} />
        </SelectTrigger>
        <SelectContent>
          {hasModels && (
            <>
              <SelectGroup>
                <SelectLabel>Installed</SelectLabel>
                {models.map((m) => (
                  <SelectItem key={m.digest + m.name} value={m.name}>
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="font-mono text-[13px]">{m.name}</span>
                      <span className="text-[11px] text-[var(--color-fg-subtle)]">
                        {m.parameterSize} · {m.quantization} · {formatBytes(m.size)}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
            </>
          )}
          <SelectItem value={PULL_SENTINEL}>
            <span className="flex items-center gap-2 text-[var(--color-accent)]">
              <Download className="h-3.5 w-3.5" />
              Pull a new model…
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        title="Refresh installed models"
        aria-label="Refresh installed models"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
