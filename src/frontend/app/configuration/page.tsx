"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";
import { Modal } from "@/components/molecules/Modal";
import { ChallengeCard } from "@/components/organisms/ChallengeCard";
import type { Challenge } from "@/types/challenge";
import { api } from "@/utils/api";

type CriterionDraft = {
  name: string;
  description: string;
  score_multiplier: number;
  code_concept: string;
};

type ChallengeFormState = {
  name: string;
  description: string;
  expected_outcome: string;
  criteria: CriterionDraft[];
};

const createEmptyCriterion = (): CriterionDraft => ({
  name: "",
  description: "",
  score_multiplier: 1,
  code_concept: "",
});

export default function ConfigurationPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [criteriaDraft, setCriteriaDraft] = useState<CriterionDraft>(createEmptyCriterion());
  const [challengeForm, setChallengeForm] = useState<ChallengeFormState>({
    name: "",
    description: "",
    expected_outcome: "",
    criteria: [createEmptyCriterion()],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .listChallenges()
      .then(setChallenges)
      .catch((err) => console.error(err));
  }, []);

  const resetChallengeForm = () => {
    setChallengeForm({
      name: "",
      description: "",
      expected_outcome: "",
      criteria: [createEmptyCriterion()],
    });
  };

  const handleAddChallengeCriterionField = () => {
    setChallengeForm((prev: ChallengeFormState) => ({
      ...prev,
      criteria: [...prev.criteria, createEmptyCriterion()],
    }));
  };

  const handleChallengeCriterionChange = (
    index: number,
    field: keyof CriterionDraft,
    value: string,
  ) => {
    setChallengeForm((prev: ChallengeFormState) => {
      const nextCriteria = prev.criteria.map((criterion, idx) => {
        if (idx !== index) {
          return criterion;
        }
        if (field === "score_multiplier") {
          return { ...criterion, [field]: Number(value) };
        }
        return { ...criterion, [field]: value };
      });
      return { ...prev, criteria: nextCriteria };
    });
  };

  const handleCreateChallenge = async () => {
    if (!challengeForm.name.trim()) {
      return;
    }
    setLoading(true);
    try {
      const created = await api.createChallenge({
        name: challengeForm.name,
        description: challengeForm.description,
        expected_outcome: challengeForm.expected_outcome,
        criteria: challengeForm.criteria.filter((criterion: CriterionDraft) => criterion.name.trim()),
      });
      setChallenges((prev: Challenge[]) => [...prev, created]);
      setIsChallengeModalOpen(false);
      resetChallengeForm();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCriteriaModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setCriteriaDraft(createEmptyCriterion());
    setIsCriteriaModalOpen(true);
  };

  const handleAddCriteria = async () => {
    if (!selectedChallenge) {
      return;
    }
    if (!criteriaDraft.name.trim()) {
      return;
    }
    setLoading(true);
    try {
      const created = await api.addCriteria({
        challenge_id: selectedChallenge.id,
        ...criteriaDraft,
      });
      setChallenges((prev: Challenge[]) =>
        prev.map((challenge: Challenge) =>
          challenge.id === selectedChallenge.id
            ? { ...challenge, criteria: [...challenge.criteria, created] }
            : challenge,
        ),
      );
      setIsCriteriaModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold text-neonBlue">Configure your challenge</h1>
          <p className="mt-2 max-w-2xl text-sm text-neonPink/80">
            Create challenge definitions, add evaluation criteria, and route repositories for the live scoreboard.
          </p>
        </div>
        <Button className="self-start" onClick={() => setIsChallengeModalOpen(true)}>
          Create challenge
        </Button>
      </header>

      <section className="grid gap-6">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onAddCriteria={handleOpenCriteriaModal}
            repositoriesHref={`/configuration/${challenge.id}/repositories`}
          />
        ))}
        {!challenges.length && (
          <p className="rounded-xl border border-dashed border-neonBlue/40 p-8 text-center text-neonPink/70">
            No challenges yet. Create one to get started.
          </p>
        )}
      </section>

      <Modal
        title="Create new challenge"
        description="Set the foundation and list criteria that each repository must satisfy."
        isOpen={isChallengeModalOpen}
        onClose={() => {
          setIsChallengeModalOpen(false);
          resetChallengeForm();
        }}
        primaryActionLabel="Create"
        onPrimaryAction={handleCreateChallenge}
        isPrimaryDisabled={loading}
      >
        <div className="space-y-4">
          <Input
            placeholder="Challenge name"
            value={challengeForm.name}
            onChange={(event) => setChallengeForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextArea
            placeholder="Describe the core objective"
            value={challengeForm.description}
            rows={3}
            onChange={(event) => setChallengeForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <TextArea
            placeholder="Explain the expected outcome"
            value={challengeForm.expected_outcome}
            rows={3}
            onChange={(event) => setChallengeForm((prev) => ({ ...prev, expected_outcome: event.target.value }))}
          />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neonBlue">Evaluation criteria</h3>
            {challengeForm.criteria.map((criterion, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-neonBlue/40 p-4">
                <Input
                  placeholder="Criteria name"
                  value={criterion.name}
                  onChange={(event) => handleChallengeCriterionChange(index, "name", event.target.value)}
                />
                <TextArea
                  placeholder="What should be evaluated?"
                  value={criterion.description}
                  rows={2}
                  onChange={(event) => handleChallengeCriterionChange(index, "description", event.target.value)}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Score multiplier"
                    value={criterion.score_multiplier}
                    onChange={(event) => handleChallengeCriterionChange(index, "score_multiplier", event.target.value)}
                  />
                  <Input
                    placeholder="Code concept"
                    value={criterion.code_concept}
                    onChange={(event) => handleChallengeCriterionChange(index, "code_concept", event.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button variant="ghost" onClick={handleAddChallengeCriterionField}>
              Add another criterion
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={`Add criteria to ${selectedChallenge?.name ?? "challenge"}`}
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        primaryActionLabel="Add criteria"
        onPrimaryAction={handleAddCriteria}
        isPrimaryDisabled={loading}
      >
        <Input
          placeholder="Criteria name"
          value={criteriaDraft.name}
          onChange={(event) => setCriteriaDraft((prev) => ({ ...prev, name: event.target.value }))}
        />
        <TextArea
          placeholder="Describe what success looks like for this criteria"
          value={criteriaDraft.description}
          rows={3}
          onChange={(event) => setCriteriaDraft((prev) => ({ ...prev, description: event.target.value }))}
        />
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
          <Input
            type="number"
            min="0.1"
            step="0.1"
            placeholder="Score multiplier"
            value={criteriaDraft.score_multiplier}
            onChange={(event) =>
              setCriteriaDraft((prev) => ({ ...prev, score_multiplier: Number(event.target.value) }))
            }
          />
          <Input
            placeholder="Code concept"
            value={criteriaDraft.code_concept}
            onChange={(event) => setCriteriaDraft((prev) => ({ ...prev, code_concept: event.target.value }))}
          />
        </div>
      </Modal>
    </main>
  );
}
