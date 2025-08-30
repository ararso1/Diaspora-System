"use client";

import PublicNavbar from "@/components/PublicNavbar";
import { useState } from "react";
import Link from "next/link";
import { registerUser } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

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
      setError("NEXT_PUBLIC_API_URL is not configured");
      return;
    }
    if (!form.firstName || !form.lastName || !form.phone) {
      setError("First name, last name and phone are required");
      return;
    }

    try {
      setSubmitting(true);
      const usernameBase = form.email || form.phone || `${form.firstName.toLowerCase()}_${Date.now()}`;
      const payload: Record<string, any> = {
        username: usernameBase,
        first_name: form.firstName,
        last_name: form.lastName,
        phone_number: form.phone,
        password: form.password,
        confirm_password: form.confirmPassword,
        status: "active",
        groups: ["Citizen"],
      };
      if (form.email) payload.email = form.email;
      if (form.nationalId) payload.national_id = form.nationalId;

      const res = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Signup failed (${res.status})`);
      }

      setSuccess("Account created. You can now sign in.");
      setForm({ firstName: "", lastName: "", email: "", phone: "", nationalId: "", address: "", password: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Registration failed");
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
          <div>
            <label className="mb-1 block text-sm font-medium">Username *</label>
            <input name="username" value={form.username} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" required />
          </div>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Email (optional)</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">National ID (optional)</label>
              <input name="nationalId" value={form.nationalId} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Address</label>
              <input name="address" value={form.address} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" />
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
