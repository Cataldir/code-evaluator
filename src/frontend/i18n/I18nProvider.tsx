"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import enMessages from "./locales/en/common.json";
import ptMessages from "./locales/pt/common.json";
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES, type Locale } from "./settings";

type MessageTree = { [key: string]: string | MessageTree };

const SUPPORTED_MESSAGES: Record<Locale, MessageTree> = {
  en: enMessages,
  pt: ptMessages,
};

type TranslateOptions = {
  values?: Record<string, string | number>;
  fallback?: string;
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  t: (key: string, options?: TranslateOptions) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolveMessage(messages: MessageTree, key: string): string | undefined {
  return key.split(".").reduce<string | MessageTree | undefined>((acc, segment) => {
    if (acc === undefined) {
      return undefined;
    }
    if (typeof acc === "string") {
      return undefined;
    }
    return acc[segment];
  }, messages) as string | undefined;
}

function formatMessage(template: string, values?: Record<string, string | number>): string {
  if (!values) {
    return template;
  }
  return template.replace(/\{\{(.*?)\}\}/g, (_, token: string) => {
    const trimmed = token.trim();
    const replacement = values[trimmed];
    return replacement !== undefined ? String(replacement) : "";
  });
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  const navigatorLocale = window.navigator.language?.split("-")[0] as Locale | undefined;
  if (navigatorLocale && SUPPORTED_LOCALES.includes(navigatorLocale)) {
    return navigatorLocale;
  }
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocaleState(initialLocale);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (key: string, options?: TranslateOptions) => {
      const messages = SUPPORTED_MESSAGES[locale];
      const resolved = resolveMessage(messages as MessageTree, key);
      const fallback = options?.fallback ?? key;
      const template = resolved ?? fallback;
      return formatMessage(template, options?.values);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export { SUPPORTED_LOCALES } from "./settings";
export type { Locale } from "./settings";
