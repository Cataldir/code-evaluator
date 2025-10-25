"use client";

import Link from "next/link";
import { Github } from "lucide-react";

import { Button } from "@/components/atoms/Button";
import type { Challenge } from "@/types/challenge";

type Props = {
  challenge: Challenge;
  onAddCriteria: (challenge: Challenge) => void;
  repositoriesHref: string;
};

export function ChallengeCard({ challenge, onAddCriteria, repositoriesHref }: Props) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-neonBlue/40 bg-night/70 p-6 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-neonBlue">{challenge.name}</h2>
          <p className="text-sm text-neonPink/75">{challenge.description}</p>
          <p className="text-xs uppercase tracking-widest text-neonPink/60">Expected Result</p>
          <p className="text-sm text-neonPink/85">{challenge.expected_outcome}</p>
        </div>
        <Link
          href={repositoriesHref}
          className="flex items-center gap-2 rounded-full border border-neonBlue/40 px-4 py-2 text-sm font-semibold text-neonBlue transition hover:border-neonPink hover:text-neonPink"
        >
          <Github className="h-5 w-5" />
          View repos
        </Link>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-neonBlue">Criteria</h3>
          <Button variant="secondary" onClick={() => onAddCriteria(challenge)}>
            Add criteria
          </Button>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {challenge.criteria.map((criterion) => (
            <li key={criterion.id} className="rounded-xl border border-neonBlue/30 bg-night/80 p-4">
              <p className="font-semibold text-neonPink">{criterion.name}</p>
              <p className="mt-1 text-xs text-neonPink/65">{criterion.description}</p>
              <p className="mt-2 text-xs text-neonBlue/70">
                Multiplier: <span className="font-semibold">{criterion.score_multiplier}</span>
              </p>
              <p className="text-xs text-neonBlue/70">Concept: {criterion.code_concept}</p>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
