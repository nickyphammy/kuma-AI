"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useDaemonStatus } from "@/hooks/useDaemonStatus";
import { useModels } from "@/hooks/useModels";
import { useChat } from "@/hooks/useChat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ResourcePanel } from "@/components/resources/ResourcePanel";
import { PullModelDialog } from "@/components/models/PullModelDialog";
import { OfflineState } from "@/components/OfflineState";

export default function Home() {
  const { status, check } = useDaemonStatus();
  const { models, refresh: refreshModels } = useModels();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [pullOpen, setPullOpen] = useState(false);

  const online = status.state === "online";
  const { messages, streaming, send, stop, reset } = useChat(selectedModel);

  // Auto-select the first installed model, and drop a selection that disappeared.
  useEffect(() => {
    if (models.length === 0) {
      setSelectedModel(null);
      return;
    }
    setSelectedModel((current) =>
      current && models.some((m) => m.name === current) ? current : models[0].name,
    );
  }, [models]);

  // Re-read the model list as soon as the daemon comes back.
  useEffect(() => {
    if (online) void refreshModels();
  }, [online, refreshModels]);

  const handlePulled = useCallback(() => {
    void refreshModels();
  }, [refreshModels]);

  return (
    <main className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-[var(--color-fg)]">
            kuma<span className="text-[var(--color-accent)]">UI</span>
          </span>
          <span className="text-[11px] text-[var(--color-fg-subtle)]">local models, local data</span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status.state === "online" && "bg-[var(--color-success)]",
              status.state === "offline" && "bg-[var(--color-danger)]",
              status.state === "checking" && "bg-[var(--color-warning)] animate-pulse",
            )}
            aria-hidden
          />
          <span className="text-[var(--color-fg-muted)]">
            {status.state === "online"
              ? `ollama ${status.version}`
              : status.state === "checking"
                ? "connecting…"
                : "disconnected"}
          </span>
        </div>
      </header>

      {status.state === "offline" ? (
        <OfflineState error={status.error} onRetry={() => void check()} />
      ) : (
        <div className="flex min-h-0 flex-1">
          <ChatPanel
            models={models}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onRequestPull={() => setPullOpen(true)}
            onRefreshModels={() => void refreshModels()}
            messages={messages}
            streaming={streaming}
            onSend={send}
            onStop={stop}
            onReset={reset}
            daemonOnline={online}
          />
          <ResourcePanel
            installed={models}
            onModelsChanged={() => void refreshModels()}
            enabled={online}
          />
        </div>
      )}

      <PullModelDialog
        open={pullOpen}
        onOpenChange={setPullOpen}
        installedNames={models.map((m) => m.name)}
        onPulled={handlePulled}
      />
    </main>
  );
}
