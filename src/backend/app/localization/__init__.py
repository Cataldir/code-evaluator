"""Localization module exports."""

from .constants import DEFAULT_LOCALE, SUPPORTED_LOCALES
from .dependencies import Translator, get_request_locale, get_translator
from .manager import translate
from .middleware import LocalizationMiddleware

__all__ = (
  "DEFAULT_LOCALE",
  "SUPPORTED_LOCALES",
  "LocalizationMiddleware",
  "Translator",
  "get_request_locale",
  "get_translator",
  "translate",
)
