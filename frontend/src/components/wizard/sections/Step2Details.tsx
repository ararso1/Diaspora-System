"use client";

import { LabeledInput, Field } from "../Field";
import CountrySelect from "../inputs/CountrySelect";
import PhoneInput from "../inputs/PhoneInput";
import type { DraftState } from "@/types/diaspora";

const LANGS = ["English", "Amharic", "Oromic", "Harari", "Arabic", "Other"];

export default function Step2Details({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: (d: DraftState) => void;
}) {
  const s2 = draft.step2;

  const onLangChange = (v: string) => {
    setDraft({
      ...draft,
      step2: {
        ...s2,
        preferred_language: v,
        // clear other field if not 'Other'
        preferred_language_other: v === "Other" ? s2.preferred_language_other || "" : "",
      },
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <LabeledInput label="Full name (auto)" value={s2.full_name} onChange={() => {}} />

      <Field label="WhatsApp">
        <PhoneInput
          value={s2.whatsapp || ""}
          onChange={(v) => setDraft({ ...draft, step2: { ...s2, whatsapp: v } })}
          prefix="+251"
        />
      </Field>

      <Field label="Country of residence">
        <CountrySelect
          value={s2.country_of_residence || "Ethiopia"}
          onChange={(v) => setDraft({ ...draft, step2: { ...s2, country_of_residence: v } })}
          defaultToEthiopia
        />
      </Field>

      <LabeledInput
        label="City of residence"
        value={s2.city_of_residence || ""}
        onChange={(v) => setDraft({ ...draft, step2: { ...s2, city_of_residence: v } })}
      />

      <Field label="Arrival date">
        <input
          type="date"
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-2 dark:bg-dark-2"
          value={s2.arrival_date || ""}
          onChange={(e) => setDraft({ ...draft, step2: { ...s2, arrival_date: e.target.value } })}
        />
      </Field>

      <LabeledInput
        label="Expected stay duration"
        value={s2.expected_stay_duration || ""}
        onChange={(v) => setDraft({ ...draft, step2: { ...s2, expected_stay_duration: v } })}
      />

      <Field label="Returnee">
        <div className="flex items-center gap-2">
          <input
            id="is_returnee"
            type="checkbox"
            checked={!!s2.is_returnee}
            onChange={(e) =>
              setDraft({ ...draft, step2: { ...s2, is_returnee: e.target.checked } })
            }
          />
          <label htmlFor="is_returnee" className="text-sm">
            Yes
          </label>
        </div>
      </Field>

      <Field label="Preferred language">
        <select
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          value={s2.preferred_language || "English"}
          onChange={(e) => onLangChange(e.target.value)}
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </Field>

      {s2.preferred_language === "Other" && (
        <LabeledInput
          label="Specify language"
          value={s2.preferred_language_other || ""}
          onChange={(v) =>
            setDraft({ ...draft, step2: { ...s2, preferred_language_other: v } })
          }
        />
      )}

      <Field label="Allow communications">
        <input
          type="checkbox"
          checked={s2.communication_opt_in ?? true}
          onChange={(e) =>
            setDraft({
              ...draft,
              step2: { ...s2, communication_opt_in: e.target.checked },
            })
          }
        />
      </Field>

      <LabeledInput
        label="Local address"
        value={s2.address_local || ""}
        onChange={(v) => setDraft({ ...draft, step2: { ...s2, address_local: v } })}
      />
      <LabeledInput
        label="Emergency contact name"
        value={s2.emergency_contact_name || ""}
        onChange={(v) =>
          setDraft({ ...draft, step2: { ...s2, emergency_contact_name: v } })
        }
      />
      <Field label="Emergency contact phone">
        <PhoneInput
          value={s2.emergency_contact_phone || ""}
          onChange={(v) =>
            setDraft({ ...draft, step2: { ...s2, emergency_contact_phone: v } })
          }
          prefix="+251"
        />
      </Field>

      <LabeledInput
        label="Passport number"
        value={s2.passport_no || ""}
        onChange={(v) => setDraft({ ...draft, step2: { ...s2, passport_no: v } })}
      />
      <LabeledInput
        label="ID number"
        value={s2.id_number || ""}
        onChange={(v) => setDraft({ ...draft, step2: { ...s2, id_number: v } })}
      />

      <div className="col-span-1 md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Passport scan (optional)">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) =>
              setDraft({
                ...draft,
                step2: { ...s2, passport_scan: e.target.files?.[0] || null },
              })
            }
          />
        </Field>
        <Field label="ID scan (optional)">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) =>
              setDraft({
                ...draft,
                step2: { ...s2, id_scan: e.target.files?.[0] || null },
              })
            }
          />
        </Field>
      </div>
    </div>
  );
}
