"use client";

import PublicNavbar from "@/components/PublicNavbar";
import { useState } from "react";
import { registerUser } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!form.username || !form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      const response = await registerUser({
        username: form.username,
        email: form.email,
        password: form.password,
        password2: form.confirmPassword,
        first_name: form.firstName,
        last_name: form.lastName,
      });

      setSuccess("Account created successfully! You can now sign in.");
      setForm({ username: "", firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 2000);
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
        <h1 className="mb-6 text-2xl font-bold">Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Username *</label>
            <input name="username" value={form.username} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" required />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm Password *</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2" required />
          </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button type="submit" disabled={submitting} className="rounded bg-primary px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {submitting ? "Submitting..." : "Create Account"}
          </button>
        </form>
      </main>
    </div>
  );
}


