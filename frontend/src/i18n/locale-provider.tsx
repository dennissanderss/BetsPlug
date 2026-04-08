"use client";

/**
 * Client-side locale provider
 * ────────────────────────────────────────────────────────────
 * Stores the active locale in a React Context. Components can
 * consume translations via `useTranslations()` → `t(key)`.
 *
 * The locale itself is determined server-side (middleware sets
 * the `NEXT_LOCALE` cookie / URL prefix), then passed down from
 * the root layout. `setLocale()` persists the choice to the
 * cookie so subsequent navigations keep the language.
 */

import { createContext, useCallback, useContext, useMemo } from "react";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "./config";
import { translate, type TranslationKey } from "./messages";

type LocaleContextValue = {
  locale: Locale;
  t: (key: TranslationKey) => string;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = useCallback(
    (key: TranslationKey) => translate(locale, key),
    [locale]
  );

  const setLocale = useCallback((next: Locale) => {
    if (typeof document === "undefined") return;
    // 1 year cookie, root path so it applies everywhere.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Rewrite the current URL to carry the locale prefix so that
    // hreflang + server rendering pick it up on next navigation.
    const url = new URL(window.location.href);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length && (locales as readonly string[]).includes(segments[0])) {
      segments.shift();
    }
    const rest = segments.join("/");
    url.pathname = next === defaultLocale ? `/${rest}` : `/${next}${rest ? `/${rest}` : ""}`;
    if (!url.pathname.startsWith("/")) url.pathname = "/" + url.pathname;
    window.location.href = url.toString();
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useTranslations() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Safe fallback so non-wrapped components still render English.
    return {
      locale: defaultLocale,
      t: (key: TranslationKey) => translate(defaultLocale, key),
      setLocale: () => {},
    };
  }
  return ctx;
}
