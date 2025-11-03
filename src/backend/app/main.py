"""FastAPI application entry point."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import challenges, criteria, evaluations, repositories
from .database import get_db_client
from .localization import LocalizationMiddleware, Translator, get_translator
from .scheduler import start_scheduler

_LOGGER = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # pragma: no cover - lifecycle hook
    _LOGGER.info("Starting backend application")
    db_client = get_db_client()  # eager initialize connection pool
    scheduler_task = asyncio.create_task(start_scheduler(db_client))
    try:
        yield
    finally:
        scheduler_task.cancel()
        with suppress(asyncio.CancelledError):
            await scheduler_task
        _LOGGER.info("Shutting down backend application")


app = FastAPI(title="Code Evaluator Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(LocalizationMiddleware)
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


@app.get("/")
async def health(translator: Translator = Depends(get_translator)) -> dict[str, str]:
    return {"status": translator("common.status_ok")}
