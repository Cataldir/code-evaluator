"""Repository management endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import CosmosDBClient, get_db_client
from ..schema import RepositoryCreate, RepositoryResponse

router = APIRouter(prefix="/repositories", tags=["repositories"])


def _serialize(doc: dict) -> RepositoryResponse:
    return RepositoryResponse(
        id=doc["id"],
        challenge_id=doc["challenge_id"],
        name=doc["name"],
        url=doc["url"],
        created_at=datetime.fromisoformat(doc["created_at"]),
    )


@router.post("/", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
def create_repository(payload: RepositoryCreate, db: CosmosDBClient = Depends(get_db_client)) -> RepositoryResponse:
    repo_id = str(uuid4())
    doc = {
        "id": repo_id,
        "challenge_id": payload.challenge_id,
        "name": payload.name,
        "url": payload.url,
        "created_at": datetime.utcnow().isoformat(),
    }
    stored = db.create_repository(doc)
    return _serialize(stored)


@router.get("/challenges/{challenge_id}", response_model=List[RepositoryResponse])
def list_repositories(challenge_id: str, db: CosmosDBClient = Depends(get_db_client)) -> List[RepositoryResponse]:
    return [_serialize(item) for item in db.list_repositories(challenge_id)]


@router.get("/{repository_id}", response_model=RepositoryResponse)
def get_repository(repository_id: str, challenge_id: str, db: CosmosDBClient = Depends(get_db_client)) -> RepositoryResponse:
    existing = db.get_repository(repository_id, challenge_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    return _serialize(existing)


@router.delete("/{repository_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repository(repository_id: str, challenge_id: str, db: CosmosDBClient = Depends(get_db_client)) -> None:
    existing = db.get_repository(repository_id, challenge_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    db.delete_repository(repository_id, challenge_id)
