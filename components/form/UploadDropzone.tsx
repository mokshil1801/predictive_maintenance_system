import { Camera } from "lucide-react";

export function UploadDropzone({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-border bg-surface-muted px-6 py-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
        <Camera className="size-6" />
      </div>
      <p className="mt-4 text-lg font-semibold tracking-tight text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
    </div>
  );
}
