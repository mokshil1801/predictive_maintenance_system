"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, CheckCircle2, MapPinned } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KpiCard } from "@/components/KpiCard";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import {
  completeWorkOrder,
  fetchContractorAnalytics,
  fetchContractorTasks,
  startContractorTask,
  type ContractorAnalytics,
  type ContractorTask,
} from "@/lib/fixahead-client";

type GpsState = {
  latitude: number;
  longitude: number;
};

export default function ContractorPage() {
  const [tasks, setTasks] = useState<ContractorTask[]>([]);
  const [analytics, setAnalytics] = useState<ContractorAnalytics | null>(null);
  const [activeTaskId, setActiveTaskId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const [gps, setGps] = useState<GpsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const [response, analyticsResponse] = await Promise.all([
        fetchContractorTasks(),
        fetchContractorAnalytics(),
      ]);
      setTasks(response.tasks);
      setAnalytics(analyticsResponse);
      setActiveTaskId((current) => current || response.tasks[0]?.workOrderId || "");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load contractor tasks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useRealtimeRefresh(
    [
      "contractorTask:assigned",
      "contractorTask:started",
      "contractorTask:completed",
      "analytics:updated",
    ],
    loadTasks,
  );

  const activeTask = tasks.find((task) => task.workOrderId === activeTaskId) || tasks[0];
  const otherTasks = tasks.filter((task) => task.workOrderId !== activeTask?.workOrderId);

  function captureGps() {
    setError("");

    if (!navigator.geolocation) {
      setError("GPS is not available in this browser. Use a device with location access.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setMessage("GPS confirmation captured.");
      },
      () => {
        setError("GPS permission was unavailable. Please allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 7000 },
    );
  }

  async function handleComplete() {
    if (!activeTask) {
      return;
    }

    setError("");
    setMessage("");

    if (!photo) {
      setError("Upload a completion photo before submitting the update.");
      return;
    }

    if (!gps) {
      setError("Capture GPS confirmation before marking the task complete.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("workOrderId", activeTask.workOrderId);
      formData.append("photo", photo);
      formData.append("remarks", remarks);
      formData.append("latitude", String(gps.latitude));
      formData.append("longitude", String(gps.longitude));

      const response = await completeWorkOrder(formData);
      setMessage(response.message);
      setPhoto(null);
      setRemarks("");
      setGps(null);
      await loadTasks();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit completion update.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStart() {
    if (!activeTask) return;

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await startContractorTask(activeTask.workOrderId);
      setMessage(response.message);
      await loadTasks();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      activeHref="/contractor"
      title="Assigned Maintenance Tasks"
      subtitle="Track on-site repair work, upload completion proof, and confirm presence at the school."
      roleLabel="Contractor View"
    >
      <div className="grid place-items-start xl:place-items-center">
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-2 px-2">
            <p className="text-4xl font-semibold tracking-tight text-text">Active Tasks</p>
            <p className="text-sm text-text-muted">
              Assigned Gujarat school infrastructure repairs from MongoDB.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={loadTasks} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Tasks"}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <KpiCard
              label="Assigned"
              value={loading ? "..." : String(analytics?.assignedTasks || 0)}
              detail="Tasks waiting to start"
            />
            <KpiCard
              label="In progress"
              value={loading ? "..." : String(analytics?.inProgressTasks || 0)}
              detail="Active repair tasks"
            />
            <KpiCard
              label="Completed"
              value={loading ? "..." : String(analytics?.completedTasks || 0)}
              detail="Finished proof uploads"
            />
            <KpiCard
              label="Overdue"
              value={loading ? "..." : String(analytics?.overdueTasks || 0)}
              detail="Past deadline"
            />
          </div>

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

          {loading ? (
            <Card className="rounded-[34px] p-8 text-center text-sm text-text-muted">
              Loading assigned work orders...
            </Card>
          ) : activeTask ? (
            <Card className="space-y-5 rounded-[34px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="size-2 rounded-full bg-red-500" />
                    <p className="text-2xl font-semibold tracking-tight text-text">
                      {activeTask.title}
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-text-soft">
                    {activeTask.site}
                  </p>
                </div>
                <Badge label={activeTask.deadline} tone="critical" />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3 text-sm">
                <span className="font-medium capitalize text-text">
                  Status: {activeTask.status.replace("_", " ")}
                </span>
                <span className="font-semibold text-primary">
                  Priority {activeTask.priorityScore}
                </span>
              </div>

              <p className="rounded-2xl bg-surface-muted px-4 py-3 text-sm leading-6 text-text-muted">
                {activeTask.reason}
              </p>

              <div className="space-y-3 rounded-[28px] bg-surface-muted p-4">
                <label className="block cursor-pointer rounded-[22px] bg-white px-4 py-5 text-center transition hover:bg-surface-strong">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setPhoto(event.target.files?.[0] || null)}
                  />
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-strong text-primary">
                    <Camera className="size-5" />
                  </div>
                  <p className="mt-3 text-base font-semibold text-text">
                    {photo ? photo.name : "Upload completion photo"}
                  </p>
                </label>

                <button
                  type="button"
                  onClick={captureGps}
                  className="w-full rounded-[22px] bg-white px-4 py-4 text-left transition hover:bg-surface-strong"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-surface-strong text-primary">
                        <MapPinned className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-text">GPS confirmation</p>
                        <p className="text-sm text-text-muted">
                          {gps
                            ? `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`
                            : activeTask.location}
                        </p>
                      </div>
                    </div>
                    {gps ? (
                      <CheckCircle2 className="size-5 text-primary" />
                    ) : (
                      <span className="text-xs font-semibold text-primary">Capture</span>
                    )}
                  </div>
                </button>

                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Add repair notes, material used, or follow-up needed"
                  className="min-h-24 w-full resize-none rounded-[22px] border border-border bg-white px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
                />

                <Button
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  onClick={handleStart}
                  disabled={submitting || activeTask.status !== "assigned"}
                >
                  {submitting ? "Updating..." : "Mark In Progress"}
                </Button>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleComplete}
                  disabled={submitting || activeTask.status === "completed"}
                >
                  {submitting ? "Submitting..." : "Submit Update"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="rounded-[34px] p-8 text-center text-sm text-text-muted">
              No assigned tasks yet. DEO assignments will appear here.
            </Card>
          )}

          {otherTasks.map((task) => (
            <button
              key={task.workOrderId}
              type="button"
              onClick={() => setActiveTaskId(task.workOrderId)}
              className="block w-full text-left"
            >
              <Card className="rounded-[30px] px-5 py-4 transition hover:border-primary">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-2 rounded-full ${
                          task.status === "assigned"
                            ? "bg-amber-600"
                            : task.status === "completed"
                              ? "bg-emerald-500"
                              : "bg-primary"
                        }`}
                      />
                      <p className="text-xl font-semibold tracking-tight text-text">
                        {task.title}
                      </p>
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-soft">
                      {task.location}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-text-muted">{task.deadline}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
