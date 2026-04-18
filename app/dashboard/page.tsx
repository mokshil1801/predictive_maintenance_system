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
  type PriorityQueueResponse,
  type QueueItem,
} from "@/lib/fixahead-client";

const allValue = "all";

export default function DashboardPage() {
  const [data, setData] = useState<PriorityQueueResponse | null>(null);
  const [analytics, setAnalytics] = useState<DeoAnalytics | null>(null);
  const [district, setDistrict] = useState(allValue);
  const [category, setCategory] = useState(allValue);
  const [risk, setRisk] = useState(allValue);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const [queueResponse, analyticsResponse] = await Promise.all([
        fetchPriorityQueue(),
        fetchDeoAnalytics(),
      ]);
      setData(queueResponse);
      setAnalytics(analyticsResponse);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load priority queue.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useRealtimeRefresh(
    [
      "report:created",
      "prediction:created",
      "priorityQueue:updated",
      "contractorTask:assigned",
      "contractorTask:started",
      "contractorTask:completed",
      "analytics:updated",
    ],
    loadQueue,
  );

  const districtOptions = useMemo(
    () => Array.from(new Set(data?.queue.map((item) => item.district) || [])),
    [data],
  );

  const filteredQueue = useMemo(() => {
    const queue = data?.queue || [];

    return queue.filter((item) => {
      const districtMatches = district === allValue || item.district === district;
      const categoryMatches = category === allValue || item.categoryKey === category;
      const riskMatches = risk === allValue || item.risk === risk;
      return districtMatches && categoryMatches && riskMatches;
    });
  }, [category, data, district, risk]);

  async function handleAssign(item: QueueItem) {
    setMessage("");
    setError("");
    setAssigningId(item.predictionId);

    try {
      const response = await assignContractor(item.predictionId);
      setMessage(response.message);
      await loadQueue();
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : "Unable to assign contractor.",
      );
    } finally {
      setAssigningId("");
    }
  }

  const rows = filteredQueue.map((item) => [
    <div key={`${item.id}-school`}>
      <p className="font-semibold text-text">{item.school}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-soft">
        {item.district}
      </p>
    </div>,
    <div key={`${item.id}-issue`} className="space-y-2">
      <Badge label={item.issue} tone={item.risk} />
      <p className="text-xs uppercase tracking-[0.16em] text-text-soft">{item.category}</p>
    </div>,
    <div key={`${item.id}-risk`} className="min-w-[130px] space-y-2">
      <p className="font-semibold text-text">
        Risk {item.riskScore} / Priority {item.priorityScore}
      </p>
      <ProgressBar
        value={item.riskScore}
        tone={
          item.risk === "critical"
            ? "danger"
            : item.risk === "high"
              ? "warning"
              : "primary"
        }
      />
    </div>,
    <span key={`${item.id}-impact`} className="font-medium text-text">
      {item.studentImpact}
    </span>,
    <span key={`${item.id}-window`} className="font-medium text-text">
      {item.failureWindow}
    </span>,
    <details key={`${item.id}-reason`} className="max-w-[320px]">
      <summary className="cursor-pointer font-medium text-primary">
        View reason
      </summary>
      <p className="mt-2 text-sm leading-6 text-text-muted">{item.reason}</p>
    </details>,
    <Button
      key={`${item.id}-action`}
      size="sm"
      disabled={assigningId === item.predictionId || item.status !== "awaiting_deo"}
      onClick={() => handleAssign(item)}
    >
      {item.status === "awaiting_deo"
        ? assigningId === item.predictionId
          ? "Assigning..."
          : "Assign Contractor"
        : item.status === "assigned"
          ? "Assigned"
          : "Completed"}
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
            <FilterSelect
              label="District"
              value={district}
              onChange={setDistrict}
              options={[
                { label: "All districts", value: allValue },
                ...districtOptions.map((option) => ({ label: option, value: option })),
              ]}
            />
            <FilterSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { label: "All categories", value: allValue },
                { label: "Plumbing", value: "plumbing" },
                { label: "Electrical", value: "electrical" },
                { label: "Structural", value: "structural" },
              ]}
            />
            <FilterSelect
              label="Risk"
              value={risk}
              onChange={setRisk}
              options={[
                { label: "All risk levels", value: allValue },
                { label: "Critical", value: "critical" },
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
            <MapPinned className="size-4" />
            Live MongoDB queue
          </div>
        </Card>

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="grid gap-4">
            <KpiCard
              label="Total reports"
              value={loading ? "..." : String(analytics?.totalReports || 0)}
              detail="Reports saved in MongoDB"
            />
            <KpiCard
              label="Critical issues"
              value={loading ? "..." : String(analytics?.highRiskCount || 0)}
              detail="Predictions with risk score 72 or above"
            />
            <KpiCard
              label="SLA breaches"
              value={loading ? "..." : String(analytics?.slaBreaches || 0)}
              detail="Assigned or in-progress work orders past deadline"
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
                  Aggregations below come from MongoDB analytics endpoints.
                </p>
              </div>
              <Badge label="Updated from weekly field reports" tone="neutral" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <LiveBarChart
                title="Issues by status"
                data={analytics?.charts.predictionsByStatus || []}
              />
              <LiveBarChart
                title="District issue distribution"
                data={analytics?.charts.districtDistribution || []}
              />
              <LiveBarChart
                title="Weekly reports"
                data={analytics?.charts.weeklyReports || []}
              />
              <LiveBarChart
                title="Priority distribution"
                data={analytics?.charts.priorityDistribution || []}
              />
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
            <Button variant="secondary" onClick={loadQueue} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Queue"}
            </Button>
          </div>
          {loading ? (
            <div className="rounded-[24px] border border-border bg-surface-muted p-8 text-center text-sm text-text-muted">
              Loading live priority queue...
            </div>
          ) : rows.length ? (
            <Table
              columns={[
                "School Name",
                "Issue",
              "Risk / Priority",
                "Student Impact",
                "Failure Window",
                "Reason",
                "Action",
              ]}
              rows={rows}
            />
          ) : (
            <div className="rounded-[24px] border border-border bg-surface-muted p-8 text-center text-sm text-text-muted">
              No issues match the selected filters.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text">
      <span className="text-text-soft">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none bg-transparent pr-6 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-text-soft" />
    </label>
  );
}

function LiveBarChart({
  title,
  data,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <div className="rounded-[24px] border border-border bg-surface-muted p-5">
      <p className="font-semibold text-text">{title}</p>
      <div className="mt-4 space-y-3">
        {data.length ? (
          data.map((item) => (
            <div key={`${title}-${item.label}`} className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-text-muted">
                <span className="capitalize">{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${maxValue ? (item.value / maxValue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted">No live data available yet.</p>
        )}
      </div>
    </div>
  );
}
