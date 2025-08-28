// components/wizard/Stepper.tsx
"use client";

import { cn } from "@/lib/utils";

const STEPS = ["Basic Info", "Additional Details", "Purpose", "Review & Submit"];

export default function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-[1px]">
        <div className="rounded-xl bg-white p-4 dark:bg-gray-dark">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((label, i) => {
              const idx = i + 1;
              const active = step === idx;
              const done = step > idx;
              return (
                <div key={label} className="flex flex-1 items-center">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition",
                      done && "bg-green-600 text-white border-green-600 shadow",
                      active && "bg-blue-600 text-white border-blue-600 shadow",
                      !active && !done && "bg-white text-gray-700 border-gray-300 dark:bg-dark-2"
                    )}
                  >
                    {idx}
                  </div>
                  <div className={cn("ml-3 text-sm font-medium", active ? "text-blue-700" : "text-gray-700")}>
                    {label}
                  </div>
                  {idx < STEPS.length && (
                    <div className={cn("mx-3 h-[2px] flex-1 rounded", step > idx ? "bg-green-500" : "bg-gray-200")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
