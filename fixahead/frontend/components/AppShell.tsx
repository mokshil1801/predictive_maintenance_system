"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar, type SidebarItem } from "@/components/Sidebar";
import { decodeJwtRole, getRoleRedirectPath, type AuthUser } from "@/lib/auth-client";

const requiredRoleByPath: Record<string, AuthUser["role"]> = {
  "/dashboard": "deo",
  "/principal": "principal",
  "/report": "peon",
  "/contractor": "contractor",
};

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
    const rawUser = window.localStorage.getItem("fixahead_auth_user");

    if (!token || !rawUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const storedUser = JSON.parse(rawUser) as AuthUser;
    const tokenRole = decodeJwtRole(token);
    const user = { ...storedUser, role: tokenRole || storedUser.role };
    const requiredRole = requiredRoleByPath[activeHref];

    if (requiredRole && user.role !== requiredRole) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setReady(true);
  }, [activeHref, pathname, router]);

  const allItems: SidebarItem[] = [
    { href: "/dashboard", label: "DEO Dashboard", icon: "dashboard" },
    { href: "/principal", label: "Principal View", icon: "principal" },
    { href: "/report", label: "Peon Reporting", icon: "report" },
    { href: "/contractor", label: "Contractor Tasks", icon: "contractor" },
    { href: "/", label: "Programme Overview", icon: "overview" },
  ];
  const rawUser = typeof window !== "undefined" ? window.localStorage.getItem("fixahead_auth_user") : null;
  const rawToken = typeof window !== "undefined" ? window.localStorage.getItem("fixahead_auth_token") : null;
  const user = rawUser
    ? ({
        ...(JSON.parse(rawUser) as AuthUser),
        role: rawToken ? decodeJwtRole(rawToken) || (JSON.parse(rawUser) as AuthUser).role : (JSON.parse(rawUser) as AuthUser).role,
      } as AuthUser)
    : null;
  const roleHref = user ? getRoleRedirectPath(user.role) : activeHref;
  const items = allItems.filter((item) => item.href === roleHref || item.href === "/");

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm font-medium text-text-muted">
        Loading FixAhead workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar activeHref={activeHref} items={items} primaryHref={roleHref} />
        <main className="space-y-4">
          <Navbar title={title} subtitle={subtitle} roleLabel={roleLabel} />
          {children}
        </main>
      </div>
    </div>
  );
}
