"use client";

import { useEffect, useState } from "react";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/Badge";
import { cn } from "@/lib/utils";

export function Navbar({
  title,
  subtitle,
  roleLabel,
  className,
}: {
  title: string;
  subtitle: string;
  roleLabel: string;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [showNotice, setShowNotice] = useState(false);
  const [userLabel, setUserLabel] = useState("Authenticated user");

  useEffect(() => {
    const storedUser = window.localStorage.getItem("fixahead_auth_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserLabel(`${parsed.name || "FixAhead user"} (${parsed.role || "role"})`);
      } catch (_error) {
        setUserLabel("Authenticated user");
      }
    }
  }, []);

  return (
    <header
      className={cn(
        "rounded-[30px] border border-white/70 bg-white/85 p-4 shadow-[0_18px_40px_rgba(17,24,39,0.06)] backdrop-blur",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-text">{title}</h1>
            <Badge label={roleLabel} tone="neutral" className="bg-amber-50 text-amber-800" />
          </div>
          <p className="text-sm text-text-muted">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-soft">
            <Search className="size-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search districts, schools, or issue IDs"
              className="w-full bg-transparent text-text outline-none placeholder:text-text-soft"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowNotice((current) => !current)}
            className="relative flex size-11 items-center justify-center rounded-2xl border border-border bg-surface text-text-muted transition hover:text-text"
            aria-label="Toggle maintenance notifications"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-surface-strong text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">{userLabel}</p>
              <p className="text-xs text-text-soft">Live secure session</p>
            </div>
          </div>
        </div>
      </div>
      {showNotice ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Live queue updates are enabled. New reports and contractor assignments refresh from MongoDB.
        </div>
      ) : null}
      {search ? (
        <div className="mt-3 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
          Search filter ready for: <span className="font-semibold text-text">{search}</span>
        </div>
      ) : null}
    </header>
  );
}
