"""Evaluation engine handling async code-quality assessments."""
from __future__ import annotations

import asyncio
import contextlib
import json
import logging
import tempfile
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple, cast
from urllib.parse import urlparse

import httpx
from azure.core.exceptions import HttpResponseError, ResourceNotFoundError
from azure.identity import DefaultAzureCredential

try:  # pragma: no cover - optional during local dev until SDK is installed
    from azure.ai.projects import AIProjectClient
except ImportError:  # pragma: no cover
    AIProjectClient = None
    AgentResponseType = Any

from .config import settings
from .database import CosmosDBClient, get_db_client
from .schema import EvaluationState

_LOGGER = logging.getLogger(__name__)

CODE_EVALUATION_SYSTEM_PROMPT = (
    "You are an automated code quality evaluator for the FIAP Next Challenge.\n"
    "Input: JSON with fields `criteria` and `repository`. The criteria object includes name, description, "
    "score_multiplier, and code_concept. The repository object contains name, url, and a list of files, "
    "where each file has a path and a code snippet.\n"
    "Task: Review the supplied snippets, infer repository structure, and judge how well the repository "
    "meets the intent of the criteria description and code_concept. Consider score_multiplier when "
    "deciding importance, but the final score must stay between 0 and 100.\n"
    "Output format (JSON only, no prose): {\"score\": <float 0-100>, \"reasoning\": <concise explanation>, "
    "\"suggestion\": <actionable recommendation>. If information is insufficient, return score 0 with "
    "an explanation describing what is missing."
)


@dataclass
class RepositoryContext:
    repository_id: str
    challenge_id: str
    name: str
    url: str


class EvaluationStateBase:
    """Base class for evaluation states."""

    def __init__(self, context: "EvaluationOrchestrator") -> None:
        self.context = context

    async def handle(self) -> None:
        raise NotImplementedError


class NotEvaluatedState(EvaluationStateBase):
    async def handle(self) -> None:
        await self.context.mark_state(EvaluationState.UNDER_EVALUATION)
        self.context.state = UnderEvaluationState(self.context)
        await self.context.state.handle()


class UnderEvaluationState(EvaluationStateBase):
    async def handle(self) -> None:
        result = await self.context.evaluate_repository()
        await self.context.persist_result(result)
        self.context.state = EvaluatedState(self.context)
        await self.context.state.handle()


class EvaluatedState(EvaluationStateBase):
    async def handle(self) -> None:
        await self.context.mark_state(EvaluationState.EVALUATED)


@dataclass
class EvaluationResult:
    score: Optional[float]
    reasoning: Optional[str]
    suggestion: Optional[str]


class EvaluationOrchestrator:
    """Manages the evaluation lifecycle for a repository/criteria tuple."""

    def __init__(
        self,
        db_client: CosmosDBClient,
        evaluation_doc: Dict,
        repository: RepositoryContext,
        criteria: Dict,
        agent_client: "AzureAgentClient",
    ) -> None:
        self.db_client = db_client
        self.evaluation_doc = evaluation_doc
        self.repository = repository
        self.criteria = criteria
        self.agent_client = agent_client
        self.state: EvaluationStateBase = NotEvaluatedState(self)

    async def run(self) -> None:
        await self.state.handle()

    async def mark_state(self, new_state: EvaluationState) -> None:
        patch = {
            "state": new_state.value,
            "updated_at": datetime.utcnow().isoformat(),
        }
        try:
            persisted = self.db_client.patch_evaluation(
                evaluation_id=self.evaluation_doc["id"],
                repository_id=self.evaluation_doc["repository_id"],
                data=patch,
            )
        except ValueError:
            fallback = {**self.evaluation_doc, **patch}
            persisted = self.db_client.create_evaluation(fallback)
        self.evaluation_doc.update(persisted)

    async def evaluate_repository(self) -> EvaluationResult:
        tmp_dir = tempfile.TemporaryDirectory()
        with contextlib.ExitStack() as stack:
            stack.enter_context(tmp_dir)
            archive_path = Path(tmp_dir.name) / "repo.zip"
            await download_repository_archive(
                repository_url=self.repository.url,
                destination=archive_path,
                token=settings.github_token,
            )
            extract_root = Path(tmp_dir.name) / "repo"
            extract_root.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(archive_path) as archive:
                archive.extractall(path=extract_root)
            files_snapshot = summarize_repository(extract_root)
            agent_payload = {
                "criteria": self.criteria,
                "repository": {
                    "name": self.repository.name,
                    "url": self.repository.url,
                    "files": files_snapshot,
                },
            }
            return await self.agent_client.evaluate(agent_payload)

    async def persist_result(self, result: EvaluationResult) -> None:
        patch = {
            "score": result.score,
            "reasoning": result.reasoning,
            "suggestion": result.suggestion,
            "updated_at": datetime.utcnow().isoformat(),
        }
        try:
            persisted = self.db_client.patch_evaluation(
                evaluation_id=self.evaluation_doc["id"],
                repository_id=self.evaluation_doc["repository_id"],
                data=patch,
            )
        except ValueError:
            fallback = {**self.evaluation_doc, **patch}
            persisted = self.db_client.create_evaluation(fallback)
        self.evaluation_doc.update(persisted)


class AzureAgentClient:
    """Wrapper around the Azure AI Foundry Agent SDK."""

    def __init__(self, agent_name: str, agent_id: Optional[str] = None) -> None:
        if AIProjectClient is None:
            raise RuntimeError("azure-ai-projects package is required for evaluation")
        if not settings.azure_openai_endpoint:
            raise RuntimeError("Azure AI Foundry endpoint is not configured")
        credential = DefaultAzureCredential()
        self._client = AIProjectClient(
            endpoint=settings.azure_openai_endpoint,
            credential=credential,
        )
        agent = None
        if agent_id:
            agent = self._load_agent_by_id(agent_id)
            if agent is None:
                _LOGGER.warning("Agent with id '%s' not found; attempting recreation", agent_id)
        if agent is None:
            agent = self._ensure_agent_by_name(agent_name)
        agent_id_value = getattr(agent, "id", None)
        if agent_id_value is None and isinstance(agent, dict):
            agent_id_value = agent.get("id")
        if agent_id_value is None:
            raise RuntimeError("Azure AI Foundry agent does not expose an identifier")
        self._agent_id = cast(str, agent_id_value)
        self._agent_name = agent_name

    @property
    def agent_id(self) -> str:
        return self._agent_id

    async def evaluate(self, payload: Dict) -> EvaluationResult:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._evaluate_sync, payload)

    def _evaluate_sync(self, payload: Dict) -> EvaluationResult:
        try:
            run = self._client.agents.create_thread_and_process_run(
                agent_id=self._agent_id,
                thread=cast(
                    Any,
                    {
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": json.dumps(payload, ensure_ascii=True),
                                    }
                                ],
                            }
                        ]
                    },
                ),
            )
        except HttpResponseError as exc:  # pragma: no cover - network issues
            raise RuntimeError("Failed to invoke Azure AI Foundry agent") from exc

        assistant_text = self._extract_assistant_text(run)
        return self._parse_evaluation(assistant_text)

    def _load_agent_by_id(self, agent_id: str) -> Optional[Any]:
        try:
            return self._client.agents.get_agent(agent_id)
        except HttpResponseError as exc:
            if getattr(exc, "status_code", None) in (404, "404"):
                return None
            raise RuntimeError("Failed to retrieve Azure AI Foundry agent by id") from exc

    def _ensure_agent_by_name(self, name: str) -> Any:
        existing = self._find_agent_by_name(name)
        if existing is not None:
            return existing
        model_name = settings.azure_openai_agent_model
        if not model_name:
            raise RuntimeError("Azure AI Foundry agent model is not configured")
        try:
            agent = self._client.agents.create_agent(
                name=name,
                model=model_name,
                instructions=CODE_EVALUATION_SYSTEM_PROMPT,
            )
            _LOGGER.info("Created Azure AI Foundry agent '%s' with model '%s'", name, model_name)
            return agent
        except ResourceNotFoundError as exc:
            raise RuntimeError(
                "Azure AI Foundry could not find the model deployment ''%s''. "
                "Check AZURE_AI_AGENT_MODEL and ensure the deployment exists in the project." % model_name
            ) from exc
        except HttpResponseError as exc:
            raise RuntimeError("Failed to create Azure AI Foundry agent") from exc

    def _find_agent_by_name(self, identifier: str) -> Optional[Any]:
        try:
            agents = self._client.agents.list_agents()
            for agent in agents:
                agent_name = getattr(agent, "name", None)
                if agent_name == identifier:
                    return agent
        except ResourceNotFoundError:
            return None
        except HttpResponseError as exc:
            raise RuntimeError("Failed to list Azure AI Foundry agents") from exc
        return None

    def _extract_assistant_text(self, run: Any) -> str:
        list_kwargs = {"thread_id": run.thread_id, "order": "desc"}
        run_id = getattr(run, "id", None)
        if run_id:
            list_kwargs["run_id"] = run_id

        try:
            messages_client = getattr(self._client.agents, "messages", None)
            if messages_client is not None and hasattr(messages_client, "list"):
                messages = messages_client.list(**list_kwargs)
            else:
                list_messages = getattr(self._client.agents, "list_messages")
                messages = list_messages(**list_kwargs)
        except HttpResponseError as exc:  # pragma: no cover - network issues
            raise RuntimeError("Failed to read agent messages") from exc
        except AttributeError as exc:  # pragma: no cover - SDK mismatch
            raise RuntimeError("Azure AI Foundry SDK does not expose a message listing API") from exc

        for message in messages:
            # ThreadMessage implements MutableMapping so we can safely convert.
            message_dict = message.as_dict()
            if message_dict.get("role") != "assistant":
                continue
            for item in message_dict.get("content", []):
                if item.get("type") != "text":
                    continue
                text_payload = item.get("text")
                if isinstance(text_payload, dict):
                    value = text_payload.get("value") or text_payload.get("text")
                else:
                    value = text_payload
                if isinstance(value, str):
                    return value
        raise RuntimeError("Agent response did not include assistant text content")

    def _parse_evaluation(self, raw_text: str) -> EvaluationResult:
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            _LOGGER.warning("Agent response was not valid JSON: %s", raw_text)
            parsed = {}

        score_value = parsed.get("score")
        if isinstance(score_value, str):
            try:
                score_value = float(score_value)
            except ValueError:
                score_value = None
        elif not isinstance(score_value, (int, float)):
            score_value = None

        reasoning = parsed.get("reasoning") if isinstance(parsed.get("reasoning"), str) else None
        suggestion = parsed.get("suggestion") if isinstance(parsed.get("suggestion"), str) else None

        return EvaluationResult(
            score=float(score_value) if isinstance(score_value, (int, float)) else None,
            reasoning=reasoning,
            suggestion=suggestion,
        )


async def download_repository_archive(repository_url: str, destination: Path, token: Optional[str]) -> None:
    owner, repo = _parse_github_repo(repository_url)
    zip_url = f"https://api.github.com/repos/{owner}/{repo}/zipball/main"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "code-evaluator",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        response = await client.get(zip_url, headers=headers)
        response.raise_for_status()
    destination.write_bytes(response.content)


def summarize_repository(root: Path, limit: int = 50) -> List[Dict[str, str]]:
    files: List[Dict[str, str]] = []
    for index, path in enumerate(_iter_repo_files(root)):
        if index >= limit:
            break
        content = path.read_text(encoding="utf-8", errors="ignore")
        files.append({
            "path": str(path.relative_to(root)),
            "snippet": content[:2000],
        })
    return files


def _iter_repo_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if path.is_file() and path.stat().st_size <= 200_000:  # skip large binaries
            yield path


def _parse_github_repo(url: str) -> Tuple[str, str]:
    parsed = urlparse(url)
    segments = [segment for segment in parsed.path.split("/") if segment]
    if len(segments) < 2:
        raise ValueError(f"Invalid GitHub repository URL: {url}")
    return segments[0], segments[1]


class EvaluationService:
    """Coordinates evaluations across repositories and criteria."""

    def __init__(self, db_client: Optional[CosmosDBClient] = None) -> None:
        self.db_client = db_client or get_db_client()

    async def run_for_challenge(self, challenge_id: str, criteria_ids: Optional[List[str]] = None) -> None:
        challenge = self.db_client.get_challenge(challenge_id)
        if not challenge:
            raise ValueError(f"Challenge {challenge_id} not found")
        agent_client = self._ensure_challenge_agent(challenge)
        criteria = self._load_criteria(challenge_id, criteria_ids)
        repositories = self.db_client.list_repositories(challenge_id)
        for criterion in criteria:
            for repo_doc in repositories:
                repo = RepositoryContext(
                    repository_id=repo_doc["id"],
                    challenge_id=challenge_id,
                    name=repo_doc["name"],
                    url=repo_doc["url"],
                )
                evaluation_doc = self._ensure_evaluation_doc(repo, criterion)
                orchestrator = EvaluationOrchestrator(
                    db_client=self.db_client,
                    evaluation_doc=evaluation_doc,
                    repository=repo,
                    criteria=criterion,
                    agent_client=agent_client,
                )
                await orchestrator.run()

    def _ensure_challenge_agent(self, challenge_doc: Dict[str, Any]) -> AzureAgentClient:
        agent_id = challenge_doc.get("agent_id")
        agent_name = challenge_doc.get("name")
        if not agent_name:
            raise RuntimeError(f"Challenge '{challenge_doc.get('id')}' is missing a name for agent provisioning")
        agent_client = AzureAgentClient(
            agent_name=agent_name,
            agent_id=agent_id,
        )
        if agent_client.agent_id != agent_id:
            challenge_doc["agent_id"] = agent_client.agent_id
            self.db_client.create_challenge(challenge_doc)
        return agent_client

    def _ensure_evaluation_doc(self, repo: RepositoryContext, criterion: Dict) -> Dict:
        base_payload = {
            "id": f"{repo.repository_id}:{criterion['id']}",
            "repository_id": repo.repository_id,
            "challenge_id": repo.challenge_id,
            "criteria_id": criterion["id"],
            "criteria_name": criterion["name"],
            "state": EvaluationState.NOT_EVALUATED.value,
            "updated_at": datetime.utcnow().isoformat(),
        }
        return self.db_client.create_evaluation(base_payload)

    def _load_criteria(self, challenge_id: str, criteria_ids: Optional[List[str]]) -> List[Dict]:
        all_criteria = self.db_client.list_criteria(challenge_id)
        if criteria_ids:
            filtered = [criterion for criterion in all_criteria if criterion["id"] in criteria_ids]
            return filtered
        return all_criteria
