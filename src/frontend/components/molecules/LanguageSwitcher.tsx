"use client";

import { ChangeEvent } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { SUPPORTED_LOCALES } from "@/i18n/settings";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    if (SUPPORTED_LOCALES.includes(nextLocale as typeof SUPPORTED_LOCALES[number])) {
      setLocale(nextLocale as typeof SUPPORTED_LOCALES[number]);
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <label htmlFor="language-selector" className="block font-semibold text-neonBlue">
        {t("app.languageLabel")}
      </label>
      <select
        id="language-selector"
        className="w-full rounded-lg border border-neonBlue/40 bg-night/60 px-3 py-2 text-neonPink focus:border-neonPink focus:outline-none"
        value={locale}
        onChange={handleChange}
      >
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {t(`app.languages.${supportedLocale}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
