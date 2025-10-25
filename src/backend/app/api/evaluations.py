"""Evaluation orchestration endpoints."""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import CosmosDBClient, get_db_client
from ..evaluation import EvaluationService
from ..schema import (
    EvaluationDetail,
    EvaluationHistoryResponse,
    EvaluationRequest,
    EvaluationState,
    EvaluationStatusResponse,
    RankEntry,
    RankResponse,
    RepositoryResponse,
)

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
async def trigger_evaluation(
    payload: EvaluationRequest,
    db: CosmosDBClient = Depends(get_db_client),
) -> Dict[str, str]:
    service = EvaluationService(db)

    async def _runner() -> None:
        await service.run_for_challenge(payload.challenge_id, payload.criteria_ids)

    asyncio.create_task(_runner())
    return {"status": "started"}


@router.get("/status/{challenge_id}", response_model=List[EvaluationStatusResponse])
def get_status(challenge_id: str, db: CosmosDBClient = Depends(get_db_client)) -> List[EvaluationStatusResponse]:
    repositories = db.list_repositories(challenge_id)
    evaluations = db.list_evaluations_for_challenge(challenge_id)
    latest: Dict[str, EvaluationStatusResponse] = {}
    for repo in repositories:
        latest[repo["id"]] = EvaluationStatusResponse(
            repository_id=repo["id"],
            repository_name=repo["name"],
            challenge_id=challenge_id,
            state=EvaluationState.NOT_EVALUATED,
            last_updated=datetime.fromisoformat(repo["created_at"]),
        )
    for evaluation in evaluations:
        repo_id = evaluation["repository_id"]
        state = EvaluationState(evaluation.get("state", EvaluationState.NOT_EVALUATED.value))
        timestamp = evaluation.get("updated_at") or evaluation.get("created_at")
        if not timestamp:
            timestamp = datetime.utcnow().isoformat()
        last = datetime.fromisoformat(timestamp)
        latest[repo_id] = EvaluationStatusResponse(
            repository_id=repo_id,
            repository_name=latest[repo_id].repository_name,
            challenge_id=challenge_id,
            state=state,
            last_updated=last,
        )
    return sorted(latest.values(), key=lambda item: item.repository_name.lower())


@router.get("/rank/{challenge_id}", response_model=RankResponse)
def rank(challenge_id: str, db: CosmosDBClient = Depends(get_db_client)) -> RankResponse:
    repositories = db.list_repositories(challenge_id)
    if not repositories:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No repositories registered")
    evaluations = db.list_evaluations_for_challenge(challenge_id)
    grouped: Dict[str, List[dict]] = {}
    for evaluation in evaluations:
        grouped.setdefault(evaluation["repository_id"], []).append(evaluation)
    entries: List[RankEntry] = []
    for repo in repositories:
        repo_evaluations = grouped.get(repo["id"], [])
        scored_values = [item["score"] for item in repo_evaluations if item.get("score") is not None]
        total_score = sum(scored_values) / len(scored_values) if scored_values else None
        state = _resolve_state(repo_evaluations)
        unscored = len(scored_values) < len(repo_evaluations) or not scored_values
        entries.append(
            RankEntry(
                repository_id=repo["id"],
                repository_name=repo["name"],
                repository_url=repo["url"],
                total_score=total_score,
                status=state,
                unscored=unscored,
            )
        )
    entries.sort(key=lambda item: (item.total_score is None, -(item.total_score or 0)))
    return RankResponse(challenge_id=challenge_id, entries=entries, generated_at=datetime.utcnow())


@router.get("/repository/{challenge_id}/{repository_id}", response_model=EvaluationHistoryResponse)
def get_repository_history(
    challenge_id: str,
    repository_id: str,
    db: CosmosDBClient = Depends(get_db_client),
) -> EvaluationHistoryResponse:
    repo_doc = db.get_repository(repository_id, challenge_id)
    if not repo_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    evaluations = db.list_evaluations_for_repository(repository_id)
    return EvaluationHistoryResponse(
        repository=RepositoryResponse(
            id=repo_doc["id"],
            challenge_id=repo_doc["challenge_id"],
            name=repo_doc["name"],
            url=repo_doc["url"],
            created_at=datetime.fromisoformat(repo_doc["created_at"]),
        ),
        evaluations=[
            EvaluationDetail(
                id=item["id"],
                challenge_id=item["challenge_id"],
                repository_id=item["repository_id"],
                criteria_id=item["criteria_id"],
                criteria_name=item.get("criteria_name", ""),
                score=item.get("score"),
                state=EvaluationState(item.get("state", EvaluationState.NOT_EVALUATED.value)),
                reasoning=item.get("reasoning"),
                suggestion=item.get("suggestion"),
                updated_at=_coerce_datetime(item.get("updated_at"), item.get("created_at")),
            )
            for item in evaluations
        ],
    )


def _resolve_state(evaluations: List[dict]) -> EvaluationState:
    states = {item.get("state", EvaluationState.NOT_EVALUATED.value) for item in evaluations}
    if EvaluationState.UNDER_EVALUATION.value in states:
        return EvaluationState.UNDER_EVALUATION
    if EvaluationState.EVALUATED.value in states and len(states) == 1:
        return EvaluationState.EVALUATED
    return EvaluationState.NOT_EVALUATED


def _coerce_datetime(primary: str | None, fallback: str | None) -> datetime:
    timestamp = primary or fallback or datetime.utcnow().isoformat()
    return datetime.fromisoformat(timestamp)
