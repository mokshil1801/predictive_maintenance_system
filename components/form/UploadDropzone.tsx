import { Camera } from "lucide-react";

export function UploadDropzone({
  title,
  description,
  fileName,
  onChange,
}: {
  title: string;
  description: string;
  fileName?: string;
  onChange?: (file: File | null) => void;
}) {
  return (
    <label className="block cursor-pointer rounded-[28px] border border-dashed border-border bg-surface-muted px-6 py-8 text-center transition hover:border-primary hover:bg-surface-strong">
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => onChange?.(event.target.files?.[0] || null)}
      />
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
        <Camera className="size-6" />
      </div>
      <p className="mt-4 text-lg font-semibold tracking-tight text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-text-muted">
        {fileName || description}
      </p>
    </label>
  );
}
