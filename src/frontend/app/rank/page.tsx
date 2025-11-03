"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Select";
import { Modal } from "@/components/molecules/Modal";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import type { Challenge } from "@/types/challenge";
import type { EvaluationDetail, RankEntry } from "@/types/evaluation";
import { api } from "@/utils/api";
import { usePolling } from "@/utils/hooks";
import { useI18n } from "@/i18n/I18nProvider";

export default function RankPage() {
  const params = useSearchParams();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [rankEntries, setRankEntries] = useState<RankEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string>("");
  const [evaluationDetails, setEvaluationDetails] = useState<EvaluationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    api
      .listChallenges()
      .then((data) => {
        setChallenges(data);
        const initial = params.get("challengeId") ?? data[0]?.id ?? "";
        setSelectedChallengeId(initial);
      })
      .catch((error) => console.error(error));
  }, [params]);

  const selectedChallenge = useMemo(
  () => challenges.find((challenge: Challenge) => challenge.id === selectedChallengeId) ?? null,
    [challenges, selectedChallengeId],
  );

  usePolling(
    () => {
      if (!selectedChallengeId) {
        return;
      }
      api
        .getRanking(selectedChallengeId)
        .then((data) => setRankEntries(data.entries))
        .catch((error) => console.error(error));
    },
    5000,
    Boolean(selectedChallengeId),
  );

  const openEvaluationModal = async (repositoryId: string) => {
    if (!selectedChallengeId) {
      return;
    }
    setSelectedRepositoryId(repositoryId);
    setIsModalOpen(true);
    setIsLoading(true);
    try {
      const evaluations = await api.getEvaluationHistory(selectedChallengeId, repositoryId);
      setEvaluationDetails(evaluations);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neonBlue">{t("rank.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-neonPink/80">{t("rank.description")}</p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-neonBlue">{t("rank.challengeLabel")}</label>
          <Select
            options={challenges.map((challenge: Challenge) => ({ label: challenge.name, value: challenge.id }))}
            value={selectedChallengeId}
            placeholder={challenges.length ? t("rank.selectPlaceholder") : t("rank.selectEmpty")}
            onChange={setSelectedChallengeId}
          />
        </div>
      </header>

      <section className="rounded-2xl border border-neonBlue/40 bg-night/70 shadow-glow">
        <table className="w-full table-auto text-left text-sm text-neonPink">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-neonBlue/70">
              <th className="px-6 py-4">{t("rank.table.repository")}</th>
              <th className="px-6 py-4">{t("rank.table.score")}</th>
              <th className="px-6 py-4">{t("rank.table.status")}</th>
              <th className="px-6 py-4">{t("rank.table.link")}</th>
            </tr>
          </thead>
          <tbody>
            {rankEntries.map((entry) => (
              <tr key={entry.repository_id} className="border-t border-neonBlue/20 hover:bg-night/60">
                <td className="px-6 py-4">
                  <button
                    onClick={() => openEvaluationModal(entry.repository_id)}
                    className="text-left text-neonBlue hover:text-neonPink"
                  >
                    {entry.repository_name}
                    {entry.unscored ? (
                      <span className="ml-3 rounded-full bg-neonRed/20 px-2 py-1 text-xs text-neonRed">
                        {t("rank.table.unscored")}
                      </span>
                    ) : null}
                  </button>
                </td>
                <td className="px-6 py-4 text-neonPink/80">
                  {entry.total_score !== null ? entry.total_score.toFixed(2) : "-"}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge state={entry.status} />
                </td>
                <td className="px-6 py-4">
                  <a href={entry.repository_url} target="_blank" rel="noreferrer" className="text-neonBlue">
                    {t("rank.table.view")}
                  </a>
                </td>
              </tr>
            ))}
            {!rankEntries.length && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-neonPink/60">
                  {t("rank.table.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Modal
        title={t("rank.modal.title")}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        secondaryActionLabel={t("rank.modal.close")}
        onSecondaryAction={() => setIsModalOpen(false)}
      >
        {isLoading ? (
          <p className="text-sm text-neonPink/70">{t("rank.modal.loading")}</p>
        ) : (
          <div className="space-y-4">
            {evaluationDetails.map((detail) => (
              <div key={detail.id} className="rounded-xl border border-neonBlue/30 bg-night/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-neonPink">{detail.criteria_name}</p>
                  <span className="text-sm text-neonBlue/70">
                    {t("rank.modal.score")}: {detail.score ?? "-"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-neonPink/70">
                  {detail.reasoning ?? t("rank.modal.noReasoning")}
                </p>
                <p className="mt-2 text-xs text-neonBlue/70">
                  {t("rank.modal.suggestion")}: {detail.suggestion ?? t("rank.modal.noSuggestion")}
                </p>
                <p className="mt-3 text-xs text-neonPink/60">
                  {t("rank.modal.updated")}: {new Date(detail.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
            {!evaluationDetails.length && !isLoading && (
              <p className="text-sm text-neonPink/70">{t("rank.modal.noEvaluations")}</p>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}
