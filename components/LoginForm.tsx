"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthField } from "@/components/AuthField";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import {
  getRoleRedirectPath,
  loginUser,
  storeAuthSession,
} from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const statusMessage = useMemo(() => {
    const verified = searchParams.get("verified");
    const reset = searchParams.get("reset");

    if (verified === "1") {
      return "Email verified. You can now log in to FixAhead.";
    }

    if (verified === "invalid") {
      return "Verification link is invalid or has already been used.";
    }

    if (reset === "1") {
      return "Password updated successfully. Log in with your new password.";
    }

    return "";
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(form.email, form.password);
      storeAuthSession(response.token, response.user);
      router.push(getRoleRedirectPath(response.user.role));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to log in at the moment.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Login to FixAhead"
      subtitle="Access verified dashboards for school reporting, district review, and contractor execution."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-text">
            Welcome back
          </p>
          <p className="text-sm leading-7 text-text-muted">
            Use your registered email to continue to your role-specific FixAhead workspace.
          </p>
        </div>

        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField
            label="Email"
            type="email"
            placeholder="officer@fixahead.gov.in"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            required
          />

          <AuthField
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="flex flex-col gap-3 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <Link href="/register" className="font-medium text-primary hover:underline">
            Don&apos;t have an account? Register
          </Link>
          <Link
            href="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
