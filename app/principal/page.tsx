"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KpiCard } from "@/components/KpiCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Table } from "@/components/Table";
import { TrendChart } from "@/components/TrendChart";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import {
  fetchPrincipalAnalytics,
  fetchPrincipalStatus,
  type ChartDatum,
  type PrincipalAnalytics,
  type PrincipalStatus,
} from "@/lib/fixahead-client";

export default function PrincipalPage() {
  const [status, setStatus] = useState<PrincipalStatus | null>(null);
  const [analytics, setAnalytics] = useState<PrincipalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const [statusResponse, analyticsResponse] = await Promise.all([
        fetchPrincipalStatus(),
        fetchPrincipalAnalytics(),
      ]);
      setStatus(statusResponse);
      setAnalytics(analyticsResponse);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load school overview.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useRealtimeRefresh(
    [
      "report:created",
      "prediction:created",
      "principalStatus:updated",
      "contractorTask:assigned",
      "contractorTask:started",
      "contractorTask:completed",
      "analytics:updated",
    ],
    loadOverview,
  );

  function exportReport() {
    if (!status || !analytics) return;

    const blob = new Blob([JSON.stringify({ status, analytics }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fixahead-${status.school?.name || "school"}-report.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const rows = (status?.issues || []).map((issue) => [
    <span key={`${issue.id}-id`} className="font-medium text-text">
      FX-{issue.id.slice(-6).toUpperCase()}
    </span>,
    <span key={`${issue.id}-issue`} className="font-medium text-text">
      {issue.issue}
    </span>,
    <span key={`${issue.id}-risk`} className="text-text">
      {issue.riskScore} risk / {issue.priorityScore} priority
    </span>,
    <span key={`${issue.id}-status`} className="capitalize text-text">
      {issue.status.replace("_", " ")}
    </span>,
    <span key={`${issue.id}-contractor`} className="text-text-muted">
      {issue.contractor?.name || "Not assigned"}
    </span>,
    <span key={`${issue.id}-note`} className="max-w-[260px] text-text-muted">
      {issue.reason}
    </span>,
  ]);

  const trendPoints =
    analytics?.charts.weeklyReportsTrend.map((item) => item.value) || [];

  return (
    <AppShell
      activeHref="/principal"
      title="School Condition Overview"
      subtitle="Monitor active issues, category health, and recent deterioration trends for your campus."
      roleLabel="Principal View"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">
            {status?.school
              ? `${status.school.name}, ${status.school.district}`
              : "No principal school assigned"}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={loadOverview} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="secondary" onClick={exportReport} disabled={!status}>
              <Download className="size-4" />
              Export school report
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-3">
          <KpiCard
            label="School issue count"
            value={loading ? "..." : String(analytics?.schoolIssueCount || 0)}
            detail="Predictions and repair records for this school"
          />
          <KpiCard
            label="Active repairs"
            value={loading ? "..." : String(analytics?.activeRepairs || 0)}
            detail="Awaiting DEO, assigned, in-progress, or delayed"
          />
          <KpiCard
            label="Resolved repairs"
            value={loading ? "..." : String(analytics?.resolvedRepairs || 0)}
            detail="Completed or verified maintenance work"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">
                  Risk overview
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                  Current category risk
                </h2>
              </div>
              <Badge label="Live MongoDB data" tone="neutral" />
            </div>

            <div className="space-y-5">
              {(analytics?.currentRiskOverview || []).length ? (
                analytics?.currentRiskOverview.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-text">{item.label}</p>
                      <p className="font-semibold text-text">{item.value}</p>
                    </div>
                    <ProgressBar
                      value={item.value}
                      tone={item.value >= 72 ? "danger" : item.value >= 50 ? "warning" : "primary"}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted">No reports submitted yet.</p>
              )}
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">
                  Live charts
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                  School monitoring analytics
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-strong px-4 py-2 text-sm font-medium text-primary">
                <TrendingUp className="size-4" />
                Real aggregation data
              </div>
            </div>
            {trendPoints.length ? (
              <TrendChart
                points={trendPoints}
                scoreLabel={`${analytics?.schoolIssueCount || 0} reports`}
              />
            ) : (
              <div className="rounded-[24px] border border-border bg-surface-muted p-8 text-center text-sm text-text-muted">
                No reports submitted yet.
              </div>
            )}
            <LiveBarChart
              title="Issue status distribution"
              data={analytics?.charts.issueStatusDistribution || []}
            />
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
              This section updates through Socket.IO when reports, assignments, starts, and completions are saved.
            </p>
          </div>
          {loading ? (
            <div className="rounded-[24px] border border-border bg-surface-muted p-8 text-center text-sm text-text-muted">
              Loading school condition data...
            </div>
          ) : rows.length ? (
            <Table
              columns={["Issue ID", "Issue", "Risk", "Status", "Contractor", "Latest note"]}
              rows={rows}
            />
          ) : (
            <div className="rounded-[24px] border border-border bg-surface-muted p-8 text-center text-sm text-text-muted">
              No reports submitted yet.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function LiveBarChart({ title, data }: { title: string; data: ChartDatum[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <div className="space-y-3">
      <p className="font-semibold text-text">{title}</p>
      {data.length ? (
        data.map((item) => (
          <div key={`${title}-${item.label}`} className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-text-muted">
              <span className="capitalize">{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${maxValue ? (item.value / maxValue) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-text-muted">No live chart data available.</p>
      )}
    </div>
  );
}
