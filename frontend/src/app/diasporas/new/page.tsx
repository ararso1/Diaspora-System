"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { cn } from "@/lib/utils";
import Stepper from "@/components/wizard/Stepper";
import StepNav from "@/components/wizard/StepNav";
import Step1Basic from "@/components/wizard/sections/Step1Basic";
import Step2Details from "@/components/wizard/sections/Step2Details";
import Step3Purpose from "@/components/wizard/sections/Step3Purpose";
import Step4Review from "@/components/wizard/sections/Step4Review";
import { useLocalDraft } from "@/hooks/useLocalDraft";
import type { DraftState } from "@/types/diaspora";
import { useRouter } from "next/navigation";
import { AnimatedModal } from "@/components/ui/animated-modal"; // <-- use your animated modal

/* ---- helpers ---- */
const withPrefix = (prefix: string, local: string | undefined) => {
  const clean = String(local || "").trim().replace(/^\+?251/, "").replace(/\s+/g, "");
  return clean ? `${prefix}${clean}` : "";
};

export default function NewDiasporaPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { draft, setDraft, clear } = useLocalDraft();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // NEW: confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);

  // auto-fill full_name from step1
  useEffect(() => {
    const full = [draft.step1.user_first_name, draft.step1.user_last_name].filter(Boolean).join(" ").trim();
    if (full !== draft.step2.full_name) setDraft({ ...draft, step2: { ...draft.step2, full_name: full } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.step1.user_first_name, draft.step1.user_last_name]);

  /* ===== Validation ===== */
  const validateStep1 = (): string | null => {
    if (!draft.step1.user_first_name?.trim()) return "First name is required.";
    if (!draft.step1.user_last_name?.trim()) return "Last name is required.";
    if (!draft.step1.user_email?.trim()) return "Email is required.";
    if (!draft.step1.user_phone?.trim()) return "Phone number is required.";
    return null;
  };
  const validateStep2 = (): string | null => {
    if (draft.step2.preferred_language === "Other" && !draft.step2.preferred_language_other?.trim()) {
      return "Please specify the preferred language.";
    }
    return null;
  };
  const validateStep3 = (): string | null => null; // make purpose required later if needed

  const next = () => {
    setError("");
    if (draft.step === 1) {
      const err = validateStep1(); if (err) return setError(err);
    }
    if (draft.step === 2) {
      const err = validateStep2(); if (err) return setError(err);
    }
    if (draft.step === 3) {
      const err = validateStep3(); if (err) return setError(err);
    }
    setDraft({ ...draft, step: Math.min(4, draft.step + 1) });
  };

  const back = () => setDraft({ ...draft, step: Math.max(1, draft.step - 1) });

  const handleSubmit = async () => {
    setError("");
    if (!API_URL) return setError("NEXT_PUBLIC_API_URL is not set.");

    try {
      setSubmitting(true);

      // compose phone numbers with +251
      const primaryPhone = withPrefix("+251", draft.step1.user_phone);
      const whatsappPhone = withPrefix("+251", draft.step2.whatsapp);
      const emergencyPhone = withPrefix("+251", draft.step2.emergency_contact_phone);

      // preferred language (respect "Other")
      const preferredLanguage =
        draft.step2.preferred_language === "Other"
          ? (draft.step2.preferred_language_other || "Other")
          : (draft.step2.preferred_language || "English");

      // 1) Create Diaspora (with nested user)
      const payload: any = {
        user: {
          email: draft.step1.user_email,
          username: draft.step1.user_email,
          first_name: draft.step1.user_first_name,
          last_name: draft.step1.user_last_name,
        },
        primary_phone: primaryPhone,
        gender: draft.step1.user_gender || undefined,
        dob: draft.step1.user_dob || undefined,

        whatsapp: whatsappPhone || undefined,
        country_of_residence: draft.step2.country_of_residence || undefined,
        city_of_residence: draft.step2.city_of_residence || undefined,
        arrival_date: draft.step2.arrival_date || undefined,
        expected_stay_duration: draft.step2.expected_stay_duration || undefined,
        is_returnee: !!draft.step2.is_returnee,
        preferred_language: preferredLanguage,
        communication_opt_in: draft.step2.communication_opt_in ?? true,
        address_local: draft.step2.address_local || undefined,
        emergency_contact_name: draft.step2.emergency_contact_name || undefined,
        emergency_contact_phone: emergencyPhone || undefined,
        passport_no: draft.step2.passport_no || undefined,
        id_number: draft.step2.id_number || undefined,
      };

      const res = await fetch(`${API_URL}/diasporas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.text()) || `Failed to create diaspora: ${res.status}`);
      const created = await res.json();

      // 2) Optional: create purpose
      if (draft.step3.type) {
        const pBody: any = {
          diaspora: created.id,
          type: draft.step3.type,
          description: draft.step3.description || "",
          sector: draft.step3.sector || undefined,
          sub_sector: draft.step3.sub_sector || undefined,
          investment_type: draft.step3.investment_type || undefined,
          estimated_capital: draft.step3.estimated_capital ?? undefined,
          currency: draft.step3.currency || undefined,
          jobs_expected: draft.step3.jobs_expected ?? undefined,
          land_requirement: !!draft.step3.land_requirement,
          land_size: draft.step3.land_size ?? undefined,
          preferred_location_note: draft.step3.preferred_location_note || undefined,
          status: "SUBMITTED",
        };
        const pr = await fetch(`${API_URL}/purposes/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(pBody),
        });
        if (!pr.ok) throw new Error((await pr.text()) || `Failed to create purpose: ${pr.status}`);
      }

      clear();
      router.replace(`/diasporas/${created.id}/view`);
    } catch (e: any) {
      setError(e?.message || "Failed to submit registration");
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: open confirm instead of immediate submit
  const openConfirm = () => {
    setError("");
    setConfirmOpen(true);
  };

  return (
    <>
      <Breadcrumb pageName="Register Diaspora" />
      <div className={cn("rounded-[14px] bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-gray-dark")}>
        <Stepper step={draft.step} />

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700 dark:border-red-800/40 dark:bg-red-900/30 dark:text-red-100">
            {error}
          </div>
        )}

        {draft.step === 1 && <Step1Basic draft={draft} setDraft={setDraft} />}
        {draft.step === 2 && <Step2Details draft={draft} setDraft={setDraft} />}
        {draft.step === 3 && <Step3Purpose draft={draft} setDraft={setDraft} />}
        {draft.step === 4 && <Step4Review draft={draft} />}

        {/* Pass openConfirm instead of handleSubmit */}
        <StepNav step={draft.step} onBack={back} onNext={next} onSubmit={openConfirm} submitting={submitting} />
      </div>

      {/* Confirmation Modal */}
      <AnimatedModal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title="Submit Registration?"
        disableBackdropClose={submitting}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Once submitted, this registration will be saved and routed for processing.
            You can still add a Purpose later if you skip it now.
          </p>

        {/* Small recap line (optional) */}
          <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-dark-2">
            <div><span className="font-medium">Name:</span> {draft.step2.full_name || "—"}</div>
            <div><span className="font-medium">Email:</span> {draft.step1.user_email}</div>
            <div><span className="font-medium">Phone:</span> +251 {String(draft.step1.user_phone || "").replace(/^\+?251/, "")}</div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-2"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-70"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Yes, submit"}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </>
  );
}
