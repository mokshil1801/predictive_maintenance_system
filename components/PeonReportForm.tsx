"use client";

import { useEffect, useState } from "react";
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
  { label: "Plumbing", value: "plumbing", icon: Droplets },
  { label: "Electrical", value: "electrical", icon: PlugZap },
  { label: "Structural", value: "structural", icon: School },
];

const crackOptions = [
  "0",
  "1",
  "3",
  "5",
];

const crackLabels: Record<string, string> = {
  "0": "No visible crack",
  "1": "Hairline crack",
  "3": "2-4 mm visible crack",
  "5": "More than 4 mm crack",
};

export function PeonReportForm() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [category, setCategory] = useState("electrical");
  const [conditionScore, setConditionScore] = useState(78);
  const [waterLeak, setWaterLeak] = useState(false);
  const [wiringExposed, setWiringExposed] = useState(true);
  const [visibleCrack, setVisibleCrack] = useState(false);
  const [toiletFunctionality, setToiletFunctionality] = useState(40);
  const [crackWidth, setCrackWidth] = useState("3");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSchools() {
      try {
        const response = await fetchSchools();
        if (!mounted) return;
        setSchools(response.schools);
        setSchoolId(response.schools[0]?.id || response.schools[0]?._id || "");
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load school list.",
        );
      } finally {
        if (mounted) setLoadingSchools(false);
      }
    }

    loadSchools();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!schoolId) {
      setError("Select a school before submitting the weekly report.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("schoolId", schoolId);
      formData.append("category", category);
      formData.append("conditionScore", String(conditionScore));
      formData.append("waterLeak", String(waterLeak));
      formData.append("wiringExposed", String(wiringExposed));
      formData.append("crackWidth", visibleCrack ? crackWidth : "0");
      formData.append("toiletFunctionality", String(toiletFunctionality));
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await submitReport(formData);
      setMessage(response.message);
      setPhoto(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit report.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mx-auto max-w-md space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-3xl font-semibold tracking-tight text-text">Rapid Report</p>
        <p className="text-sm leading-6 text-text-muted">
          Submit weekly condition inputs in under 2 minutes for DEO review.
        </p>
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

      <FieldShell label="School">
        <SelectField
          options={
            loadingSchools
              ? ["Loading schools..."]
              : schools.map((school) => `${school.id}|${school.name}, ${school.district}`)
          }
          value={
            loadingSchools
              ? "Loading schools..."
              : `${schoolId}|${
                  schools.find((school) => school.id === schoolId || school._id === schoolId)
                    ?.name || "Select school"
                }, ${
                  schools.find((school) => school.id === schoolId || school._id === schoolId)
                    ?.district || ""
                }`
          }
          onChange={(value) => setSchoolId(value.split("|")[0])}
        />
      </FieldShell>

      <FieldShell label="Incident category">
        <div className="grid grid-cols-2 gap-3">
          {categoryCards.map((item) => {
            const Icon = item.icon;
            const active = category === item.value;

            return (
              <button
                key={item.label}
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

      <FieldShell
        label="Condition score"
        hint={conditionScore >= 75 ? "Monitor" : "Urgent attention"}
      >
        <SliderField
          value={conditionScore}
          min={0}
          max={100}
          onChange={setConditionScore}
        />
        <div className="flex justify-between text-xs font-medium uppercase tracking-[0.16em] text-text-soft">
          <span>Good</span>
          <span>Monitor</span>
          <span>Critical</span>
        </div>
      </FieldShell>

      <FieldShell label="Quick observations">
        <div className="space-y-3">
          <ToggleField label="Water leakage detected?" checked={waterLeak} onChange={setWaterLeak} />
          <ToggleField
            label="Electrical wiring exposed?"
            checked={wiringExposed}
            onChange={setWiringExposed}
          />
          <ToggleField
            label="Visible cracks on wall or beam?"
            checked={visibleCrack}
            onChange={setVisibleCrack}
          />
        </div>
      </FieldShell>

      <FieldShell label="Crack width">
        <SelectField
          options={crackOptions.map((option) => `${option}|${crackLabels[option]}`)}
          value={`${crackWidth}|${crackLabels[crackWidth]}`}
          onChange={(value) => setCrackWidth(value.split("|")[0])}
        />
      </FieldShell>

      <FieldShell
        label="Toilet functionality"
        hint={`${toiletFunctionality}% usable today`}
      >
        <SliderField
          value={toiletFunctionality}
          min={0}
          max={100}
          onChange={setToiletFunctionality}
        />
        <div className="flex justify-between text-xs font-medium uppercase tracking-[0.16em] text-text-soft">
          <span>Non-functional</span>
          <span>Fully functional</span>
        </div>
      </FieldShell>

      <FieldShell label="Evidence">
        <UploadDropzone
          title="Upload inspection photo"
          description="Capture leakage, exposed wiring, cracks, or blocked toilets for faster DEO validation."
          fileName={photo?.name}
          onChange={setPhoto}
        />
      </FieldShell>

      <Button className="w-full" size="lg" disabled={submitting || loadingSchools}>
        {submitting ? "Submitting report..." : "Send Weekly Report"}
      </Button>
      </Card>
    </form>
  );
}
