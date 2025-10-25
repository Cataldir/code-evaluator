"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Modal } from "@/components/molecules/Modal";
import type { Challenge } from "@/types/challenge";
import type { Repository } from "@/types/repository";
import { api } from "@/utils/api";

export default function ChallengeRepositoriesPage() {
  const params = useParams<{ challengeId: string }>();
  const router = useRouter();
  const challengeId = params.challengeId;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repoForm, setRepoForm] = useState({ name: "", url: "" });

  useEffect(() => {
    if (!challengeId) {
      return;
    }
    const loadData = async () => {
      try {
        const [challenges, repos] = await Promise.all([
          api.listChallenges(),
          api.listRepositories(challengeId),
        ]);
        setChallenge(challenges.find((item) => item.id === challengeId) ?? null);
        setRepositories(repos);
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, [challengeId]);

  const handleAddRepository = async () => {
    if (!challengeId || !repoForm.name.trim() || !repoForm.url.trim()) {
      return;
    }
    try {
      const created = await api.addRepository({
        challenge_id: challengeId,
        name: repoForm.name,
        url: repoForm.url,
      });
  setRepositories((prev: Repository[]) => [...prev, created]);
      setIsModalOpen(false);
      setRepoForm({ name: "", url: "" });
    } catch (error) {
      console.error(error);
    }
  };

  const headerTitle = useMemo(() => challenge?.name ?? "Challenge repositories", [challenge]);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neonBlue">{headerTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-neonPink/80">
            Repositories registered for evaluation. These will be queued whenever the challenge is scored.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            Go back
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>Add repository</Button>
        </div>
      </div>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neonBlue">Registered repositories</h2>
          {challenge ? (
            <Link href={`/rank?challengeId=${challenge.id}`} className="text-sm text-neonBlue hover:text-neonPink">
              View live ranking
            </Link>
          ) : null}
        </header>
        <div className="rounded-2xl border border-neonBlue/40 bg-night/70 shadow-innerGlow">
          <table className="w-full table-auto text-left text-sm text-neonPink">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-neonBlue/70">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Repository URL</th>
                <th className="px-6 py-4">Added at</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repository) => (
                <tr key={repository.id} className="border-t border-neonBlue/20 hover:bg-night/60">
                  <td className="px-6 py-4 font-medium">{repository.name}</td>
                  <td className="px-6 py-4">
                    <a href={repository.url} target="_blank" rel="noreferrer" className="text-neonBlue">
                      {repository.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-xs text-neonPink/60">
                    {new Date(repository.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!repositories.length && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-neonPink/60">
                    No repositories registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        title="Add repository"
        description="Link an open-source repository that should be evaluated for this challenge."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        primaryActionLabel="Add repository"
        onPrimaryAction={handleAddRepository}
      >
        <Input
          placeholder="Repository name"
          value={repoForm.name}
          onChange={(event) => setRepoForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <Input
          placeholder="https://github.com/org/repo"
          value={repoForm.url}
          onChange={(event) => setRepoForm((prev) => ({ ...prev, url: event.target.value }))}
        />
      </Modal>
    </main>
  );
}
