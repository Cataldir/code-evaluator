"use client";

import clsx from "clsx";
import { EvaluationState } from "@/types/evaluation";

const LABELS: Record<EvaluationState, string> = {
  not_evaluated: "Not evaluated",
  under_evaluation: "Under evaluation",
  evaluated: "Evaluated",
};

export function StatusBadge({ state }: { state: EvaluationState }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        state === "evaluated" && "bg-neonBlue/20 text-neonBlue",
        state === "under_evaluation" && "bg-neonRed/20 text-neonRed",
        state === "not_evaluated" && "bg-neonPurple/20 text-neonPurple",
      )}
    >
      {LABELS[state]}
    </span>
  );
}
