"""Helpers for locale negotiation."""

from __future__ import annotations

from .constants import DEFAULT_LOCALE, SUPPORTED_LOCALES


def normalize_locale(candidate: str | None) -> str:
    """Return the best-matching locale for a given candidate string."""

    if not candidate:
        return DEFAULT_LOCALE

    normalized = candidate.split("-")[0].lower()
    if normalized in SUPPORTED_LOCALES:
        return normalized
    return DEFAULT_LOCALE


def parse_accept_language(header_value: str | None) -> str:
    """Resolve a locale from an Accept-Language header."""

    if not header_value:
        return DEFAULT_LOCALE

    for entry in header_value.split(","):
        locale_part = entry.split(";")[0].strip()
        if locale_part:
            locale = normalize_locale(locale_part)
            if locale in SUPPORTED_LOCALES:
                return locale
    return DEFAULT_LOCALE
