"use client";

import { LabeledInput, Field } from "../Field";
import CountrySelect from "../inputs/CountrySelect";
import PhoneInput from "../inputs/PhoneInput";
import type { DraftState, Gender } from "@/types/diaspora";

export default function Step1Basic({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: (d: DraftState) => void;
}) {
  const s1 = draft.step1;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <LabeledInput
        label="First name"
        required
        value={s1.user_first_name}
        onChange={(v) => setDraft({ ...draft, step1: { ...s1, user_first_name: v } })}
      />
      <LabeledInput
        label="Last name"
        required
        value={s1.user_last_name}
        onChange={(v) => setDraft({ ...draft, step1: { ...s1, user_last_name: v } })}
      />

      <LabeledInput
        label="Email"
        required
        type="email"
        value={s1.user_email}
        onChange={(v) => setDraft({ ...draft, step1: { ...s1, user_email: v } })}
      />

      <Field label="Phone number" required>
        <PhoneInput
          value={s1.user_phone}
          onChange={(v) => setDraft({ ...draft, step1: { ...s1, user_phone: v } })}
          prefix="+251"
        />
      </Field>

      <Field label="Gender">
        <select
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          value={s1.user_gender || ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              step1: { ...s1, user_gender: (e.target.value || undefined) as Gender },
            })
          }
        >
          <option value="">Select</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </Field>

      <Field label="Citizenship">
        <CountrySelect
          value={s1.user_citizenship || "Ethiopia"}
          onChange={(v) => setDraft({ ...draft, step1: { ...s1, user_citizenship: v } })}
          defaultToEthiopia
        />
      </Field>

      <Field label="Date of birth">
        <input
          type="date"
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          value={s1.user_dob || ""}
          onChange={(e) => setDraft({ ...draft, step1: { ...s1, user_dob: e.target.value } })}
        />
      </Field>
    </div>
  );
}
