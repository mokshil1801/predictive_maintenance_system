"use client";

import { ChevronDown } from "lucide-react";

export function SelectField({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  function splitOption(option: string) {
    const separatorIndex = option.indexOf("|");

    if (separatorIndex === -1) {
      return { value: option, label: option };
    }

    return {
      value: option.slice(0, separatorIndex),
      label: option.slice(separatorIndex + 1),
    };
  }

  return (
    <div className="relative">
      <select
        value={splitOption(value).value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border border-border bg-surface px-4 py-4 pr-10 text-sm text-text outline-none transition focus:border-primary"
      >
        {options.map((option) => {
          const parsed = splitOption(option);

          return (
            <option key={parsed.value} value={parsed.value}>
              {parsed.label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-soft" />
    </div>
  );
}
