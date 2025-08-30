"use client";

const COUNTRIES = [
  "Ethiopia",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Saudi Arabia",
  "Kenya",
  "Germany",
  "Canada",
  "Australia",
  "India",
  "China",
  "Turkey",
  "South Africa",
  "France",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Qatar",
];

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select country",
  defaultToEthiopia = true,
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  defaultToEthiopia?: boolean;
}) {
  const val = value ?? (defaultToEthiopia ? "Ethiopia" : "");
  return (
    <select
      className="w-full rounded border border-gray-300 p-2 dark:border-dark-3 dark:bg-dark-2"
      value={val}
      onChange={(e) => onChange(e.target.value)}
    >
      {!val && <option value="">{placeholder}</option>}
      {COUNTRIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
