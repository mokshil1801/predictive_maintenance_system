"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthField } from "@/components/AuthField";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { isStrongPassword, resetPassword } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, password, confirmPassword });
      router.push("/login?reset=1");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to reset password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Complete your FixAhead password reset with a new secure password."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-text">
            Choose a new password
          </p>
          <p className="text-sm leading-7 text-text-muted">
            Your new password should be strong enough for district and school operations data.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField
            label="New password"
            type="password"
            placeholder="Enter a new secure password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <AuthField
            label="Confirm password"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Updating password..." : "Reset Password"}
          </Button>
        </form>

        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </AuthShell>
  );
}
