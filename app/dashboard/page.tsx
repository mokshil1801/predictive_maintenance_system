import { ChevronDown, MapPinned } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KpiCard } from "@/components/KpiCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Table } from "@/components/Table";
import { deoQueue, districtRiskTiles } from "@/lib/fixahead-data";

const filterPills = ["Ahmedabad District", "All Categories", "Risk: High to Critical"];

export default function DashboardPage() {
  const rows = deoQueue.map((item) => [
    <div key={`${item.school}-school`}>
      <p className="font-semibold text-text">{item.school}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-soft">
        {item.district}
      </p>
    </div>,
    <div key={`${item.school}-issue`} className="space-y-2">
      <Badge label={item.issue} tone={item.risk} />
      <p className="text-xs uppercase tracking-[0.16em] text-text-soft">{item.category}</p>
    </div>,
    <div key={`${item.school}-risk`} className="min-w-[130px] space-y-2">
      <p className="font-semibold text-text">{item.riskScore}</p>
      <ProgressBar
        value={item.riskScore}
        tone={item.risk === "critical" ? "danger" : item.risk === "high" ? "warning" : "primary"}
      />
    </div>,
    <span key={`${item.school}-impact`} className="font-medium text-text">
      {item.studentImpact}
    </span>,
    <span key={`${item.school}-window`} className="font-medium text-text">
      {item.failureWindow}
    </span>,
    <details key={`${item.school}-reason`} className="max-w-[320px]">
      <summary className="cursor-pointer font-medium text-primary">
        View reason
      </summary>
      <p className="mt-2 text-sm leading-6 text-text-muted">{item.reason}</p>
    </details>,
    <Button key={`${item.school}-action`} size="sm">
      Assign Contractor
    </Button>,
  ]);

  return (
    <AppShell
      activeHref="/dashboard"
      title="District Risk Overview"
      subtitle="Prioritize school infrastructure repairs using predicted failure risk and student impact."
      roleLabel="DEO View"
    >
      <div className="space-y-4">
        <Card className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            {filterPills.map((pill) => (
              <button
                key={pill}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text"
              >
                {pill}
                <ChevronDown className="size-4 text-text-soft" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
            <MapPinned className="size-4" />
            Last 30 days
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="grid gap-4">
            <KpiCard
              label="Schools at risk"
              value="18"
              detail="+5 schools moved into red zone after weekly review"
            />
            <KpiCard
              label="Critical issues"
              value="11"
              detail="Toilet failure, exposed wiring, and structural crack alerts"
            />
            <KpiCard
              label="SLA breaches"
              value="6"
              detail="Repair requests pending contractor action beyond 48 hours"
            />
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">
                  District risk grid
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                  High-risk schools by district cluster
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-text-muted">
                  Ahmedabad and Patan require immediate allocation based on predicted toilet outages and electrical exposure near active classrooms.
                </p>
              </div>
              <Badge label="Updated from weekly field reports" tone="neutral" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {districtRiskTiles.map((tile) => (
                <div
                  key={tile.name}
                  className="rounded-[24px] border border-border bg-surface-muted p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold tracking-tight text-text">{tile.name}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-text-muted">
                      {tile.count} schools
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-text-muted">Current district maintenance pressure</p>
                  <div className="mt-4">
                    <Badge
                      label={tile.risk}
                      tone={
                        tile.risk === "Critical"
                          ? "critical"
                          : tile.risk === "High"
                            ? "high"
                            : tile.risk === "Monitor"
                              ? "medium"
                              : "low"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">
                Priority queue
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text">
                Issues requiring immediate DEO decision
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-text-muted">
              Queue ranking uses predicted failure window, risk score, and affected student count. Schools with safety exposure and high daily usage appear first.
            </p>
          </div>
          <Table
            columns={[
              "School Name",
              "Issue",
              "Risk Score",
              "Student Impact",
              "Failure Window",
              "Reason",
              "Action",
            ]}
            rows={rows}
          />
        </Card>
      </div>
    </AppShell>
  );
}
