"""Dependency helpers for localization."""

from __future__ import annotations

from typing import Protocol

from fastapi import Depends, Request

from .constants import DEFAULT_LOCALE
from .manager import translate


def get_request_locale(request: Request) -> str:
    """Retrieve the locale stored on the request."""

    return getattr(request.state, "locale", DEFAULT_LOCALE)

class Translator(Protocol):
    """Callable contract for translating messages."""

    def __call__(self, key: str, *, default: str | None = None, values: dict | None = None) -> str:
        ...


def get_translator(locale: str = Depends(get_request_locale)) -> Translator:
    """Return a translation function bound to the request locale."""

    def _translator(key: str, *, default: str | None = None, values: dict | None = None) -> str:
        return translate(key, locale=locale, default=default, values=values)

    return _translator
