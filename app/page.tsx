import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

const problemItems = [
  {
    title: "Repairs happen after breakdown",
    text: "Schools report only when toilets stop working, wiring becomes dangerous, or cracks become visible to staff.",
  },
  {
    title: "Student safety is affected first",
    text: "Water leakage, exposed electrical points, and damaged walls interrupt classes and create avoidable hazards.",
  },
  {
    title: "DEO teams lack a priority system",
    text: "Without weekly condition data, urgent cases and routine repairs enter the same queue.",
  },
];

const features = [
  "Category-specific prediction for plumbing, electrical, and structural risks",
  "Student impact prioritization using affected student count and usage level",
  "Explainable alerts showing why a failure is likely in 30–60 days",
  "Maintenance workflow tracking from report submission to contractor completion",
];

const faqs = [
  {
    question: "How much reporting is required from each school?",
    answer:
      "The peon submits one structured weekly condition report with sliders, toggles, and photos. The form is designed to finish in under 2 minutes.",
  },
  {
    question: "What types of failures can the system predict?",
    answer:
      "FixAhead prioritizes toilet breakdown, pipeline leakage, exposed wiring, switchboard risk, crack progression, and roof deterioration across government schools.",
  },
  {
    question: "How does the DEO decide which repair to fund first?",
    answer:
      "The queue ranks issues by failure window, risk score, and student impact, so schools affecting larger student groups rise before low-impact repairs.",
  },
  {
    question: "Can principals and contractors track progress after assignment?",
    answer:
      "Yes. Principals can monitor current school condition and task status, while contractors upload proof of repair and location confirmation from the work site.",
  },
];

export default function LandingPage() {
  return (
    <main className="pb-16">
      <section className="section-shell pt-6">
        <div className="rounded-[34px] border border-white/70 bg-white/90 px-6 py-5 shadow-[0_18px_42px_rgba(17,24,39,0.06)] backdrop-blur sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-text">FixAhead</p>
                <p className="text-xs uppercase tracking-[0.18em] text-text-soft">
                  Predictive Maintenance Engine for Gujarat Schools
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-6 text-sm text-text-muted">
              <Link href="#problem" className="transition hover:text-text">
                Problem
              </Link>
              <Link href="#solution" className="transition hover:text-text">
                How It Works
              </Link>
              <Link href="#features" className="transition hover:text-text">
                Features
              </Link>
              <Link href="#faq" className="transition hover:text-text">
                FAQ
              </Link>
              <Button href="/dashboard">Start Monitoring Schools</Button>
            </nav>
          </div>
        </div>
      </section>

      <section className="section-shell py-10 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-7">
            <Badge label="Built for government school infrastructure monitoring" tone="neutral" />
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-text sm:text-6xl">
                Fix School Infrastructure Before It Fails
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-text-muted">
                Predict plumbing, electrical, and structural failures 30–60 days in advance so district teams can act before toilets shut down, wiring becomes unsafe, or classroom walls deteriorate.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button href="/dashboard" size="lg">
                Start Monitoring Schools
              </Button>
              <Button href="/principal" size="lg" variant="secondary">
                View School Health
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="space-y-2 bg-surface-strong">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-text-soft">
                  Weekly inputs
                </p>
                <p className="text-3xl font-semibold tracking-tight text-primary">2 min</p>
                <p className="text-sm text-text-muted">Peon submits structured condition form</p>
              </Card>
              <Card className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-text-soft">
                  Prediction window
                </p>
                <p className="text-3xl font-semibold tracking-tight text-text">30–60 days</p>
                <p className="text-sm text-text-muted">Failure alerts with clear reasons</p>
              </Card>
              <Card className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-text-soft">
                  Priority basis
                </p>
                <p className="text-3xl font-semibold tracking-tight text-text">Impact</p>
                <p className="text-sm text-text-muted">Affects 120 students rises first</p>
              </Card>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[40px] bg-[linear-gradient(135deg,rgba(167,243,208,0.75),rgba(255,255,255,0.95))]" />
            <Card className="relative overflow-hidden rounded-[36px] border-white/80 bg-white/90 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[28px] bg-surface-muted p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-soft">
                    School cluster
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                    Ahmedabad Rural Block
                  </p>
                  <div className="mt-6 rounded-[24px] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-soft">Predicted plumbing failure</p>
                        <p className="mt-2 text-4xl font-semibold tracking-tight text-text">
                          92%
                        </p>
                      </div>
                      <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        Toilet block at risk
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="rounded-[28px] bg-primary p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      Active alert
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      Electrical wiring exposed
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/80">
                      Corridor switchboard near Class 8 reported twice in two weeks.
                    </p>
                  </div>
                  <div className="rounded-[28px] bg-surface-muted p-5">
                    <p className="text-sm text-text-soft">Explainable signal</p>
                    <div className="mt-3 flex items-start gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-surface-strong text-primary">
                        <AlertTriangle className="size-5" />
                      </div>
                      <p className="text-sm leading-6 text-text-muted">
                        Water leakage detected for 3 weeks, toilet functionality dropped to 40%, and the facility serves the morning shift girls' block.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="problem" className="section-shell py-10">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Problem
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-text">
              Reactive maintenance leaves students waiting for failures.
            </h2>
            <p className="text-base leading-8 text-text-muted">
              District teams receive complaints only after toilets become unusable, water pipelines burst, or school buildings show visible damage. By then, classes and safety are already affected.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {problemItems.map((item) => (
              <Card key={item.title} className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                  <AlertTriangle className="size-5" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-text">{item.title}</h3>
                <p className="text-sm leading-7 text-text-muted">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="solution" className="section-shell py-10">
        <Card className="overflow-hidden rounded-[36px] p-0">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-primary px-8 py-10 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                Solution
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                Weekly reporting turns isolated complaints into a priority-ready maintenance system.
              </h2>
              <p className="mt-4 text-base leading-8 text-white/80">
                Peons submit structured inputs, the engine predicts failures, principals monitor school health, and DEOs assign contractors using a queue ranked by urgency and student impact.
              </p>
            </div>
            <div className="grid gap-4 bg-surface p-8 md:grid-cols-5">
              {[
                { title: "Input", text: "Weekly school condition report", icon: ClipboardCheck },
                { title: "Prediction", text: "30–60 day failure alert", icon: AlertTriangle },
                { title: "Priority", text: "Student impact queue for DEO", icon: ShieldAlert },
                { title: "Repair", text: "Contractor assignment and proof", icon: Wrench },
                { title: "Feedback", text: "Repair outcome improves future alerts", icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-[28px] bg-surface-muted p-5">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-4 text-lg font-semibold tracking-tight text-text">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      <section id="features" className="section-shell py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Features
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-text">
              Built for district-level school repair decisions.
            </h2>
            <p className="text-base leading-8 text-text-muted">
              Every feature is structured around the actual maintenance workflow: school reporting, district review, prioritization, execution, and verification.
            </p>
            <div className="space-y-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-4"
                >
                  <div className="mt-1 flex size-8 items-center justify-center rounded-full bg-surface-strong text-primary">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <p className="text-sm leading-7 text-text-muted">{feature}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-strong text-primary">
                <Droplets className="size-5" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-text">Plumbing alert logic</h3>
              <p className="text-sm leading-7 text-text-muted">
                Flags toilet failure risk when leak indicators, usage decline, and repeated low functionality scores appear together.
              </p>
            </Card>
            <Card className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-text">
                Explainable reason panel
              </h3>
              <p className="text-sm leading-7 text-text-muted">
                Shows why an issue is in the queue, for example: water leakage detected, 120 students affected, and failure expected within 20 days.
              </p>
            </Card>
            <Card className="space-y-4 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-soft">
                    Benefits
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                    Reduce repair delays, improve student safety, and use government funds where they matter first.
                  </h3>
                </div>
                <Button href="/dashboard" variant="secondary">
                  Open DEO Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="faq" className="section-shell py-10">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">FAQ</p>
            <h2 className="text-4xl font-semibold tracking-tight text-text">
              Questions from district implementation teams.
            </h2>
            <p className="text-base leading-8 text-text-muted">
              The product is designed for field usability, predictable district review, and faster contractor dispatch.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[28px] border border-border bg-white px-6 py-5"
              >
                <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-text">
                  {faq.question}
                </summary>
                <p className="mt-4 text-sm leading-7 text-text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-10">
        <Card className="rounded-[36px] bg-primary px-8 py-10 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                Next step
              </p>
              <h2 className="text-4xl font-semibold tracking-tight">
                Prevent Failures Before They Happen
              </h2>
              <p className="max-w-2xl text-base leading-8 text-white/80">
                Move from complaint-based repair requests to a district queue that predicts risk, shows student impact, and speeds up contractor assignment.
              </p>
            </div>
            <Button href="/dashboard" size="lg" variant="secondary" className="shrink-0">
              Start Monitoring Schools
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
