"use client";

import clsx from "clsx";
import { useMemo } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { EvaluationState } from "@/types/evaluation";

const LABEL_KEYS: Record<EvaluationState, { key: string; fallback: string }> = {
  not_evaluated: { key: "common.evaluationState.notEvaluated", fallback: "Not evaluated" },
  under_evaluation: { key: "common.evaluationState.underEvaluation", fallback: "Under evaluation" },
  evaluated: { key: "common.evaluationState.evaluated", fallback: "Evaluated" },
};

export function StatusBadge({ state }: { state: EvaluationState }) {
  const { t } = useI18n();
  const label = useMemo(() => {
    const { key, fallback } = LABEL_KEYS[state];
    return t(key, { fallback });
  }, [state, t]);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        state === "evaluated" && "bg-neonBlue/20 text-neonBlue",
        state === "under_evaluation" && "bg-neonRed/20 text-neonRed",
        state === "not_evaluated" && "bg-neonPurple/20 text-neonPurple",
      )}
    >
      {label}
    </span>
  );
}
