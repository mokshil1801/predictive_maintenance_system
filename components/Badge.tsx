import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/fixahead-data";

const badgeClasses: Record<RiskLevel | "neutral", string> = {
  critical: "bg-red-50 text-red-700 ring-red-200",
  high: "bg-amber-50 text-amber-800 ring-amber-200",
  medium: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  low: "bg-slate-100 text-slate-700 ring-slate-200",
  neutral: "bg-surface-muted text-text-muted ring-border",
};

export function Badge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: RiskLevel | "neutral";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
        badgeClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
