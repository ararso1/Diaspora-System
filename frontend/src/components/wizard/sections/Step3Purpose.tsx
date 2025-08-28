"use client";

import { LabeledInput, Field } from "../Field";
import type { DraftState, PurposeType } from "@/types/diaspora";
import { useMemo } from "react";

const SECTORS = {
  "Agriculture & Agro-Processing": [
    "Agro-processing & value addition",
    "Agri-tech & irrigation solutions",
  ],
  "Manufacturing & Industry": [
    "Textiles & garment production",
    "Construction materials",
  ],
} as const;

const INVESTMENT_TYPES = ["new company", "JV", "expansion"];
const CURRENCIES = ["USD", "ETB", "EUR"];

export default function Step3Purpose({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: (d: DraftState) => void;
}) {
  const s3 = draft.step3;

  const subsectors = useMemo(() => {
    if (!s3.sector) return [];
    return SECTORS[s3.sector as keyof typeof SECTORS] ?? [];
  }, [s3.sector]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Purpose type">
        <select
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          value={s3.type || ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              step3: { ...s3, type: (e.target.value || undefined) as PurposeType },
            })
          }
        >
          <option value="">Select</option>
          <option value="INVESTMENT">Investment</option>
          <option value="TOURISM">Tourism</option>
          <option value="FAMILY">Family</option>
          <option value="STUDY">Study</option>
          <option value="CHARITY_NGO">Charity/NGO</option>
          <option value="OTHER">Other</option>
        </select>
      </Field>

      {/* Purpose description → textarea */}
      <Field label="Purpose description">
        <textarea
          className="w-full min-h-[96px] rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          placeholder="Describe the purpose…"
          value={s3.description || ""}
          onChange={(e) =>
            setDraft({ ...draft, step3: { ...s3, description: e.target.value } })
          }
        />
      </Field>

      <Field label="Sector">
        <select
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          value={s3.sector || ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              step3: { ...s3, sector: e.target.value || "", sub_sector: "" }, // reset sub-sector
            })
          }
        >
          <option value="">Select sector</option>
          {Object.keys(SECTORS).map((sec) => (
            <option key={sec} value={sec}>
              {sec}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sub-sector">
        <select
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          value={s3.sub_sector || ""}
          onChange={(e) =>
            setDraft({ ...draft, step3: { ...s3, sub_sector: e.target.value || "" } })
          }
          disabled={!s3.sector}
        >
          <option value="">{s3.sector ? "Select sub-sector" : "Select a sector first"}</option>
          {subsectors.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Investment type">
        <select
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          value={s3.investment_type || ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              step3: { ...s3, investment_type: e.target.value || "" },
            })
          }
        >
          <option value="">Select type</option>
          {INVESTMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <LabeledInput
        label="Estimated capital"
        type="number"
        value={s3.estimated_capital ?? ""}
        onChange={(v) =>
          setDraft({
            ...draft,
            step3: { ...s3, estimated_capital: v ? Number(v) : null },
          })
        }
      />

      <Field label="Currency">
        <select
          className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
          value={s3.currency || ""}
          onChange={(e) => setDraft({ ...draft, step3: { ...s3, currency: e.target.value || "" } })}
        >
          <option value="">Select currency</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <LabeledInput
        label="Expected jobs"
        type="number"
        value={s3.jobs_expected ?? ""}
        onChange={(v) =>
          setDraft({
            ...draft,
            step3: { ...s3, jobs_expected: v ? Number(v) : null },
          })
        }
      />

      <Field label="Land requirement">
        <input
          type="checkbox"
          checked={!!s3.land_requirement}
          onChange={(e) =>
            setDraft({ ...draft, step3: { ...s3, land_requirement: e.target.checked } })
          }
        />
      </Field>

      {s3.land_requirement && (
        <LabeledInput
          label="Land size (m²)"
          type="number"
          value={s3.land_size ?? ""}
          onChange={(v) =>
            setDraft({ ...draft, step3: { ...s3, land_size: v ? Number(v) : null } })
          }
        />
      )}

      <LabeledInput
        label="Preferred location note"
        value={s3.preferred_location_note || ""}
        onChange={(v) =>
          setDraft({ ...draft, step3: { ...s3, preferred_location_note: v } })
        }
      />
    </div>
  );
}
