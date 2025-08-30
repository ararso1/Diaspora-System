"use client";

import { Input } from "@/components/ui/input";

const COUNTRY_CODES = [
  { code: "+251", label: "Ethiopia" },
  { code: "+1", label: "USA/Canada" },
  { code: "+44", label: "UK" },
  { code: "+49", label: "Germany" },
  { code: "+91", label: "India" },
  { code: "+971", label: "UAE" },
  { code: "+254", label: "Kenya" },
  { code: "+255", label: "Tanzania" },
  { code: "+20", label: "Egypt" },
  // 👉 add more as needed
];

export default function PhoneInput({
  value,
  onChange,
  prefix = "+251", // default Ethiopia
  onPrefixChange,
  labelVisuallyHidden = false,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  onPrefixChange?: (v: string) => void;
  labelVisuallyHidden?: boolean;
}) {
  return (
    <div className="flex rounded-md shadow-sm ring-1 ring-gray-300 focus-within:ring-2 focus-within:ring-blue-600 dark:ring-gray-700 overflow-hidden">
      {/* Country code dropdown */}
      <select
        className="px-2 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-dark-2 border-r border-gray-200 dark:border-gray-700 focus:outline-none"
        value={prefix}
        onChange={(e) => onPrefixChange?.(e.target.value)}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label} ({c.code})
          </option>
        ))}
      </select>

      {/* Phone input */}
      <Input
        className="flex-1 rounded-none border-0 focus-visible:ring-0"
        placeholder="9XXXXXXXX"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="tel"
      />
    </div>
  );
}
