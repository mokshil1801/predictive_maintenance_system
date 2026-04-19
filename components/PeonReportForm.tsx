"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets, PlugZap, School } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FieldShell } from "@/components/form/FieldShell";
import { SelectField } from "@/components/form/SelectField";
import { SliderField } from "@/components/form/SliderField";
import { ToggleField } from "@/components/form/ToggleField";
import { UploadDropzone } from "@/components/form/UploadDropzone";
import { fetchSchools, submitReport, type SchoolOption } from "@/lib/fixahead-client";
import { cn } from "@/lib/utils";

const categoryCards = [
  { value: "plumbing", label: "Plumbing", icon: Droplets },
  { value: "electrical", label: "Electrical", icon: PlugZap },
  { value: "structural", label: "Structural", icon: School },
];

export function PeonReportForm() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [category, setCategory] = useState("electrical");
  const [conditionScore, setConditionScore] = useState(78);
  const [waterLeak, setWaterLeak] = useState(false);
  const [wiringExposed, setWiringExposed] = useState(false);
  const [crackWidth, setCrackWidth] = useState(0);
  const [toiletFunctionality, setToiletFunctionality] = useState(80);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSchools()
      .then((items) => {
        setSchools(items);
        setSchoolId(items[0]?.id || "");
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setBootLoading(false));
  }, []);

  const schoolOptions = useMemo(
    () => schools.map((school) => `${school.id}|${school.name}, ${school.district}`),
    [schools],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!schoolId) {
      setError("Select the school before sending the weekly report.");
      return;
    }

    const formData = new FormData();
    formData.append("schoolId", schoolId);
    formData.append("category", category);
    formData.append("conditionScore", String(conditionScore));
    formData.append("waterLeak", String(waterLeak));
    formData.append("wiringExposed", String(wiringExposed));
    formData.append("crackWidth", String(crackWidth));
    formData.append("toiletFunctionality", String(toiletFunctionality));
    formData.append("weekStartDate", new Date().toISOString());
    if (photo) {
      formData.append("photo", photo);
    }

    setLoading(true);
    try {
      const result = await submitReport(formData);
      setMessage(
        result.mlError
          ? "Report saved. ML service is unavailable, so prediction will need retry."
          : "Weekly report saved and DEO priority queue updated.",
      );
      setPhoto(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Report submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-3xl font-semibold tracking-tight text-text">Rapid Report</p>
        <p className="text-sm leading-6 text-text-muted">
          Submit weekly condition inputs for your school infrastructure review.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldShell label="School">
          <SelectField
            options={schoolOptions}
            value={schoolId}
            onChange={setSchoolId}
          />
          {bootLoading ? (
            <p className="mt-2 text-sm text-text-muted">Loading schools from database...</p>
          ) : null}
        </FieldShell>

        <FieldShell label="Incident category">
          <div className="grid grid-cols-3 gap-3">
            {categoryCards.map((item) => {
              const Icon = item.icon;
              const active = category === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={cn(
                    "rounded-[22px] border px-4 py-5 text-left transition",
                    active
                      ? "border-primary bg-surface-strong text-primary shadow-[0_12px_28px_rgba(11,110,79,0.12)]"
                      : "border-border bg-surface hover:bg-surface-muted",
                  )}
                >
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                    <Icon className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-text">{item.label}</p>
                </button>
              );
            })}
          </div>
        </FieldShell>

        <FieldShell label="Condition score" hint={`${conditionScore}/100`}>
          <SliderField value={conditionScore} min={0} max={100} onChange={setConditionScore} />
        </FieldShell>

        <FieldShell label="Quick observations">
          <div className="space-y-3">
            <ToggleField label="Water leakage detected?" checked={waterLeak} onChange={setWaterLeak} />
            <ToggleField
              label="Electrical wiring exposed?"
              checked={wiringExposed}
              onChange={setWiringExposed}
            />
          </div>
        </FieldShell>

        <FieldShell label="Crack width" hint={`${crackWidth} mm`}>
          <SliderField value={crackWidth} min={0} max={20} onChange={setCrackWidth} />
        </FieldShell>

        <FieldShell label="Toilet functionality" hint={`${toiletFunctionality}% usable today`}>
          <SliderField
            value={toiletFunctionality}
            min={0}
            max={100}
            onChange={setToiletFunctionality}
          />
        </FieldShell>

        <FieldShell label="Evidence">
          <UploadDropzone
            title="Upload inspection photo"
            description="Capture leakage, exposed wiring, cracks, or blocked toilets."
            file={photo}
            onChange={setPhoto}
          />
        </FieldShell>

        <Button className="w-full" size="lg" type="submit" disabled={loading}>
          {loading ? "Sending report..." : "Send Weekly Report"}
        </Button>
      </form>
    </Card>
  );
}
