"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField } from "@/components/AuthField";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await requestPasswordReset(email);
      setSuccess(response.message);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send password reset link.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Request a secure reset link for your FixAhead account."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-text">
            Reset your password
          </p>
          <p className="text-sm leading-7 text-text-muted">
            Enter your registered email and we will send you a password reset link.
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
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
            placeholder="name@fixahead.gov.in"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending link..." : "Send Reset Link"}
          </Button>
        </form>

        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </AuthShell>
  );
}
