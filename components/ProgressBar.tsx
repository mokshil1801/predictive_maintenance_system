import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    primary: "bg-primary",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <div className={cn("h-2 rounded-full bg-surface-muted", className)}>
      <div
        className={cn("h-full rounded-full", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}
