export type EvaluationState = "not_evaluated" | "under_evaluation" | "evaluated";

export type EvaluationDetail = {
  id: string;
  challenge_id: string;
  repository_id: string;
  criteria_id: string;
  criteria_name: string;
  score: number | null;
  state: EvaluationState;
  reasoning: string | null;
  suggestion: string | null;
  updated_at: string;
};

export type RankEntry = {
  repository_id: string;
  repository_name: string;
  repository_url: string;
  total_score: number | null;
  status: EvaluationState;
  unscored: boolean;
};

export type RankResponse = {
  challenge_id: string;
  entries: RankEntry[];
  generated_at: string;
};

export type EvaluationStatus = {
  repository_id: string;
  repository_name: string;
  challenge_id: string;
  state: EvaluationState;
  last_updated: string;
};
