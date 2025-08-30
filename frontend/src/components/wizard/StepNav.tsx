// components/wizard/StepNav.tsx
"use client";

import { Button } from "@/components/ui/button";

export default function StepNav({
  step,
  onBack,
  onNext,
  onSubmit,
  submitting,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-gray-500">Progress: Step {step} of 4</div>
      <div className="flex gap-2">
        {step > 1 && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        {step < 4 && (
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={onNext}>
            Next
          </Button>
        )}
        {step === 4 && (
          <Button className="bg-green-600 text-white hover:bg-green-700" onClick={onSubmit} disabled={!!submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}

