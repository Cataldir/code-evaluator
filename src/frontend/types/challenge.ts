import type { EvaluationState } from "@/types/evaluation";

export type Criteria = {
  id: string;
  challenge_id: string;
  name: string;
  description: string;
  score_multiplier: number;
  code_concept: string;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  expected_outcome: string;
  created_at: string;
  criteria: Criteria[];
  active: boolean;
};

export type ChallengeForm = {
  name: string;
  description: string;
  expected_outcome: string;
  criteria: Array<Omit<Criteria, "id" | "challenge_id">>;
  active: boolean;
};

export type EvaluationTriggerPayload = {
  challenge_id: string;
  criteria_ids?: string[];
};

export type ChallengeEvaluationStatus = {
  repository_id: string;
  repository_name: string;
  challenge_id: string;
  state: EvaluationState;
  last_updated: string;
};
