"""Challenge-related API routes."""
from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import CosmosDBClient, get_db_client
from ..schema import (
    ChallengeCreate,
    ChallengeResponse,
    ChallengeUpdate,
    CriteriaBase,
    CriteriaResponse,
)

router = APIRouter(prefix="/challenges", tags=["challenges"])


def _serialize_challenge(doc: dict, criteria: List[dict]) -> ChallengeResponse:
    return ChallengeResponse(
        id=doc["id"],
        name=doc["name"],
        description=doc["description"],
        expected_outcome=doc["expected_outcome"],
        active=doc.get("active", True),
        created_at=datetime.fromisoformat(doc["created_at"]),
        criteria=[
            CriteriaResponse(
                id=item["id"],
                challenge_id=item["challenge_id"],
                name=item["name"],
                description=item["description"],
                score_multiplier=item["score_multiplier"],
                code_concept=item["code_concept"],
            )
            for item in criteria
        ],
    )


@router.get("/", response_model=List[ChallengeResponse])
def list_challenges(db: CosmosDBClient = Depends(get_db_client)) -> List[ChallengeResponse]:
    challenges = db.list_challenges()
    results: List[ChallengeResponse] = []
    for challenge in challenges:
        criteria = db.list_criteria(challenge_id=challenge["id"])
        results.append(_serialize_challenge(challenge, criteria))
    return results


@router.post("/", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
def create_challenge(
    payload: ChallengeCreate,
    db: CosmosDBClient = Depends(get_db_client),
) -> ChallengeResponse:
    challenge_id = str(uuid4())
    doc = {
        "id": challenge_id,
        "name": payload.name,
        "description": payload.description,
        "expected_outcome": payload.expected_outcome,
        "active": payload.active,
        "created_at": datetime.utcnow().isoformat(),
    }
    db.create_challenge(doc)
    persisted_criteria = []
    for criterion in payload.criteria:
        persisted_criteria.append(_create_criteria(challenge_id, criterion, db))
    return _serialize_challenge(doc, persisted_criteria)


def _create_criteria(challenge_id: str, data: CriteriaBase, db: CosmosDBClient) -> dict:
    criteria_id = str(uuid4())
    doc = {
        "id": criteria_id,
        "challenge_id": challenge_id,
        "name": data.name,
        "description": data.description,
        "score_multiplier": data.score_multiplier,
        "code_concept": data.code_concept,
    }
    return db.create_criteria(doc)


@router.patch("/{challenge_id}", response_model=ChallengeResponse)
def update_challenge(
    challenge_id: str,
    payload: ChallengeUpdate,
    db: CosmosDBClient = Depends(get_db_client),
) -> ChallengeResponse:
    existing = db.get_challenge(challenge_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        existing[field] = value
    existing["updated_at"] = datetime.utcnow().isoformat()
    db.create_challenge(existing)
    criteria = db.list_criteria(challenge_id)
    return _serialize_challenge(existing, criteria)


@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_challenge(challenge_id: str, db: CosmosDBClient = Depends(get_db_client)) -> None:
    if not db.get_challenge(challenge_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
    db.delete_challenge(challenge_id)
