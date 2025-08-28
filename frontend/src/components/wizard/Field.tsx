// components/wizard/Field.tsx
"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Field({
  label,
  required,
  children,
  hint,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// Optional shortcut if you just need a labeled input
export function LabeledInput(props: {
  label: string; required?: boolean; value: string | number | undefined;
  onChange: (v: string) => void; placeholder?: string; type?: string; className?: string; hint?: string;
}) {
  const { label, required, value, onChange, placeholder, type = "text", className, hint } = props;
  return (
    <Field label={label} required={required} hint={hint} className={className}>
      <Input placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} type={type} />
    </Field>
  );
}
