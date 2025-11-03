"""Background scheduler for periodic evaluations."""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from .config import settings
from .database import CosmosDBClient
from .evaluation import EvaluationService

_LOGGER = logging.getLogger(__name__)


async def _run_iteration(service: EvaluationService, db_client: CosmosDBClient) -> None:
    challenges = db_client.list_challenges()
    if not challenges:
        _LOGGER.debug("No challenges found for scheduled evaluation")
        return

    for challenge in challenges:
        if not challenge.get("active", True):
            _LOGGER.info("Skipping inactive challenge %s", challenge.get("id"))
            continue
        challenge_id: Optional[str] = challenge.get("id")
        if not challenge_id:
            _LOGGER.warning("Skipping challenge without identifier: %s", challenge)
            continue
        _LOGGER.info("Running scheduled evaluation for challenge %s", challenge_id)
        try:
            await service.run_for_challenge(challenge_id)
        except Exception:  # pragma: no cover - defensive against unexpected failures
            _LOGGER.exception("Scheduled evaluation failed for challenge %s", challenge_id)


async def start_scheduler(db_client: CosmosDBClient) -> None:
    """Continuously execute evaluations at the configured interval."""
    interval = max(settings.evaluation_interval_seconds, 60)
    try:
        service = EvaluationService(db_client=db_client)
    except Exception:  # pragma: no cover - defensive against unexpected failures
        _LOGGER.exception("Evaluation scheduler failed to initialize evaluation service")
        return
    _LOGGER.info("Starting evaluation scheduler (interval=%ss)", interval)
    try:
        while True:
            await _run_iteration(service, db_client)
            await asyncio.sleep(interval)
    except asyncio.CancelledError:  # pragma: no cover - cooperative shutdown
        _LOGGER.info("Evaluation scheduler cancelled")
        raise
