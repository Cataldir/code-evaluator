export const LOCALE_STORAGE_KEY = "code-evaluator.locale" as const;

export const SUPPORTED_LOCALES = ["en", "pt"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
