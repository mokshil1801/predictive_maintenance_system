import { cn } from "@/lib/utils";

type AuthSelectProps = {
  label: string;
  error?: string;
  options: Array<{ label: string; value: string }>;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export function AuthSelect({
  label,
  error,
  options,
  className,
  ...props
}: AuthSelectProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-text">{label}</span>
      <select
        className={cn(
          "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10",
          error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
