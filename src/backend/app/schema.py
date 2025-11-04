"""Pydantic models shared across the backend API."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class EvaluationState(str, Enum):
    NOT_EVALUATED = "not_evaluated"
    UNDER_EVALUATION = "under_evaluation"
    EVALUATED = "evaluated"


class CriteriaBase(BaseModel):
    name: str
    description: str = Field(..., description="Details about what the criteria expects")
    score_multiplier: float = Field(..., gt=0)
    code_concept: str = Field(..., description="The concept being validated")


class CriteriaCreate(CriteriaBase):
    challenge_id: str


class CriteriaUpdate(BaseModel):
    description: Optional[str] = None
    score_multiplier: Optional[float] = Field(None, gt=0)
    code_concept: Optional[str] = None


class CriteriaResponse(CriteriaBase):
    id: str
    challenge_id: str


class ChallengeBase(BaseModel):
    name: str
    description: str
    expected_outcome: str
    active: bool = True


class ChallengeCreate(ChallengeBase):
    criteria: List[CriteriaBase] = Field(default_factory=list)


class ChallengeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    expected_outcome: Optional[str] = None
    active: Optional[bool] = None
    agent_id: Optional[str] = None


class ChallengeResponse(ChallengeBase):
    id: str
    created_at: datetime
    agent_id: Optional[str] = None
    criteria: List[CriteriaResponse] = Field(default_factory=list)


class RepositoryBase(BaseModel):
    name: str
    url: str


class RepositoryCreate(RepositoryBase):
    challenge_id: str


class RepositoryResponse(RepositoryBase):
    id: str
    challenge_id: str
    created_at: datetime


class EvaluationDetail(BaseModel):
    id: str
    challenge_id: str
    repository_id: str
    criteria_id: str
    criteria_name: str
    score: Optional[float] = None
    state: EvaluationState
    reasoning: Optional[str] = None
    suggestion: Optional[str] = None
    updated_at: datetime


class EvaluationRequest(BaseModel):
    challenge_id: str
    criteria_ids: Optional[List[str]] = None


class EvaluationStatusResponse(BaseModel):
    repository_id: str
    repository_name: str
    challenge_id: str
    state: EvaluationState
    last_updated: datetime


class RankEntry(BaseModel):
    repository_id: str
    repository_name: str
    repository_url: str
    total_score: Optional[float]
    status: EvaluationState
    unscored: bool = False


class RankResponse(BaseModel):
    challenge_id: str
    entries: List[RankEntry]
    generated_at: datetime


class EvaluationHistoryResponse(BaseModel):
    repository: RepositoryResponse
    evaluations: List[EvaluationDetail]
