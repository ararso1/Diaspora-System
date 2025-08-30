// hooks/useLocalDraft.ts
"use client";

import { useEffect, useState } from "react";
import type { DraftState } from "@/types/diaspora";

const DRAFT_KEY = "diaspora_draft";

export const emptyDraft: DraftState = {
  step: 1,
  step1: {
    user_first_name: "",
    user_last_name: "",
    user_email: "",
    user_phone: "",
    user_gender: undefined,
    user_citizenship: "",
    user_dob: "",
  },
  step2: {
    full_name: "",
    whatsapp: "",
    country_of_residence: "",
    city_of_residence: "",
    arrival_date: "",
    expected_stay_duration: "",
    is_returnee: false,
    preferred_language: "English",
    preferred_language_other: "",
    communication_opt_in: true,
    address_local: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    passport_no: "",
    id_number: "",
    passport_scan: null,
    id_scan: null,
  },
  step3: {
    type: undefined,
    description: "",
    sector: "",
    sub_sector: "",
    investment_type: "",
    estimated_capital: null,
    currency: "ETB",
    jobs_expected: null,
    land_requirement: false,
    land_size: null,
    preferred_location_note: "",
  },
};

export function useLocalDraft() {
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraft({ ...emptyDraft, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const persist = (data: DraftState) => {
    setDraft(data);
    try {
      const copy: any = { ...data };
      copy.step2 = { ...copy.step2, passport_scan: undefined, id_scan: undefined };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(copy));
    } catch {}
  };

  const clear = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setDraft(emptyDraft);
  };

  return { draft, setDraft: persist, clear };
}
