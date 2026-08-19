import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
};

const TONES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]",
  accent:
    "bg-[color-mix(in_oklch,var(--color-accent)_20%,transparent)] text-[var(--color-accent)]",
  success:
    "bg-[color-mix(in_oklch,var(--color-success)_18%,transparent)] text-[var(--color-success)]",
  warning:
    "bg-[color-mix(in_oklch,var(--color-warning)_18%,transparent)] text-[var(--color-warning)]",
  danger:
    "bg-[color-mix(in_oklch,var(--color-danger)_18%,transparent)] text-[var(--color-danger)]",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
