export function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold uppercase tracking-[0.16em] text-text-soft">
          {label}
        </label>
        {hint ? <span className="text-sm text-text-muted">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
