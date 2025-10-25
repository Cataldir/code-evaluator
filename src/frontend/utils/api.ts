import axios from "axios";

import type { Challenge, Criteria } from "@/types/challenge";
import type { EvaluationDetail, EvaluationStatus, RankResponse } from "@/types/evaluation";
import type { Repository } from "@/types/repository";

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  async listChallenges(): Promise<Challenge[]> {
    const { data } = await client.get<Challenge[]>("/challenges");
    return data;
  },

  async createChallenge(payload: {
    name: string;
    description: string;
    expected_outcome: string;
    criteria: Array<Omit<Criteria, "id" | "challenge_id">>;
  }): Promise<Challenge> {
    const { data } = await client.post<Challenge>("/challenges", payload);
    return data;
  },

  async addCriteria(payload: { challenge_id: string } & Omit<Criteria, "id" | "challenge_id">): Promise<Criteria> {
    const { data } = await client.post<Criteria>("/criteria", payload);
    return data;
  },

  async listRepositories(challengeId: string): Promise<Repository[]> {
    const { data } = await client.get<Repository[]>(`/repositories/challenges/${challengeId}`);
    return data;
  },

  async addRepository(payload: { challenge_id: string; name: string; url: string }): Promise<Repository> {
    const { data } = await client.post<Repository>("/repositories", payload);
    return data;
  },

  async triggerEvaluation(payload: { challenge_id: string; criteria_ids?: string[] }): Promise<void> {
    await client.post("/evaluations/trigger", payload);
  },

  async getEvaluationStatus(challengeId: string): Promise<EvaluationStatus[]> {
    const { data } = await client.get<EvaluationStatus[]>(`/evaluations/status/${challengeId}`);
    return data;
  },

  async getRanking(challengeId: string): Promise<RankResponse> {
    const { data } = await client.get<RankResponse>(`/evaluations/rank/${challengeId}`);
    return data;
  },

  async getEvaluationHistory(challengeId: string, repositoryId: string): Promise<EvaluationDetail[]> {
    const { data } = await client.get<{ evaluations: EvaluationDetail[] }>(
      `/evaluations/repository/${challengeId}/${repositoryId}`,
    );
    return data.evaluations;
  },
};
