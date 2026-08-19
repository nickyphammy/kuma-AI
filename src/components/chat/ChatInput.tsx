"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled: boolean;
  placeholder: string;
};

const MAX_HEIGHT = 200;

export function ChatInput({ onSend, onStop, streaming, disabled, placeholder }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow up to MAX_HEIGHT, then scroll.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled || streaming) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2 focus-within:border-[var(--color-border-strong)]">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none disabled:cursor-not-allowed"
        />
        {streaming ? (
          <Button variant="secondary" size="icon" onClick={onStop} title="Stop generating">
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={submit}
            disabled={disabled || value.trim().length === 0}
            title="Send (Enter)"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mx-auto mt-1.5 max-w-4xl px-1 text-[11px] text-[var(--color-fg-subtle)]">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  );
}
