"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Select";
import type { Challenge } from "@/types/challenge";
import { api } from "@/utils/api";

export default function HomePage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const data = await api.listChallenges();
        setChallenges(data);
        if (data.length && !selectedId) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load challenges. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, [selectedId]);

  const selectedChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === selectedId) ?? null,
    [challenges, selectedId],
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-16">
      <section className="space-y-6">
        <h1 className="flex items-center gap-3 text-4xl font-bold text-neonBlue md:text-5xl">
          <Sparkles className="h-10 w-10 text-neonPink" />
          FIAP Next Challenge
        </h1>
        <p className="max-w-3xl text-lg text-neonPink/80">
          Welcome to the live code quality arena. Configure your challenge criteria, onboard GitHub repositories,
          and watch the ranking update as evaluations roll in. Choose a challenge below to explore its rules.
        </p>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neonBlue">Select a challenge</label>
            <Select
              options={challenges.map((challenge) => ({ label: challenge.name, value: challenge.id }))}
              value={selectedId}
              placeholder={challenges.length ? "Pick a challenge" : "No challenges found"}
              onChange={setSelectedId}
            />
          </div>
          <div className="rounded-2xl border border-neonBlue/40 bg-night/80 p-6 shadow-glow">
            {isLoading ? (
              <p className="text-neonPink/70">Loading rules...</p>
            ) : error ? (
              <p className="text-neonRed">{error}</p>
            ) : selectedChallenge ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-neonPink">{selectedChallenge.name}</h2>
                  <p className="mt-1 text-sm text-neonPink/70">{selectedChallenge.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-neonBlue">Expected Outcome</h3>
                  <p className="mt-1 text-sm text-neonPink/80">{selectedChallenge.expected_outcome}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-neonBlue">Evaluation Criteria</h3>
                  <ul className="mt-3 grid gap-3 text-sm">
                    {selectedChallenge.criteria.map((criterion) => (
                      <li key={criterion.id} className="rounded-xl border border-neonBlue/25 bg-night/60 p-4">
                        <p className="font-semibold text-neonPink">{criterion.name}</p>
                        <p className="text-xs text-neonPink/65">{criterion.description}</p>
                        <p className="mt-2 text-xs text-neonBlue/70">
                          Score multiplier: <span className="font-semibold">{criterion.score_multiplier}</span> · Concept: {" "}
                          <span className="font-semibold">{criterion.code_concept}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-neonPink/70">
                <p>No challenge selected yet.</p>
                <Button variant="secondary" onClick={() => setSelectedId(challenges[0]?.id ?? "")}>
                  Pick first available challenge
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
