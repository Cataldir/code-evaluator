"""Criteria management endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import CosmosDBClient, get_db_client
from ..schema import CriteriaCreate, CriteriaResponse, CriteriaUpdate

router = APIRouter(prefix="/criteria", tags=["criteria"])


def _serialize(doc: dict) -> CriteriaResponse:
    return CriteriaResponse(
        id=doc["id"],
        challenge_id=doc["challenge_id"],
        name=doc["name"],
        description=doc["description"],
        score_multiplier=doc["score_multiplier"],
        code_concept=doc["code_concept"],
    )


@router.post("/", response_model=CriteriaResponse, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=CriteriaResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_criteria(payload: CriteriaCreate, db: CosmosDBClient = Depends(get_db_client)) -> CriteriaResponse:
    criteria_id = str(uuid4())
    doc = {
        "id": criteria_id,
        "challenge_id": payload.challenge_id,
        "name": payload.name,
        "description": payload.description,
        "score_multiplier": payload.score_multiplier,
        "code_concept": payload.code_concept,
        "created_at": datetime.utcnow().isoformat(),
    }
    stored = db.create_criteria(doc)
    return _serialize(stored)


@router.get("/{challenge_id}", response_model=List[CriteriaResponse])
def list_criteria(challenge_id: str, db: CosmosDBClient = Depends(get_db_client)) -> List[CriteriaResponse]:
    return [_serialize(item) for item in db.list_criteria(challenge_id)]


@router.patch("/{criteria_id}", response_model=CriteriaResponse)
def update_criteria(
    criteria_id: str,
    payload: CriteriaUpdate,
    db: CosmosDBClient = Depends(get_db_client),
) -> CriteriaResponse:
    existing = db.get_criteria(criteria_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Criteria not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        existing[field] = value
    existing["updated_at"] = datetime.utcnow().isoformat()
    stored = db.create_criteria(existing)
    return _serialize(stored)
