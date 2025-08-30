"use client";

import PublicNavbar from "@/components/PublicNavbar";
import { useState } from "react";
import Link from "next/link";

export default function SignUpPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    if (!form.first_name.trim()) return "First name is required.";
    if (!form.last_name.trim()) return "Last name is required.";
    if (!form.email.trim()) return "Email is required.";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) return "Please enter a valid email address.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm_password) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!API_URL) {
      setError("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Correct nested payload for /public/register/
      const payload = {
        user: {
          email: form.email,
          username: form.email, // use email as username
          first_name: form.first_name,
          last_name: form.last_name,
          password: form.password,
        },
        confirm_password: form.confirm_password, // optional, validated in view
        // You can add initial diaspora fields later if you want:
        // primary_phone: "+2519...", gender: "FEMALE", ...
      };

      const res = await fetch(`${API_URL}/public/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to read DRF error JSON; fall back to text
        let msg = "";
        try {
          const j = await res.json();
          msg =
            typeof j === "string"
              ? j
              : j.detail ||
                Object.entries(j)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
                  .join("; ");
        } catch {
          msg = await res.text();
        }
        throw new Error(msg || `Signup failed (${res.status})`);
      }

      // optional: you can read the created diaspora response here
      // const created = await res.json();

      setSuccess("Account created successfully. You can now sign in.");
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: "",
      });
    } catch (err: any) {
      setError(err?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#020d1a] dark:text-white">
      <PublicNavbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">Register as Diaspora</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-dark-6">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary underline">
            Sign in
          </Link>
          .
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">First Name *</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last Name *</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Password *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Confirm Password *</label>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">
            {success }{" "}
            <Link href="/auth/sign-in" className="text-primary underline">
            Sign in
            </Link>
          </p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-primary px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-600 dark:text-dark-6">
          After creating your account, complete your detailed profile and purpose under
          the registration wizard.
        </p>
      </main>
    </div>
  );
}