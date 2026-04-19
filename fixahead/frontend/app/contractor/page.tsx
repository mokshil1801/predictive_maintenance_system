"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, MapPinned } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import {
  completeWorkOrder,
  fetchContractorTasks,
  startContractorTask,
  type ContractorTask,
} from "@/lib/fixahead-client";

export default function ContractorPage() {
  const [tasks, setTasks] = useState<ContractorTask[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setError("");
      setTasks(await fetchContractorTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load contractor tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
    const timer = window.setInterval(loadTasks, 8000);
    return () => window.clearInterval(timer);
  }, [loadTasks]);

  useRealtimeRefresh(loadTasks);

  const [activeTask, ...otherTasks] = useMemo(
    () => tasks.filter((task) => task.status !== "completed"),
    [tasks],
  );

  async function handleStart(task: ContractorTask) {
    setActionLoading(task.id);
    setMessage("");
    try {
      await startContractorTask(task.id);
      await loadTasks();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start task.");
    } finally {
      setActionLoading("");
    }
  }

  async function handleComplete(task: ContractorTask) {
    if (!photo) {
      setError("Upload completion photo before submitting the repair update.");
      return;
    }

    setActionLoading(task.id);
    setMessage("");
    setError("");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("latitude", String(position.coords.latitude));
      formData.append("longitude", String(position.coords.longitude));
      formData.append("remarks", `${task.issue} completed at ${task.schoolName}`);

      await completeWorkOrder(task.id, formData);
      setPhoto(null);
      setMessage("Completion proof uploaded and task marked completed.");
      await loadTasks();
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : "Unable to complete task. Confirm GPS permission and try again.",
      );
    } finally {
      setActionLoading("");
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
            <p className="text-sm text-text-muted">Gujarat school infrastructure repairs assigned to you.</p>
          </div>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

          {loading ? (
            <Card className="rounded-[34px] p-5 text-center text-sm text-text-muted">Loading contractor tasks...</Card>
          ) : !activeTask ? (
            <Card className="rounded-[34px] p-5 text-center text-sm text-text-muted">No contractor tasks assigned yet</Card>
          ) : (
            <Card className="space-y-5 rounded-[34px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="size-2 rounded-full bg-red-500" />
                    <p className="text-2xl font-semibold tracking-tight text-text">{activeTask.issue}</p>
                  </div>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-text-soft">{activeTask.schoolName}</p>
                </div>
                <Badge label={new Date(activeTask.deadline).toLocaleDateString()} tone="critical" />
              </div>

              <div className="space-y-3 rounded-[28px] bg-surface-muted p-4">
                <label className="block cursor-pointer rounded-[22px] bg-white px-4 py-5 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-strong text-primary">
                    <Camera className="size-5" />
                  </div>
                  <p className="mt-3 text-base font-semibold text-text">{photo ? photo.name : "Upload completion photo"}</p>
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
                </label>

                <div className="rounded-[22px] bg-white px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-surface-strong text-primary">
                        <MapPinned className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-text">GPS confirmation</p>
                        <p className="text-sm text-text-muted">{activeTask.district}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="size-5 text-primary" />
                  </div>
                </div>

                <div className="rounded-[22px] bg-white px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text">Status update</p>
                      <p className="text-sm text-text-muted">{activeTask.status.replaceAll("_", " ")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleStart(activeTask)}
                      disabled={activeTask.status !== "assigned" || actionLoading === activeTask.id}
                      className="flex h-7 w-12 items-center rounded-full bg-primary p-1 disabled:opacity-50"
                    >
                      <span className="ml-auto size-5 rounded-full bg-white" />
                    </button>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={() => void handleComplete(activeTask)} disabled={actionLoading === activeTask.id}>
                  {actionLoading === activeTask.id ? "Submitting..." : "Submit Update"}
                </Button>
              </div>
            </Card>
          )}

          {otherTasks.map((task) => (
            <Card key={task.id} className="rounded-[30px] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`size-2 rounded-full ${task.status === "assigned" ? "bg-amber-600" : task.status === "in_progress" ? "bg-emerald-500" : "bg-primary"}`} />
                    <p className="text-xl font-semibold tracking-tight text-text">{task.issue}</p>
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-soft">{task.schoolName}</p>
                </div>
                <p className="text-sm font-medium text-text-muted">{new Date(task.deadline).toLocaleDateString()}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
