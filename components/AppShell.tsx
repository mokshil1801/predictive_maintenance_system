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
          {children}
        </main>
      </div>
    </div>
  );
}
