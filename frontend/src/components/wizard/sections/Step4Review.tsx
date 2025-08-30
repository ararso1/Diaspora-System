// components/wizard/sections/Step4Review.tsx
"use client";

import type { DraftState } from "@/types/diaspora";

export default function Step4Review({ draft }: { draft: DraftState }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4 shadow-sm">
          <div className="font-medium mb-2">Basic Information</div>
          <div>First name: {draft.step1.user_first_name}</div>
          <div>Last name: {draft.step1.user_last_name}</div>
          <div>Email: {draft.step1.user_email}</div>
          <div>Phone: {draft.step1.user_phone}</div>
          <div>Gender: {draft.step1.user_gender || "—"}</div>
          <div>Citizenship: {draft.step1.user_citizenship || "—"}</div>
          <div>DOB: {draft.step1.user_dob || "—"}</div>
        </div>

        <div className="rounded-xl border p-4 shadow-sm">
          <div className="font-medium mb-2">Additional Details</div>
          <div>Full name: {draft.step2.full_name || "—"}</div>
          <div>WhatsApp: {draft.step2.whatsapp || "—"}</div>
          <div>
            Residence: {draft.step2.country_of_residence || "—"} {draft.step2.city_of_residence || ""}
          </div>
          <div>Arrival date: {draft.step2.arrival_date || "—"}</div>
          <div>Expected stay: {draft.step2.expected_stay_duration || "—"}</div>
          <div>Returnee: {draft.step2.is_returnee ? "Yes" : "No"}</div>
          <div>Language: {draft.step2.preferred_language || "—"}</div>
          <div>Communications: {(draft.step2.communication_opt_in ?? true) ? "Allowed" : "No"}</div>
          <div>Local address: {draft.step2.address_local || "—"}</div>
          <div>
            Emergency: {draft.step2.emergency_contact_name || "—"} / {draft.step2.emergency_contact_phone || "—"}
          </div>
          <div>Passport: {draft.step2.passport_no || "—"}</div>
          <div>ID number: {draft.step2.id_number || "—"}</div>
          <div>Passport scan: {draft.step2.passport_scan ? draft.step2.passport_scan.name : "—"}</div>
          <div>ID scan: {draft.step2.id_scan ? draft.step2.id_scan.name : "—"}</div>
        </div>

        <div className="rounded-xl border p-4 shadow-sm md:col-span-2">
          <div className="font-medium mb-2">Purpose</div>
          <div>Type: {draft.step3.type || "—"}</div>
          <div>Description: {draft.step3.description || "—"}</div>
          <div>Sector / Sub-sector: {draft.step3.sector || "—"} / {draft.step3.sub_sector || "—"}</div>
          <div>Investment type: {draft.step3.investment_type || "—"}</div>
          <div>
            Capital: {draft.step3.estimated_capital ?? "—"} {draft.step3.currency || ""}
          </div>
          <div>Expected jobs: {draft.step3.jobs_expected ?? "—"}</div>
          <div>
            Land: {draft.step3.land_requirement ? "Yes" : "No"} — {draft.step3.land_size ?? "—"}
          </div>
          <div>Preferred location: {draft.step3.preferred_location_note || "—"}</div>
        </div>
      </div>
    </div>
  );
}
