"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPinned } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KpiCard } from "@/components/KpiCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Table } from "@/components/Table";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import {
  assignContractor,
  fetchDeoAnalytics,
  fetchPriorityQueue,
  type DeoAnalytics,
  type QueueItem,
  type RiskLevel,
} from "@/lib/fixahead-client";

const districtTone = (score: number): RiskLevel => {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
};

export default function DashboardPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [analytics, setAnalytics] = useState<DeoAnalytics | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [queueData, analyticsData] = await Promise.all([
        fetchPriorityQueue(),
        fetchDeoAnalytics(),
      ]);
      setQueue(queueData);
      setAnalytics(analyticsData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load DEO dashboard.");
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

  const filteredQueue = useMemo(
    () =>
      queue.filter((item) => {
        const categoryMatches = categoryFilter === "all" || item.category === categoryFilter;
        const riskMatches = riskFilter === "all" || item.risk === riskFilter;
        return categoryMatches && riskMatches;
      }),
    [categoryFilter, queue, riskFilter],
  );

  const districtTiles = useMemo(() => {
    const grouped = new Map<string, { count: number; maxRisk: number }>();
    queue.forEach((item) => {
      const current = grouped.get(item.district) || { count: 0, maxRisk: 0 };
      grouped.set(item.district, {
        count: current.count + 1,
        maxRisk: Math.max(current.maxRisk, item.riskScore),
      });
    });
    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      count: value.count,
      risk: value.maxRisk >= 85 ? "Critical" : value.maxRisk >= 70 ? "High" : value.maxRisk >= 45 ? "Monitor" : "Stable",
      tone: districtTone(value.maxRisk),
    }));
  }, [queue]);

  async function handleAssign(predictionId: string) {
    try {
      setAssigningId(predictionId);
      setError("");
      await assignContractor(predictionId);
      await loadData();
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Contractor assignment failed.");
    } finally {
      setAssigningId("");
    }
  }

  const rows = filteredQueue.map((item) => [
    <div key={`${item.id}-school`}>
      <p className="font-semibold text-text">{item.schoolName}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-soft">{item.district}</p>
    </div>,
    <div key={`${item.id}-issue`} className="space-y-2">
      <Badge label={item.issue} tone={item.risk} />
      <p className="text-xs uppercase tracking-[0.16em] text-text-soft">{item.category}</p>
    </div>,
    <div key={`${item.id}-risk`} className="min-w-[130px] space-y-2">
      <p className="font-semibold text-text">{item.riskScore}</p>
      <ProgressBar value={item.riskScore} tone={item.risk === "critical" ? "danger" : item.risk === "high" ? "warning" : "primary"} />
    </div>,
    <span key={`${item.id}-impact`} className="font-medium text-text">{item.studentImpact}</span>,
    <span key={`${item.id}-window`} className="font-medium text-text">{item.failureWindow}</span>,
    <details key={`${item.id}-reason`} className="max-w-[320px]">
      <summary className="cursor-pointer font-medium text-primary">View reason</summary>
      <p className="mt-2 text-sm leading-6 text-text-muted">{item.reason.join(", ")}</p>
    </details>,
    <Button key={`${item.id}-action`} size="sm" onClick={() => void handleAssign(item.predictionId)} disabled={assigningId === item.predictionId}>
      {assigningId === item.predictionId ? "Assigning..." : "Assign Contractor"}
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
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <Card className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            <label className="relative">
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="appearance-none rounded-2xl border border-border bg-surface px-4 py-3 pr-10 text-sm font-medium text-text">
                <option value="all">All Categories</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="structural">Structural</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-soft" />
            </label>
            <label className="relative">
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="appearance-none rounded-2xl border border-border bg-surface px-4 py-3 pr-10 text-sm font-medium text-text">
                <option value="all">Risk: All</option>
                <option value="critical">Risk: Critical</option>
                <option value="high">Risk: High</option>
                <option value="medium">Risk: Medium</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-soft" />
            </label>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
            <MapPinned className="size-4" />
            Live updates enabled
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="grid gap-4">
            <KpiCard label="Schools at risk" value={String(new Set(queue.map((item) => item.schoolId)).size)} detail="Schools with live pending prediction records" />
            <KpiCard label="Critical issues" value={String(analytics?.highRiskCount ?? 0)} detail="Predictions at high or critical risk level" />
            <KpiCard label="SLA breaches" value={String(analytics?.slaBreaches ?? 0)} detail="Open work orders pending beyond deadline" />
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">District risk grid</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">High-risk schools by district cluster</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-text-muted">
                  District pressure is calculated from live predictions currently awaiting DEO action.
                </p>
              </div>
              <Badge label="Updated from weekly field reports" tone="neutral" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {districtTiles.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-text-muted">No urgent DEO decisions right now</p>
              ) : (
                districtTiles.map((tile) => (
                  <div key={tile.name} className="rounded-[24px] border border-border bg-surface-muted p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold tracking-tight text-text">{tile.name}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-text-muted">{tile.count} schools</span>
                    </div>
                    <p className="mt-3 text-sm text-text-muted">Current district maintenance pressure</p>
                    <div className="mt-4">
                      <Badge label={tile.risk} tone={tile.tone} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">Priority queue</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text">Issues requiring immediate DEO decision</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-text-muted">
              Queue ranking uses predicted failure window, risk score, and affected student count.
            </p>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">Loading live priority queue...</p>
          ) : (
            <Table columns={["School Name", "Issue", "Risk Score", "Student Impact", "Failure Window", "Reason", "Action"]} rows={rows} emptyMessage="No urgent DEO decisions right now" />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
