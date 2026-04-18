import { Camera, CheckCircle2, MapPinned } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { contractorTasks } from "@/lib/fixahead-data";

export default function ContractorPage() {
  const [activeTask, ...otherTasks] = contractorTasks;

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
              Gujarat school infrastructure repairs scheduled for today.
            </p>
          </div>

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

            <div className="space-y-3 rounded-[28px] bg-surface-muted p-4">
              <div className="rounded-[22px] bg-white px-4 py-5 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-strong text-primary">
                  <Camera className="size-5" />
                </div>
                <p className="mt-3 text-base font-semibold text-text">Upload completion photo</p>
              </div>

              <div className="rounded-[22px] bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-surface-strong text-primary">
                      <MapPinned className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-text">GPS confirmation</p>
                      <p className="text-sm text-text-muted">{activeTask.location}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
              </div>

              <div className="rounded-[22px] bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text">Status update</p>
                    <p className="text-sm text-text-muted">{activeTask.status}</p>
                  </div>
                  <div className="flex h-7 w-12 items-center rounded-full bg-primary p-1">
                    <span className="ml-auto size-5 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Submit Update
              </Button>
            </div>
          </Card>

          {otherTasks.map((task) => (
            <Card key={task.title} className="rounded-[30px] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`size-2 rounded-full ${
                        task.status === "Assigned"
                          ? "bg-amber-600"
                          : task.status === "Scheduled"
                            ? "bg-emerald-500"
                            : "bg-primary"
                      }`}
                    />
                    <p className="text-xl font-semibold tracking-tight text-text">{task.title}</p>
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-soft">
                    {task.location}
                  </p>
                </div>
                <p className="text-sm font-medium text-text-muted">{task.deadline}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
