"""Translation management utilities."""

from __future__ import annotations

import json
from functools import lru_cache
from importlib import resources
from typing import Any, Mapping

from .constants import DEFAULT_LOCALE, SUPPORTED_LOCALES

MessageTree = Mapping[str, Any]


def _load_messages(locale: str) -> MessageTree:
    target_locale = locale if locale in SUPPORTED_LOCALES else DEFAULT_LOCALE
    package = "app.localization.locales"
    filename = f"{target_locale}.json"
    try:
        with resources.files(package).joinpath(filename).open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        if target_locale == DEFAULT_LOCALE:
            raise
        with resources.files(package).joinpath(f"{DEFAULT_LOCALE}.json").open("r", encoding="utf-8") as handle:
            return json.load(handle)


@lru_cache(maxsize=len(SUPPORTED_LOCALES) + 1)
def get_messages(locale: str) -> MessageTree:
    """Return cached messages for the given locale."""

    return _load_messages(locale)


def _resolve_message(messages: MessageTree, key: str) -> str | None:
    parts = key.split(".")
    current: Any = messages
    for part in parts:
        if not isinstance(current, Mapping) or part not in current:
            return None
        current = current[part]
    return current if isinstance(current, str) else None


def _format_message(template: str, values: Mapping[str, Any] | None) -> str:
    if not values:
        return template
    formatted = template
    for raw_key, raw_value in values.items():
        formatted = formatted.replace(f"{{{{{raw_key}}}}}", str(raw_value))
    return formatted


def translate(key: str, *, locale: str, default: str | None = None, values: Mapping[str, Any] | None = None) -> str:
    """Translate a key for the given locale with optional interpolation."""

    messages = get_messages(locale)
    resolved = _resolve_message(messages, key)
    base = resolved if resolved is not None else (default if default is not None else key)
    return _format_message(base, values)
