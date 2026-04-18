import Link from "next/link";
import { Building2, ClipboardCheck, LayoutDashboard, School2, Wrench } from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  principal: School2,
  report: ClipboardCheck,
  contractor: Wrench,
  overview: Building2,
};

export type SidebarItem = {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
};

export function Sidebar({
  activeHref,
  items,
}: {
  activeHref: string;
  items: SidebarItem[];
}) {
  return (
    <aside className="flex h-full flex-col rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_50px_rgba(17,24,39,0.06)] backdrop-blur">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white">
          <Building2 className="size-5" />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-text">FixAhead</p>
          <p className="text-xs uppercase tracking-[0.18em] text-text-soft">
            School Infrastructure Engine
          </p>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const active = activeHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-surface-strong text-primary"
                  : "text-text-muted hover:bg-surface-muted hover:text-text",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <Button href="/report" className="w-full">
          Weekly Condition Entry
        </Button>
        <div className="rounded-2xl bg-surface-muted p-4 text-sm text-text-muted">
          Dashboard data is synchronized from MongoDB and Socket.IO events.
        </div>
      </div>
    </aside>
  );
}
