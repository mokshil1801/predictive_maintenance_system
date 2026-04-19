import { Card } from "@/components/Card";

export function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-text-soft">
        {label}
      </p>
      <p className="text-4xl font-semibold tracking-tight text-text">{value}</p>
      <p className="text-sm text-text-muted">{detail}</p>
    </Card>
  );
}
