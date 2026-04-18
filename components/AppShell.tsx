"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar, type SidebarItem } from "@/components/Sidebar";

export function AppShell({
  activeHref,
  title,
  subtitle,
  roleLabel,
  children,
}: {
  activeHref: string;
  title: string;
  subtitle: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("fixahead_auth_token");
    const storedUser = window.localStorage.getItem("fixahead_auth_user");

    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const allowedByPath: Record<string, string[]> = {
          "/dashboard": ["deo"],
          "/principal": ["principal", "deo"],
          "/report": ["peon", "principal", "deo"],
          "/contractor": ["contractor", "deo"],
        };
        const allowedRoles = allowedByPath[activeHref];

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          const roleHome: Record<string, string> = {
            peon: "/report",
            principal: "/principal",
            deo: "/dashboard",
            contractor: "/contractor",
          };
          router.replace(roleHome[user.role] || "/login");
          return;
        }
      } catch (_error) {
        router.replace("/login");
        return;
      }
    }

    setReady(true);
  }, [activeHref, pathname, router]);

  const items: SidebarItem[] = [
    { href: "/dashboard", label: "DEO Dashboard", icon: "dashboard" },
    { href: "/principal", label: "Principal View", icon: "principal" },
    { href: "/report", label: "Peon Reporting", icon: "report" },
    { href: "/contractor", label: "Contractor Tasks", icon: "contractor" },
    { href: "/", label: "Programme Overview", icon: "overview" },
  ];

  return (
    <div className="min-h-screen bg-transparent px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar activeHref={activeHref} items={items} />
        <main className="space-y-4">
          <Navbar title={title} subtitle={subtitle} roleLabel={roleLabel} />
          {ready ? (
            children
          ) : (
            <div className="rounded-[30px] border border-white/70 bg-white/85 p-8 text-center text-sm text-text-muted">
              Checking secure access...
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
