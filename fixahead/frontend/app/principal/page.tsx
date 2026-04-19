"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  type PrincipalAnalytics,
  type PrincipalStatus,
} from "@/lib/fixahead-client";

export default function PrincipalPage() {
  const [status, setStatus] = useState<PrincipalStatus | null>(null);
  const [analytics, setAnalytics] = useState<PrincipalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [statusData, analyticsData] = await Promise.all([
        fetchPrincipalStatus(),
        fetchPrincipalAnalytics(),
      ]);
      setStatus(statusData);
      setAnalytics(analyticsData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load principal dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const timer = window.setInterval(loadData, 8000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  useRealtimeRefresh(loadData);

  const categoryBreakdown = analytics?.charts.categoryRisk ?? [];
  const trendPoints = analytics?.charts.conditionTrend.map((point) => point.value) ?? [];
  const latestScore = status?.latestReport?.conditionScore ?? null;
  const rows = (status?.issues ?? []).map((issue) => [
    <span key={`${issue.id}-id`} className="font-medium text-text">{issue.id.slice(-8).toUpperCase()}</span>,
    <span key={`${issue.id}-location`} className="font-medium text-text">{status?.school.name}</span>,
    <span key={`${issue.id}-category`} className="text-text">{issue.category}</span>,
    <span key={`${issue.id}-status`} className="text-text">{issue.status.replaceAll("_", " ")}</span>,
    <span key={`${issue.id}-note`} className="max-w-[260px] text-text-muted">
      {issue.contractorName ? `${issue.issue} assigned to ${issue.contractorName}` : issue.reason.join(", ")}
    </span>,
  ]);

  function exportReport() {
    const blob = new Blob([JSON.stringify({ status, analytics }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fixahead-school-report.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      activeHref="/principal"
      title="School Condition Overview"
      subtitle="Monitor active issues, category health, and recent deterioration trends for your campus."
      roleLabel="Principal View"
    >
      <div className="space-y-4">
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={exportReport} disabled={!status}>
            <Download className="size-4" />
            Export school report
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <KpiCard label="Overall condition score" value={latestScore === null ? "0/100" : `${latestScore}/100`} detail="Latest submitted weekly report condition score" />
          <KpiCard label="High-risk alerts" value={String((status?.issues ?? []).filter((issue) => issue.risk === "critical" || issue.risk === "high").length)} detail="Live prediction records for this school" />
          <KpiCard label="Active maintenance" value={String(analytics?.activeRepairs ?? 0)} detail="Assigned, delayed, or in-progress work orders" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">Category breakdown</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">System health</h2>
              </div>
              <Badge label="Updated from weekly form" tone="neutral" />
            </div>

            <div className="space-y-5">
              {categoryBreakdown.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-muted">No reports submitted yet</p>
              ) : (
                categoryBreakdown.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-text">{item.label}</p>
                      <p className="font-semibold text-text">{item.value}%</p>
                    </div>
                    <ProgressBar value={item.value} tone={item.value >= 70 ? "danger" : item.value >= 45 ? "warning" : "primary"} />
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">Trend chart</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">Campus condition trend</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-strong px-4 py-2 text-sm font-medium text-primary">
                <TrendingUp className="size-4" />
                Last 12 weekly reports
              </div>
            </div>
            <TrendChart points={trendPoints} scoreLabel={latestScore === null ? "0/100" : `${latestScore}/100`} />
          </Card>
        </div>

        <Card className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">School issue table</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text">Current repair and monitoring status</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-text-muted">
              Share this view with school management and district officials to explain which issues are waiting for approval, already assigned, or still under watch.
            </p>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">Loading current school status...</p>
          ) : (
            <Table columns={["Issue ID", "Location", "Category", "Status", "Latest note"]} rows={rows} emptyMessage="No reports submitted yet" />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
