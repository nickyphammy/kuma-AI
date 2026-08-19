"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelect } from "@/components/models/ModelSelect";
import type { InstalledModel, UiMessage } from "@/lib/types";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

type Props = {
  models: InstalledModel[];
  selectedModel: string | null;
  onSelectModel: (model: string) => void;
  onRequestPull: () => void;
  onRefreshModels: () => void;
  messages: UiMessage[];
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onReset: () => void;
  daemonOnline: boolean;
};

export function ChatPanel({
  models,
  selectedModel,
  onSelectModel,
  onRequestPull,
  onRefreshModels,
  messages,
  streaming,
  onSend,
  onStop,
  onReset,
  daemonOnline,
}: Props) {
  const canChat = daemonOnline && selectedModel !== null;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <ModelSelect
          models={models}
          value={selectedModel}
          onChange={onSelectModel}
          onRequestPull={onRequestPull}
          onRefresh={onRefreshModels}
          disabled={!daemonOnline || streaming}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={messages.length === 0}
          title="Clear this conversation"
        >
          <Plus className="h-3.5 w-3.5" />
          New chat
        </Button>
      </div>

      {models.length === 0 && daemonOnline ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-[var(--color-fg)]">No models installed yet</p>
          <p className="max-w-sm text-xs text-[var(--color-fg-subtle)]">
            Pull an open-source model to start chatting. llama3.2:3b is a good first choice — about
            2 GB and fast on most machines.
          </p>
          <Button size="md" onClick={onRequestPull} className="mt-1">
            Browse models to pull
          </Button>
        </div>
      ) : (
        <MessageList messages={messages} streaming={streaming} modelName={selectedModel} />
      )}

      <ChatInput
        onSend={onSend}
        onStop={onStop}
        streaming={streaming}
        disabled={!canChat}
        placeholder={
          !daemonOnline
            ? "Ollama is not running"
            : selectedModel
              ? `Message ${selectedModel}…`
              : "Select a model first"
        }
      />
    </section>
  );
}
