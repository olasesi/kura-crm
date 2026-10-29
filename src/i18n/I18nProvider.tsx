import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { fr } from "./dictionaries/fr";
import { sw } from "./dictionaries/sw";

export type LanguageCode = "en" | "fr" | "es" | "sw";
export type Direction = "ltr" | "rtl";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  dir: Direction;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr" },
  { code: "es", label: "Spanish", nativeLabel: "Español", dir: "ltr" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili", dir: "ltr" },
];

const DICTIONARIES = { en, fr, es, sw } as const;

const STORAGE_KEY = "kura-crm.language";

export interface I18nValue {
  language: LanguageCode;
  dir: Direction;
  languages: LanguageOption[];
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const translate = (language: LanguageCode, key: string, fallback?: string): string => {
  const dictionary = DICTIONARIES[language] as Record<string, string | undefined>;
  return dictionary[key] ?? en[key as keyof typeof en] ?? fallback ?? key;
};

const readStoredLanguage = (): LanguageCode => {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && stored in DICTIONARIES) {
    return stored as LanguageCode;
  }
  const browser = window.navigator.language?.slice(0, 2).toLowerCase();
  if (browser && browser in DICTIONARIES) {
    return browser as LanguageCode;
  }
  return "en";
};

const I18nContext = createContext<I18nValue>({
  language: "en",
  dir: "ltr",
  languages: LANGUAGES,
  setLanguage: () => undefined,
  t: (key, fallback) => translate("en", key, fallback),
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(readStoredLanguage);

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable in private mode; the in-memory value still works.
    }
  }, []);

  const dir = LANGUAGES.find((item) => item.code === language)?.dir ?? "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const t = useCallback(
    (key: string, fallback?: string) => translate(language, key, fallback),
    [language],
  );

  const value = useMemo<I18nValue>(
    () => ({ language, dir, languages: LANGUAGES, setLanguage, t }),
    [language, dir, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nValue => useContext(I18nContext);
