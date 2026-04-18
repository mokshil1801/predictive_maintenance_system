"use client";

import { useState } from "react";
import { Droplets, PlugZap, Scale, School } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FieldShell } from "@/components/form/FieldShell";
import { SelectField } from "@/components/form/SelectField";
import { SliderField } from "@/components/form/SliderField";
import { ToggleField } from "@/components/form/ToggleField";
import { UploadDropzone } from "@/components/form/UploadDropzone";
import { cn } from "@/lib/utils";

const categoryCards = [
  { label: "Plumbing", icon: Droplets },
  { label: "Electrical", icon: PlugZap },
  { label: "Structural", icon: School },
  { label: "Roofing", icon: Scale },
];

const crackOptions = [
  "No visible crack",
  "Hairline crack",
  "2-4 mm visible crack",
  "More than 4 mm crack",
];

export function PeonReportForm() {
  const [category, setCategory] = useState("Electrical");
  const [conditionScore, setConditionScore] = useState(78);
  const [waterLeak, setWaterLeak] = useState(false);
  const [wiringExposed, setWiringExposed] = useState(true);
  const [visibleCrack, setVisibleCrack] = useState(false);
  const [toiletFunctionality, setToiletFunctionality] = useState(40);
  const [crackWidth, setCrackWidth] = useState("2-4 mm visible crack");

  return (
    <Card className="mx-auto max-w-md space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-3xl font-semibold tracking-tight text-text">Rapid Report</p>
        <p className="text-sm leading-6 text-text-muted">
          Submit weekly condition inputs in under 2 minutes for DEO review.
        </p>
      </div>

      <FieldShell label="Incident category">
        <div className="grid grid-cols-2 gap-3">
          {categoryCards.map((item) => {
            const Icon = item.icon;
            const active = category === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setCategory(item.label)}
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
        <SelectField options={crackOptions} value={crackWidth} onChange={setCrackWidth} />
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
        />
      </FieldShell>

      <Button className="w-full" size="lg">
        Send Weekly Report
      </Button>
    </Card>
  );
}
