import { cn } from "@/lib/utils";

type AuthFieldProps = {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function AuthField({ label, error, className, ...props }: AuthFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-text">{label}</span>
      <input
        className={cn(
          "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition placeholder:text-text-soft focus:border-primary focus:ring-4 focus:ring-primary/10",
          error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
