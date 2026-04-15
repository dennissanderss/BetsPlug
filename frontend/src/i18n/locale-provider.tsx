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
import { defaultLocale, LOCALE_COOKIE, type Locale } from "./config";
import { translate, type TranslationKey } from "./messages";
import { translatePath } from "./routes";
import { formatMsg, type MessageVars } from "./format";

type LocaleContextValue = {
  locale: Locale;
  /**
   * Look up a translation key. When the template contains
   * `{name}` placeholders, pass a `vars` object to substitute them;
   * unknown placeholders are left verbatim.
   */
  t: (key: TranslationKey, vars?: MessageVars) => string;
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
    (key: TranslationKey, vars?: MessageVars) =>
      formatMsg(translate(locale, key), vars),
    [locale]
  );

  const setLocale = useCallback((next: Locale) => {
    if (typeof document === "undefined") return;
    // 1 year cookie, root path so it applies everywhere.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Translate the current URL from whatever locale it was in
    // into the target locale, preserving slugs and query string.
    const url = new URL(window.location.href);
    url.pathname = translatePath(url.pathname, next);
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
      t: (key: TranslationKey, vars?: MessageVars) =>
        formatMsg(translate(defaultLocale, key), vars),
      setLocale: () => {},
    };
  }
  return ctx;
}

/**
 * Returns a function that takes a canonical (English) internal
 * href and returns the localized URL for the current locale.
 * Pass as `href` to Next.js <Link> so that clicking navigates
 * to `/nl/voorspellingen` instead of `/predictions` etc.
 *
 * External URLs (http…) and hash/query fragments pass through.
 */
export function useLocalizedHref() {
  const { locale } = useTranslations();
  return useCallback(
    (href: string) => {
      if (!href) return href;
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;
      return translatePath(href, locale);
    },
    [locale]
  );
}
