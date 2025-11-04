"""Configuration helpers for the backend service."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

import logging
import os

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

_LOGGER = logging.getLogger(__name__)


class Settings:
    """Application settings hydrated from the environment."""

    cosmos_endpoint: str
    cosmos_database: str
    cosmos_challenges_container: str
    cosmos_criteria_container: str
    cosmos_repositories_container: str
    cosmos_evaluations_container: str
    azure_openai_project: Optional[str]
    azure_openai_agent: Optional[str]
    azure_openai_agent_model: Optional[str]
    azure_openai_endpoint: Optional[str]
    github_token: Optional[str]
    evaluation_interval_seconds: int

    def __init__(self) -> None:
        self.cosmos_endpoint = _require("COSMOS_ENDPOINT")
        self.cosmos_database = os.getenv("COSMOS_DATABASE", "code-evaluator")
        self.cosmos_challenges_container = os.getenv("COSMOS_CHALLENGES_CONTAINER", "challenges")
        self.cosmos_criteria_container = os.getenv("COSMOS_CRITERIA_CONTAINER", "criteria")
        self.cosmos_repositories_container = os.getenv("COSMOS_REPOSITORIES_CONTAINER", "repositories")
        self.cosmos_evaluations_container = os.getenv("COSMOS_EVALUATIONS_CONTAINER", "evaluations")
        self.azure_openai_project = os.getenv("AZURE_AI_PROJECT_NAME")
        self.azure_openai_agent = os.getenv("AZURE_AI_AGENT_NAME")
        self.azure_openai_endpoint = os.getenv("AZURE_AI_ENDPOINT")
        self.azure_openai_agent_model = os.getenv("AZURE_AI_AGENT_MODEL")
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.evaluation_interval_seconds = int(os.getenv("EVALUATION_INTERVAL_SECONDS", "1800"))
        _LOGGER.info("Settings loaded (endpoint=%s, database=%s)", self.cosmos_endpoint, self.cosmos_database)


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return value


settings = Settings()
