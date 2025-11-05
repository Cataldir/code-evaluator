import axios from "axios";

import type { Challenge, Criteria } from "@/types/challenge";
import type { EvaluationDetail, EvaluationStatus, RankResponse } from "@/types/evaluation";
import type { Repository } from "@/types/repository";
import { LOCALE_STORAGE_KEY } from "@/i18n/settings";

const defaultBaseUrl = "https://code-evaluator-project-c8efdzb3ctaxcvcz.eastus-01.azurewebsites.net/";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultBaseUrl;
const baseURL = rawBaseUrl.startsWith("http://") && !/localhost|127\.0\.0\.1/i.test(rawBaseUrl)
  ? rawBaseUrl.replace(/^http:\/\//i, "https://")
  : rawBaseUrl;

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (locale) {
      config.headers = config.headers ?? {};
      config.headers["Accept-Language"] = locale;
    }
  }
  return config;
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
    active: boolean;
  }): Promise<Challenge> {
    const { data } = await client.post<Challenge>("/challenges", payload);
    return data;
  },

  async updateChallenge(
    challengeId: string,
    payload: Partial<{
      name: string;
      description: string;
      expected_outcome: string;
      active: boolean;
    }>,
  ): Promise<Challenge> {
    const { data } = await client.patch<Challenge>(`/challenges/${challengeId}`, payload);
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
