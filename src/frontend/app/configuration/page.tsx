"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";
import { Modal } from "@/components/molecules/Modal";
import { ChallengeCard } from "@/components/organisms/ChallengeCard";
import type { Challenge } from "@/types/challenge";
import { api } from "@/utils/api";
import { useI18n } from "@/i18n/I18nProvider";

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
  active: boolean;
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
    criteria: [],
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [togglingChallengeId, setTogglingChallengeId] = useState<string | null>(null);
  const [isDraftCriteriaModalOpen, setIsDraftCriteriaModalOpen] = useState(false);
  const [draftCriteriaIndex, setDraftCriteriaIndex] = useState<number | null>(null);
  const [draftCriteriaForm, setDraftCriteriaForm] = useState<CriterionDraft>(createEmptyCriterion());
  const [shouldResumeChallengeModal, setShouldResumeChallengeModal] = useState(false);
  const { t } = useI18n();

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
      criteria: [],
      active: true,
    });
  };

  const openDraftModalWithState = (nextIndex: number | null, nextForm: CriterionDraft) => {
    setDraftCriteriaIndex(nextIndex);
    setDraftCriteriaForm(nextForm);
    const shouldResume = isChallengeModalOpen;
    setShouldResumeChallengeModal(shouldResume);
    if (shouldResume) {
      setIsChallengeModalOpen(false);
    }
    setIsDraftCriteriaModalOpen(true);
  };

  const openNewDraftCriterion = () => {
    openDraftModalWithState(null, createEmptyCriterion());
  };

  const openDraftCriterion = (index: number) => {
    openDraftModalWithState(index, { ...challengeForm.criteria[index] });
  };

  const closeDraftCriteriaModal = () => {
    setIsDraftCriteriaModalOpen(false);
    setDraftCriteriaIndex(null);
    setDraftCriteriaForm(createEmptyCriterion());
    if (shouldResumeChallengeModal) {
      setIsChallengeModalOpen(true);
      setShouldResumeChallengeModal(false);
    }
  };

  const handleSaveDraftCriterion = () => {
    if (!draftCriteriaForm.name.trim()) {
      return;
    }

    setChallengeForm((prev: ChallengeFormState) => {
      const nextCriteria = [...prev.criteria];
      if (draftCriteriaIndex === null) {
        nextCriteria.push({ ...draftCriteriaForm });
      } else {
        nextCriteria[draftCriteriaIndex] = { ...draftCriteriaForm };
      }
      return { ...prev, criteria: nextCriteria };
    });
    closeDraftCriteriaModal();
  };

  const removeDraftCriterionAtIndex = (index: number) => {
    setChallengeForm((prev: ChallengeFormState) => ({
      ...prev,
      criteria: prev.criteria.filter((_, idx) => idx !== index),
    }));
  };

  const handleDeleteDraftCriterion = () => {
    if (draftCriteriaIndex === null) {
      closeDraftCriteriaModal();
      return;
    }

    removeDraftCriterionAtIndex(draftCriteriaIndex);
    closeDraftCriteriaModal();
  };

  const handleCloseChallengeModal = () => {
    setShouldResumeChallengeModal(false);
    setIsDraftCriteriaModalOpen(false);
    setDraftCriteriaIndex(null);
    setDraftCriteriaForm(createEmptyCriterion());
    setIsChallengeModalOpen(false);
    resetChallengeForm();
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
        active: challengeForm.active,
      });
      setChallenges((prev: Challenge[]) => [...prev, created]);
      closeDraftCriteriaModal();
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

  const handleToggleChallengeActive = async (challenge: Challenge, nextActive: boolean) => {
    setTogglingChallengeId(challenge.id);
    try {
      const updated = await api.updateChallenge(challenge.id, { active: nextActive });
      setChallenges((prev: Challenge[]) =>
        prev.map((item) => (item.id === challenge.id ? { ...item, active: updated.active } : item)),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setTogglingChallengeId(null);
    }
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
          <h1 className="text-4xl font-bold text-neonBlue">{t("configuration.headerTitle")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-neonPink/80">{t("configuration.headerSubtitle")}</p>
        </div>
        <Button className="self-start" onClick={() => setIsChallengeModalOpen(true)}>
          {t("configuration.createButton")}
        </Button>
      </header>

      <section className="grid gap-6">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onAddCriteria={handleOpenCriteriaModal}
            onToggleActive={handleToggleChallengeActive}
            isToggling={togglingChallengeId === challenge.id}
            repositoriesHref={`/configuration/${challenge.id}/repositories`}
          />
        ))}
        {!challenges.length && (
          <p className="rounded-xl border border-dashed border-neonBlue/40 p-8 text-center text-neonPink/70">
            {t("configuration.listEmpty")}
          </p>
        )}
      </section>

      <Modal
        title={t("configuration.modal.title")}
        description={t("configuration.modal.description")}
        isOpen={isChallengeModalOpen}
        onClose={handleCloseChallengeModal}
        primaryActionLabel={t("configuration.createButton")}
        onPrimaryAction={handleCreateChallenge}
        isPrimaryDisabled={loading}
      >
        <div className="space-y-4">
          <Input
            placeholder={t("configuration.modal.namePlaceholder")}
            value={challengeForm.name}
            onChange={(event) => setChallengeForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextArea
            placeholder={t("configuration.modal.objectivePlaceholder")}
            value={challengeForm.description}
            rows={3}
            onChange={(event) => setChallengeForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <TextArea
            placeholder={t("configuration.modal.outcomePlaceholder")}
            value={challengeForm.expected_outcome}
            rows={3}
            onChange={(event) => setChallengeForm((prev) => ({ ...prev, expected_outcome: event.target.value }))}
          />
          <label className="flex items-center justify-between rounded-xl border border-neonBlue/40 bg-night/70 px-4 py-3 text-sm text-neonPink/80">
            <div className="flex flex-col">
              <span className="font-semibold text-neonBlue">{t("configuration.modal.activeLabel")}</span>
              <span className="text-xs text-neonPink/60">{t("configuration.modal.activeHelper")}</span>
            </div>
            <span className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={challengeForm.active}
                onChange={(event) =>
                  setChallengeForm((prev) => ({ ...prev, active: event.target.checked }))
                }
              />
              <span className="flex h-6 w-11 items-center justify-start rounded-full bg-neonPink/30 px-1 transition peer-checked:bg-neonBlue/60 peer-checked:justify-end">
                <span className="h-5 w-5 rounded-full bg-night transition peer-checked:bg-neonBlue"></span>
              </span>
            </span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neonBlue">{t("configuration.modal.criteriaSection")}</h3>
              <Button type="button" variant="ghost" onClick={openNewDraftCriterion}>
                {t("configuration.modal.addCriterion")}
              </Button>
            </div>
            {challengeForm.criteria.length ? (
              <div className="grid gap-2">
                {challengeForm.criteria.map((criterion, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-start gap-1 rounded-xl border border-neonBlue/40 p-4 text-left transition hover:border-neonBlue/70 hover:bg-neonBlue/5"
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="block text-sm font-semibold text-neonBlue">
                          {criterion.name || t("configuration.modal.criterion.name")}
                        </span>
                        {criterion.description ? (
                          <span className="block text-xs text-neonPink/80">{criterion.description}</span>
                        ) : (
                          <span className="block text-xs italic text-neonPink/60">{t("configuration.modal.criterion.noDescription")}</span>
                        )}
                        <span className="block text-xs text-neonPink/70">
                          {t("configuration.modal.criterion.multiplierLabel")}: {criterion.score_multiplier} · {t("configuration.modal.criterion.conceptLabel")}: {criterion.code_concept || t("configuration.modal.criterion.notSet")}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => openDraftCriterion(index)}
                        >
                          {t("configuration.modal.editAction")}
                        </Button>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => removeDraftCriterionAtIndex(index)}
                          className="text-neonPink"
                        >
                          {t("configuration.modal.delete")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-neonBlue/40 p-4 text-center text-sm text-neonPink/70">
                {t("configuration.modal.emptyCriteria")}
              </p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title={
          draftCriteriaIndex === null
            ? t("configuration.modal.addTitle")
            : t("configuration.modal.editTitle")
        }
        isOpen={isDraftCriteriaModalOpen}
        onClose={closeDraftCriteriaModal}
        primaryActionLabel={draftCriteriaIndex === null ? t("configuration.modal.add") : t("configuration.modal.save")}
        onPrimaryAction={handleSaveDraftCriterion}
        isPrimaryDisabled={!draftCriteriaForm.name.trim()}
      >
        <div className="space-y-3">
          <Input
            placeholder={t("configuration.modal.criterion.name")}
            value={draftCriteriaForm.name}
            onChange={(event) => setDraftCriteriaForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextArea
            placeholder={t("configuration.modal.criterion.description")}
            value={draftCriteriaForm.description}
            rows={3}
            onChange={(event) => setDraftCriteriaForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder={t("configuration.modal.criterion.score")}
              value={draftCriteriaForm.score_multiplier}
              onChange={(event) =>
                setDraftCriteriaForm((prev) => ({ ...prev, score_multiplier: Number(event.target.value) }))
              }
            />
            <Input
              placeholder={t("configuration.modal.criterion.concept")}
              value={draftCriteriaForm.code_concept}
              onChange={(event) => setDraftCriteriaForm((prev) => ({ ...prev, code_concept: event.target.value }))}
            />
          </div>
          {draftCriteriaIndex !== null && (
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-center text-neonPink"
              onClick={handleDeleteDraftCriterion}
            >
              {t("configuration.modal.delete")}
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        title={t("configuration.addCriteriaModal.title", {
          values: {
            name: selectedChallenge?.name ?? t("configuration.addCriteriaModal.fallbackName"),
          },
        })}
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        primaryActionLabel={t("configuration.modal.add")}
        onPrimaryAction={handleAddCriteria}
        isPrimaryDisabled={loading}
      >
        <Input
          placeholder={t("configuration.modal.criterion.name")}
          value={criteriaDraft.name}
          onChange={(event) => setCriteriaDraft((prev) => ({ ...prev, name: event.target.value }))}
        />
        <TextArea
          placeholder={t("configuration.addCriteriaModal.descriptionPlaceholder")}
          value={criteriaDraft.description}
          rows={3}
          onChange={(event) => setCriteriaDraft((prev) => ({ ...prev, description: event.target.value }))}
        />
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
          <Input
            type="number"
            min="0.1"
            step="0.1"
            placeholder={t("configuration.modal.criterion.score")}
            value={criteriaDraft.score_multiplier}
            onChange={(event) =>
              setCriteriaDraft((prev) => ({ ...prev, score_multiplier: Number(event.target.value) }))
            }
          />
          <Input
            placeholder={t("configuration.modal.criterion.concept")}
            value={criteriaDraft.code_concept}
            onChange={(event) => setCriteriaDraft((prev) => ({ ...prev, code_concept: event.target.value }))}
          />
        </div>
      </Modal>
    </main>
  );
}
