import { AppShell } from "@/components/AppShell";
import { PeonReportForm } from "@/components/PeonReportForm";

export default function ReportPage() {
  return (
    <AppShell
      activeHref="/report"
      title="Weekly School Condition Entry"
      subtitle="Fast field reporting for peons to record plumbing, electrical, and structural conditions."
      roleLabel="Peon View"
    >
      <div className="grid min-h-[calc(100vh-220px)] place-items-center">
        <PeonReportForm />
      </div>
    </AppShell>
  );
}
