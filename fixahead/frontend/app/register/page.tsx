"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField } from "@/components/AuthField";
import { AuthSelect } from "@/components/AuthSelect";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { isStrongPassword, registerUser, type UserRole } from "@/lib/auth-client";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "peon", label: "Peon" },
  { value: "principal", label: "Principal" },
  { value: "deo", label: "District Education Officer (DEO)" },
  { value: "contractor", label: "Contractor" },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "peon",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser(form);
      setSuccess(response.message);
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "peon",
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Register a FixAhead account"
      subtitle="Create an account for school reporting, approval monitoring, or contractor execution."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-text">
            Create your account
          </p>
          <p className="text-sm leading-7 text-text-muted">
            Choose your operational role so FixAhead can route you to the correct workspace after login.
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
            label="Full name"
            type="text"
            placeholder="District officer or field staff name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
          />
          <AuthField
            label="Email"
            type="email"
            placeholder="name@fixahead.gov.in"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            required
          />
          <AuthField
            label="Phone number"
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
          />
          <AuthSelect
            label="Role"
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as UserRole,
              }))
            }
            options={roleOptions}
          />
          <AuthField
            label="Password"
            type="password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            required
          />
          <AuthField
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                confirmPassword: event.target.value,
              }))
            }
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="text-sm text-text-muted">
          Already registered?
          <Link href="/login" className="ml-2 font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
