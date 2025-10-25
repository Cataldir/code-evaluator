"""FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import challenges, criteria, evaluations, repositories
from .database import get_db_client

_LOGGER = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # pragma: no cover - lifecycle hook
    _LOGGER.info("Starting backend application")
    get_db_client()  # eager initialize connection pool
    yield
    _LOGGER.info("Shutting down backend application")


app = FastAPI(title="Code Evaluator Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(challenges.router)
app.include_router(criteria.router)
app.include_router(repositories.router)
app.include_router(evaluations.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
