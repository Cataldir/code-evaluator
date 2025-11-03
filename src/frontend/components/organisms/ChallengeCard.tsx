"use client";

import Link from "next/link";
import { Github } from "lucide-react";

import { Button } from "@/components/atoms/Button";
import type { Challenge } from "@/types/challenge";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  challenge: Challenge;
  onAddCriteria: (challenge: Challenge) => void;
  onToggleActive: (challenge: Challenge, nextActive: boolean) => void | Promise<void>;
  isToggling?: boolean;
  repositoriesHref: string;
};

export function ChallengeCard({ challenge, onAddCriteria, repositoriesHref, onToggleActive, isToggling }: Props) {
  const { t } = useI18n();
  const statusLabel = challenge.active ? t("challengeCard.status.active") : t("challengeCard.status.inactive");
  const statusStyles = challenge.active
    ? "bg-neonBlue/20 text-neonBlue"
    : "bg-neonPink/20 text-neonPink";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-neonBlue/40 bg-night/70 p-6 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-neonBlue">{challenge.name}</h2>
          <p className="text-sm text-neonPink/75">{challenge.description}</p>
          <p className="text-xs uppercase tracking-widest text-neonPink/60">{t("challengeCard.expectedResult")}</p>
          <p className="text-sm text-neonPink/85">{challenge.expected_outcome}</p>
          <div className="flex items-center gap-4 pt-1">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}>{statusLabel}</span>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-neonPink/70">
              <span className="sr-only">{t("challengeCard.toggleLabel")}</span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={challenge.active}
                disabled={isToggling}
                onChange={(event) => onToggleActive(challenge, event.target.checked)}
              />
              <span className="flex h-5 w-10 items-center rounded-full bg-neonPink/30 transition peer-checked:bg-neonBlue/60 peer-disabled:opacity-40">
                <span className="ml-1 h-4 w-4 rounded-full bg-night transition peer-checked:translate-x-5 peer-checked:bg-neonBlue"></span>
              </span>
              <span className="text-xs text-neonPink/60">{challenge.active ? t("challengeCard.deactivate") : t("challengeCard.activate")}</span>
            </label>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Link
            href={repositoriesHref}
            className="flex items-center gap-2 rounded-full border border-neonBlue/40 px-4 py-2 text-sm font-semibold text-neonBlue transition hover:border-neonPink hover:text-neonPink"
          >
            <Github className="h-5 w-5" />
            {t("challengeCard.viewRepos")}
          </Link>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-neonBlue">{t("challengeCard.criteria")}</h3>
          <Button variant="secondary" onClick={() => onAddCriteria(challenge)}>
            {t("challengeCard.addCriteria")}
          </Button>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {challenge.criteria.map((criterion) => (
            <li key={criterion.id} className="rounded-xl border border-neonBlue/30 bg-night/80 p-4">
              <p className="font-semibold text-neonPink">{criterion.name}</p>
              <p className="mt-1 text-xs text-neonPink/65">{criterion.description}</p>
              <p className="mt-2 text-xs text-neonBlue/70">
                {t("challengeCard.multiplier")}: <span className="font-semibold">{criterion.score_multiplier}</span>
              </p>
              <p className="text-xs text-neonBlue/70">{t("challengeCard.concept")}: {criterion.code_concept}</p>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
