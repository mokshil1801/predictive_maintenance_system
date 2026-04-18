import { Download, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KpiCard } from "@/components/KpiCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Table } from "@/components/Table";
import { TrendChart } from "@/components/TrendChart";
import { healthBreakdown, principalIssues, trendPoints } from "@/lib/fixahead-data";

export default function PrincipalPage() {
  const rows = principalIssues.map((issue) => [
    <span key={`${issue.id}-id`} className="font-medium text-text">
      {issue.id}
    </span>,
    <span key={`${issue.id}-location`} className="font-medium text-text">
      {issue.location}
    </span>,
    <span key={`${issue.id}-category`} className="text-text">
      {issue.category}
    </span>,
    <span key={`${issue.id}-status`} className="text-text">
      {issue.status}
    </span>,
    <span key={`${issue.id}-note`} className="max-w-[260px] text-text-muted">
      {issue.note}
    </span>,
  ]);

  return (
    <AppShell
      activeHref="/principal"
      title="School Condition Overview"
      subtitle="Monitor active issues, category health, and recent deterioration trends for your campus."
      roleLabel="Principal View"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="secondary">
            <Download className="size-4" />
            Export school report
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <KpiCard
            label="Overall condition score"
            value="68/100"
            detail="Down 4 points after restroom and corridor electrical issues"
          />
          <KpiCard
            label="High-risk alerts"
            value="3"
            detail="Toilet failure risk, exposed wiring, and wall crack progression"
          />
          <KpiCard
            label="Active maintenance"
            value="5"
            detail="Two contractor visits scheduled this week"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">
                  Category breakdown
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                  System health
                </h2>
              </div>
              <Badge label="Updated from weekly form" tone="neutral" />
            </div>

            <div className="space-y-5">
              {healthBreakdown.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text">{item.label}</p>
                    <p className="font-semibold text-text">{item.value}%</p>
                  </div>
                  <ProgressBar
                    value={item.value}
                    tone={
                      item.tone === "critical"
                        ? "danger"
                        : item.tone === "high"
                          ? "warning"
                          : "primary"
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">
                  Trend chart
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                  Campus condition trend
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-strong px-4 py-2 text-sm font-medium text-primary">
                <TrendingUp className="size-4" />
                Last 12 weekly reports
              </div>
            </div>
            <TrendChart points={trendPoints} scoreLabel="68/100" />
          </Card>
        </div>

        <Card className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">
                School issue table
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text">
                Current repair and monitoring status
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-text-muted">
              Share this view with school management and district officials to explain which issues are waiting for approval, already assigned, or still under watch.
            </p>
          </div>
          <Table
            columns={["Issue ID", "Location", "Category", "Status", "Latest note"]}
            rows={rows}
          />
        </Card>
      </div>
    </AppShell>
  );
}
