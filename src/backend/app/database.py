"""Cosmos DB wrapper handling basic persistence operations."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from azure.cosmos import CosmosClient, PartitionKey
from azure.identity import DefaultAzureCredential
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import settings

_LOGGER = logging.getLogger(__name__)


class CosmosDBClient:
    """Abstraction layer on top of Cosmos DB collections."""

    def __init__(self) -> None:
        credential = DefaultAzureCredential()
        self._client = CosmosClient(url=settings.cosmos_endpoint, credential=credential)
        self._database = self._client.create_database_if_not_exists(id=settings.cosmos_database)
        self._challenges = self._get_container(settings.cosmos_challenges_container, "/id")
        self._criteria = self._get_container(settings.cosmos_criteria_container, "/challenge_id")
        self._repositories = self._get_container(settings.cosmos_repositories_container, "/challenge_id")
        self._evaluations = self._get_container(settings.cosmos_evaluations_container, "/repository_id")
        _LOGGER.info("Cosmos DB client initialized")

    def _get_container(self, container_id: str, partition_key: str):
        return self._database.create_container_if_not_exists(
            id=container_id,
            partition_key=PartitionKey(path=partition_key),
            offer_throughput=400,
        )

    @retry(wait=wait_exponential(multiplier=0.5, min=1, max=5), stop=stop_after_attempt(5))
    def upsert(self, container, item: Dict[str, Any]) -> Dict[str, Any]:
        _LOGGER.debug("Upserting item into %s", container.id)
        item.setdefault("updated_at", datetime.utcnow().isoformat())
        return container.upsert_item(body=item)

    def create_challenge(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload.setdefault("created_at", datetime.utcnow().isoformat())
        payload.setdefault("active", True)
        return self.upsert(self._challenges, payload)

    def list_challenges(self) -> List[Dict[str, Any]]:
        return list(self._challenges.read_all_items())

    def get_challenge(self, challenge_id: str) -> Optional[Dict[str, Any]]:
        return self._safe_read(self._challenges, challenge_id)

    def delete_challenge(self, challenge_id: str) -> None:
        self._challenges.delete_item(item=challenge_id, partition_key=challenge_id)

    def set_challenge_active(self, challenge_id: str, active: bool) -> Dict[str, Any]:
        challenge = self.get_challenge(challenge_id)
        if not challenge:
            raise ValueError(f"Challenge {challenge_id} not found")
        challenge["active"] = active
        return self.upsert(self._challenges, challenge)

    def create_criteria(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload.setdefault("created_at", datetime.utcnow().isoformat())
        return self.upsert(self._criteria, payload)

    def list_criteria(self, challenge_id: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM c WHERE c.challenge_id = @challenge_id"
        params: List[Dict[str, Any]] = [{"name": "@challenge_id", "value": challenge_id}]
        return list(self._criteria.query_items(query=query, parameters=params, enable_cross_partition_query=True))

    def get_criteria(self, criteria_id: str, challenge_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if challenge_id:
            return self._safe_read(self._criteria, criteria_id, partition_key=challenge_id)
        query = "SELECT * FROM c WHERE c.id = @criteria_id"
        params: List[Dict[str, Any]] = [{"name": "@criteria_id", "value": criteria_id}]
        results = list(
            self._criteria.query_items(query=query, parameters=params, enable_cross_partition_query=True)
        )
        return results[0] if results else None

    def create_repository(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload.setdefault("created_at", datetime.utcnow().isoformat())
        return self.upsert(self._repositories, payload)

    def list_repositories(self, challenge_id: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM c WHERE c.challenge_id = @challenge_id"
        params: List[Dict[str, Any]] = [{"name": "@challenge_id", "value": challenge_id}]
        return list(self._repositories.query_items(query=query, parameters=params, enable_cross_partition_query=True))

    def get_repository(self, repository_id: str, challenge_id: str) -> Optional[Dict[str, Any]]:
        return self._safe_read(self._repositories, repository_id, partition_key=challenge_id)

    def create_evaluation(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload.setdefault("created_at", datetime.utcnow().isoformat())
        return self.upsert(self._evaluations, payload)

    def delete_repository(self, repository_id: str, challenge_id: str) -> None:
        self._repositories.delete_item(item=repository_id, partition_key=challenge_id)

    def list_evaluations_for_challenge(self, challenge_id: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM c WHERE c.challenge_id = @challenge_id"
        params: List[Dict[str, Any]] = [{"name": "@challenge_id", "value": challenge_id}]
        return list(self._evaluations.query_items(query=query, parameters=params, enable_cross_partition_query=True))

    def get_evaluation(self, evaluation_id: str, repository_id: str) -> Optional[Dict[str, Any]]:
        return self._safe_read(self._evaluations, evaluation_id, partition_key=repository_id)

    def patch_evaluation(self, evaluation_id: str, repository_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        existing = self._safe_read(self._evaluations, evaluation_id, partition_key=repository_id)
        if not existing:
            raise ValueError(f"Evaluation {evaluation_id} not found")
        existing.update(data)
        return self.upsert(self._evaluations, existing)

    def _safe_read(self, container, item_id: str, partition_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        try:
            key = partition_key or item_id
            return container.read_item(item=item_id, partition_key=key)
        except Exception as exc:  # pragma: no cover - underlying SDK exceptions vary
            _LOGGER.debug("Item read failed for %s in %s: %s", item_id, container.id, exc)
            return None


_db_client: Optional[CosmosDBClient] = None


def get_db_client() -> CosmosDBClient:
    global _db_client
    if _db_client is None:
        _db_client = CosmosDBClient()
    return _db_client
