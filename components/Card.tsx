import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-shadow rounded-[28px] border border-white/70 bg-surface p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
