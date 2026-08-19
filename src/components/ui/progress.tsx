import { cn } from "@/lib/utils";

type ProgressProps = {
  /** 0-100 */
  value: number;
  className?: string;
  barClassName?: string;
  indeterminate?: boolean;
};

export function Progress({ value, className, barClassName, indeterminate }: ProgressProps) {
  const clamped = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300 ease-out",
          indeterminate && "animate-pulse",
          barClassName,
        )}
        style={{ width: indeterminate ? "100%" : `${clamped}%` }}
      />
    </div>
  );
}

/** Two-segment bar: GPU portion then CPU portion. */
export function SplitBar({ vramPercent, className }: { vramPercent: number; className?: string }) {
  const gpu = Math.min(Math.max(vramPercent, 0), 100);
  return (
    <div
      className={cn(
        "flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]",
        className,
      )}
    >
      <div className="h-full bg-[var(--color-success)]" style={{ width: `${gpu}%` }} />
      <div className="h-full bg-[var(--color-warning)]" style={{ width: `${100 - gpu}%` }} />
    </div>
  );
}
