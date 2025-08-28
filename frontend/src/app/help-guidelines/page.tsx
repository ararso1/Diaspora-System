// src/app/help-guidelines/page.tsx
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import {
  CheckCircle,
  FileText,
  Users,
  BarChart3,
  Clock,
  Shield,
  Globe2,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Help & Guidelines — Harari Region Diaspora Office",
};

export default function HelpGuidelinesPage() {
  const accent = "text-[#5750f1]";

  return (
    <>
      <Breadcrumb pageName="Help & Guidelines" />

      <div className="grid gap-6 md:grid-cols-[260px,1fr]">
        {/* Table of contents (sticky on larger screens) */}
        <aside className="hidden md:block">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-dark-3 dark:bg-gray-dark">
            <div className={`mb-2 font-semibold ${accent}`}>On this page</div>
            <nav className="space-y-2">
              <a href="#overview" className="block hover:underline">
                Overview
              </a>
              <a href="#benefits" className="block hover:underline">
                What the system simplifies
              </a>
              <a href="#how-it-works" className="block hover:underline">
                How it works
              </a>
              <a href="#roles" className="block hover:underline">
                User roles
              </a>
              <a href="#reports" className="block hover:underline">
                Reporting & decisions
              </a>
              <a href="#security" className="block hover:underline">
                Security & privacy
              </a>
              <a href="#faq" className="block hover:underline">
                FAQs
              </a>
              <a href="#support" className="block hover:underline">
                Support
              </a>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="space-y-8">
          {/* HERO */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
            <h1 className="mb-2 text-2xl font-bold text-dark dark:text-white">
              Harari Region <span className={accent}>Diaspora Office</span> — Help & Guidelines
            </h1>
            <p className="text-gray-600 dark:text-dark-6">
              This guide explains how the system streamlines diaspora engagement in Harari: registration, case
              tracking, and inter-office referrals (Investment Bureau, City Land Management Bureau, NIGID, etc.)
              — enabling faster service, coordinated support, and transparent follow-up.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="#how-it-works"
                className="inline-flex items-center rounded-lg bg-[#5750f1] px-4 py-2 text-white hover:opacity-90"
              >
                See How it Works <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link
                href="/diasporas"
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-2"
              >
                Go to Diasporas
              </Link>
              <Link
                href="/reports"
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-2"
              >
                View Reports
              </Link>
            </div>
          </section>

          {/* OVERVIEW */}
          <section
            id="overview"
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark"
          >
            <h2 className={`mb-4 text-xl font-semibold ${accent}`}>Overview</h2>
            <p className="text-gray-700 dark:text-dark-6">
              The platform centralizes diaspora profiles, purposes (investment, tourism, family, study, charity/NGO,
              other), and their case progress across government offices. A single record follows the diaspora from
              registration to referrals and completion, replacing disjointed paper/email workflows.
            </p>
          </section>

          {/* BENEFITS */}
          <section
            id="benefits"
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark"
          >
            <h2 className={`mb-6 text-xl font-semibold ${accent}`}>What the system simplifies</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Feature
                icon={<FileText className="h-5 w-5" />}
                title="Unified registration"
                text="Register in-office or remotely. All core details and documents live in one profile."
              />
              <Feature
                icon={<Users className="h-5 w-5" />}
                title="Smart referrals"
                text="Send cases to Investment Bureau, City Land Management, NIGID, etc. with full context."
              />
              <Feature
                icon={<Clock className="h-5 w-5" />}
                title="Faster processing"
                text="Clear stages (Intake → Screening → Referral → Processing → Completed/Closed) reduce delays."
              />
              <Feature
                icon={<BarChart3 className="h-5 w-5" />}
                title="Insightful dashboards"
                text="Track arrivals by period, purpose mix, sector demand, and case status at a glance."
              />
              <Feature
                icon={<Globe2 className="h-5 w-5" />}
                title="Better service"
                text="Diaspora receive consistent support and visibility on progress across offices."
              />
              <Feature
                icon={<CheckCircle className="h-5 w-5" />}
                title="Accountability"
                text="Every update is auditable—who referred, when received, and what decisions were made."
              />
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section
            id="how-it-works"
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark"
          >
            <h2 className={`mb-6 text-xl font-semibold ${accent}`}>How it works</h2>

            <ol className="relative ml-4 border-l border-gray-200 dark:border-dark-3">
              <Step
                title="1) Register Diaspora"
                text="Capture basic info (name, contact, DOB, gender, citizenship), residence, arrival details, and purpose (e.g., investment)."
              />
              <Step
                title="2) Auto-Create Case"
                text="Each registration creates a Case at the Diaspora Office (Stage: Intake). Officers review and move to Screening."
              />
              <Step
                title="3) Refer to Offices"
                text="From Case, send a Referral to the appropriate office (Investment Bureau, City Land Management Bureau, NIGID, etc.) with reasons and SLA."
              />
              <Step
                title="4) Office Processing"
                text="Receiving office updates the referral status (Received → In Progress → Completed/Rejected) and adds outcomes/notes."
              />
              <Step
                title="5) Closure & Follow-up"
                text="When actions are done, the Case is marked Completed/Closed. Progress remains visible in the diaspora profile."
              />
            </ol>

            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm dark:bg-dark-2">
              <div className="font-medium">Case stages:</div>
              <ul className="mt-1 list-disc pl-5 text-gray-600 dark:text-dark-6">
                <li>
                  <b>INTAKE</b> → <b>SCREENING</b> → <b>REFERRAL</b> → <b>PROCESSING</b> →{" "}
                  <b>COMPLETED/CLOSED</b>
                </li>
              </ul>
              <div className="mt-3 font-medium">Purpose examples:</div>
              <ul className="mt-1 list-disc pl-5 text-gray-600 dark:text-dark-6">
                <li>Investment (sector, sub-sector, capital, jobs, land size)</li>
                <li>Tourism, Family, Study, Charity/NGO, Other</li>
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/diasporas/new"
                className="inline-flex items-center rounded-lg bg-[#5750f1] px-4 py-2 text-white hover:opacity-90"
              >
                Register a Diaspora
              </Link>
              <Link
                href="/cases"
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-2"
              >
                View Cases
              </Link>
            </div>
          </section>

          {/* ROLES */}
          <section
            id="roles"
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark"
          >
            <h2 className={`mb-6 text-xl font-semibold ${accent}`}>User roles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <RoleCard
                title="Diaspora"
                items={[
                  "Self-register from abroad or on arrival",
                  "Submit purpose (e.g., investment) and documents",
                  "Track progress and outcomes via office",
                ]}
              />
              <RoleCard
                title="Officer (Bureaus & Offices)"
                items={[
                  "Screen registrations and create/update cases",
                  "Refer to relevant offices with clear reasons",
                  "Update statuses and add results/notes",
                ]}
              />
              <RoleCard
                title="Director / Leadership"
                items={[
                  "Oversee caseload and office performance",
                  "Approve or escalate complex referrals",
                  "Use analytics to guide policy and investment",
                ]}
              />
              <RoleCard
                title="All Staff"
                items={[
                  "Work within defined case stages",
                  "Maintain accurate, timely updates",
                  "Ensure coordinated service to diaspora",
                ]}
              />
            </div>
          </section>

          {/* REPORTING */}
          <section
            id="reports"
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark"
          >
            <h2 className={`mb-4 text-xl font-semibold ${accent}`}>Reporting & decisions</h2>
            <p className="text-gray-700 dark:text-dark-6">
              The dashboard highlights diaspora totals by month/quarter/year, breakdown by purpose, sectors and
              sub-sectors, investment types, and case/ referral statuses by office. Use these insights to identify
              bottlenecks, prioritize enablers (land, licensing, NIGID), and track outcomes such as jobs and capital.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/reports"
                className="inline-flex items-center rounded-lg bg-[#5750f1] px-4 py-2 text-white hover:opacity-90"
              >
                Open Reports
              </Link>
            </div>
          </section>

          {/* SECURITY */}
          <section
            id="security"
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark"
          >
            <h2 className={`mb-4 text-xl font-semibold ${accent}`}>Security & privacy</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              <Bullet text="Role-based access and least-privilege permissions" />
              <Bullet text="Audit trail on registrations, cases, and referrals" />
              <Bullet text="Secure authentication & session management" />
              <Bullet text="Data retention aligned with Harari policies" />
            </ul>
          </section>

          {/* FAQ */}
          <section
            id="faq"
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark"
          >
            <h2 className={`mb-4 text-xl font-semibold ${accent}`}>FAQs</h2>

            <details className="group rounded-lg border border-gray-200 p-4 dark:border-dark-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                How does a diaspora register?
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-2 text-gray-700 dark:text-dark-6">
                Go to <Link href="/diasporas" className="text-[#5750f1] underline">Diasporas</Link> and click{" "}
                <b>Add New</b>. Complete the 4-step form (basic, details, purpose, review) and submit.
              </p>
            </details>

            <details className="group mt-3 rounded-lg border border-gray-200 p-4 dark:border-dark-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Which offices receive referrals?
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-2 text-gray-700 dark:text-dark-6">
                Investment Bureau, City Land Management Bureau, NIGID (licensing), and other sector bureaus as needed.
                The referral carries the full profile and case context.
              </p>
            </details>

            <details className="group mt-3 rounded-lg border border-gray-200 p-4 dark:border-dark-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Can a diaspora track progress?
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-2 text-gray-700 dark:text-dark-6">
                Yes. Officers can view consolidated progress on the diaspora dashboard, including current stage and
                referral statuses per office.
              </p>
            </details>
          </section>

          {/* SUPPORT */}
          <section
            id="support"
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-gray-dark"
          >
            <h2 className={`mb-4 text-xl font-semibold ${accent}`}>Support</h2>
            <p className="text-gray-700 dark:text-dark-6">
              For access, training, or new feature requests, contact the Diaspora Office system administrator or the
              Regional ICT team.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}

/* ---------- Small presentational helpers (no external deps) ---------- */

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-dark-3">
      <div className="mb-2 inline-flex rounded-lg bg-gray-100 p-2 dark:bg-dark-2">{icon}</div>
      <div className="font-semibold text-dark dark:text-white">{title}</div>
      <p className="text-sm text-gray-600 dark:text-dark-6">{text}</p>
    </div>
  );
}

function Step({ title, text }: { title: string; text: string }) {
  return (
    <li className="ml-4 pb-6 last:pb-0">
      <div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full border border-gray-300 bg-white dark:border-dark-3 dark:bg-gray-dark" />
      <div className="font-semibold text-dark dark:text-white">{title}</div>
      <p className="text-sm text-gray-600 dark:text-dark-6">{text}</p>
    </li>
  );
}

function RoleCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-dark-3">
      <div className="mb-2 font-semibold text-dark dark:text-white">{title}</div>
      <ul className="space-y-1 text-sm text-gray-600 dark:text-dark-6">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[5px] inline-block h-1.5 w-1.5 rounded-full bg-[#5750f1]" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-gray-700 dark:bg-dark-2 dark:text-dark-6">
      <Shield className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="text-sm">{text}</span>
    </li>
  );
}
