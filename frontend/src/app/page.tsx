"use client";

import PublicNavbar from "@/components/PublicNavbar";
import Link from "next/link";

const ACCENT = "#0ea371";

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#020d1a] dark:text-white">
      <PublicNavbar />

      {/* HERO */}
      <section className="relative">
        <div
          className="absolute inset-0 -z-10 opacity-95"
          style={{
            background:
              "radial-gradient(1200px 500px at 10% -10%, rgba(14,163,113,0.18), transparent 60%), radial-gradient(800px 400px at 90% 10%, rgba(14,163,113,0.10), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="mb-3 text-4xl font-extrabold leading-tight md:text-5xl">
                Welcome to the{" "}
                <span className="underline decoration-4" style={{ textDecorationColor: ACCENT }}>
                  Harari Region Diaspora Portal
                </span>
              </h1>
              <p className="max-w-xl text-lg text-gray-600 dark:text-dark-6">
                Register, connect, and track your engagements with regional offices—investment,
                tourism, family visits, study, charity/NGO and more. One profile, seamless referrals.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/sign-up"
                  className="rounded-md px-6 py-3 font-semibold text-white hover:opacity-90"
                  style={{ background: ACCENT }}
                >
                  Register as Diaspora
                </Link>
                <Link
                  href="/programs"
                  className="rounded-md border px-6 py-3 font-semibold hover:bg-gray-50 dark:hover:bg-dark-2"
                  style={{ borderColor: "rgba(14,163,113,0.35)", color: ACCENT }}
                >
                  Explore Programs
                </Link>
              </div>

              {/* Trust bar */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-dark-6">
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full" style={{ background: ACCENT }} />
                  Single profile across offices
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full" style={{ background: ACCENT }} />
                  Track referrals & status
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full" style={{ background: ACCENT }} />
                  Secure & role-based access
                </div>
              </div>
            </div>

            {/* Card mockup */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-[#0f1a29]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold">Recent Registrations</div>
                  <span className="rounded-full px-2 py-1 text-xs text-white" style={{ background: ACCENT }}>
                    Live
                  </span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-[#0c1522]">
                    <span>Investment · Manufacturing</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                      Submitted
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-[#0c1522]">
                    <span>Tourism · Family visit</span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200">
                      Under Review
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-[#0c1522]">
                    <span>Charity/NGO · Health outreach</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-200">
                      Approved
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-md border p-3 dark:border-dark-3">
                  <div className="text-xl font-bold">4,215</div>
                  <div className="text-gray-600 dark:text-dark-6">Registered Diaspora</div>
                </div>
                <div className="rounded-md border p-3 dark:border-dark-3">
                  <div className="text-xl font-bold">268</div>
                  <div className="text-gray-600 dark:text-dark-6">Active Investments</div>
                </div>
                <div className="rounded-md border p-3 dark:border-dark-3">
                  <div className="text-xl font-bold">37</div>
                  <div className="text-gray-600 dark:text-dark-6">Partner Offices</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Why use the Diaspora Portal?</h2>
          <span className="text-sm text-gray-600 dark:text-dark-6">
            Built for the Harari People Regional State
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-6 transition hover:shadow-sm dark:border-dark-3">
            <h3 className="mb-2 text-lg font-semibold" style={{ color: ACCENT }}>
              Register Once
            </h3>
            <p className="text-gray-600 dark:text-dark-6">
              Create a profile and reuse it across Investment Bureau, Land Management, and more.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 transition hover:shadow-sm dark:border-dark-3">
            <h3 className="mb-2 text-lg font-semibold" style={{ color: ACCENT }}>
              Smart Referrals
            </h3>
            <p className="text-gray-600 dark:text-dark-6">
              Your profile moves with you—offices can securely view your details and update progress.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 transition hover:shadow-sm dark:border-dark-3">
            <h3 className="mb-2 text-lg font-semibold" style={{ color: ACCENT }}>
              Dashboards & Reports
            </h3>
            <p className="text-gray-600 dark:text-dark-6">
              View monthly/quarterly/yearly trends across purposes like investment, tourism, and study.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            { t: "Register", d: "Create your diaspora profile online—from Ethiopia or abroad." },
            { t: "Select Purpose", d: "Choose investment, tourism, family, study, charity/NGO, or other." },
            { t: "Get Referred", d: "We route you to the right bureaus; track status in one place." },
            { t: "Engage & Report", d: "Follow progress, upload documents, and receive updates." },
          ].map((s, i) => (
            <li key={s.t} className="rounded-lg border border-gray-200 p-4 dark:border-dark-3">
              <div
                className="mb-2 inline-flex size-7 items-center justify-center rounded-full text-white"
                style={{ background: ACCENT }}
              >
                {i + 1}
              </div>
              <div className="font-semibold">{s.t}</div>
              <div className="text-sm text-gray-600 dark:text-dark-6">{s.d}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 py-8 text-sm text-gray-600 dark:border-dark-3 dark:text-dark-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div>© {year} Harari Region Diaspora Management. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-[var(--accent)]" style={{ ["--accent" as any]: ACCENT }}>About</Link>
            <Link href="/programs" className="hover:text-[var(--accent)]" style={{ ["--accent" as any]: ACCENT }}>Programs</Link>
            <Link href="/offices" className="hover:text-[var(--accent)]" style={{ ["--accent" as any]: ACCENT }}>Offices</Link>
            <Link href="/contact" className="hover:text-[var(--accent)]" style={{ ["--accent" as any]: ACCENT }}>Contact</Link>
            <Link href="/auth/sign-in" className="font-semibold text-[var(--accent)]" style={{ ["--accent" as any]: ACCENT }}>
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
