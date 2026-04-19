import Link from "next/link";
import { ShieldCheck } from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.38),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(11,110,79,0.1),transparent_28%)]" />
      <div className="section-shell relative flex min-h-screen flex-col justify-center py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-text">FixAhead</p>
              <p className="text-xs uppercase tracking-[0.18em] text-text-soft">
                School Maintenance Platform
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-text-muted transition hover:text-text"
          >
            Back to overview
          </Link>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[36px] bg-primary px-8 py-10 text-white shadow-[0_24px_60px_rgba(11,110,79,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
              Secure access
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/80">{subtitle}</p>
            <div className="mt-8 space-y-4 rounded-[28px] bg-white/10 p-5">
              <div className="rounded-2xl bg-white/10 px-4 py-4 text-sm leading-7 text-white/85">
                Peons submit weekly condition reports, principals monitor school status, DEOs prioritize repairs, and contractors update completion proofs through one verified identity layer.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                    Verification
                  </p>
                  <p className="mt-2 text-lg font-semibold">Email token activation</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                    Role routing
                  </p>
                  <p className="mt-2 text-lg font-semibold">Access by field responsibility</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card-shadow rounded-[36px] border border-white/70 bg-white/92 p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
