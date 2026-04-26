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
import {
  defaultLocale,
  ENABLED_LOCALES,
  LOCALE_COOKIE,
  isEnabledLocale,
  type Locale,
} from "./config";
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

    // Hard guard: only ENABLED_LOCALES are user-selectable. The
    // language switcher already filters its options to this set,
    // but a programmatic call (or stale cookie) could otherwise
    // pin a parked locale that has no maintained translations.
    if (!isEnabledLocale(next)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[i18n] setLocale("${next}") rejected — not in ENABLED_LOCALES (${ENABLED_LOCALES.join(", ")}). Falling back to default.`,
      );
      return;
    }

    // 1 year cookie, root path so it applies everywhere.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Navigate to the localized URL so SSR renders the new
    // language. The middleware rewrites /xx/ to the canonical
    // page file and sets `x-locale` so generateMetadata + the
    // page see the right locale.
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
 * href and returns the localized URL for the current locale, so
 * a visitor on /de/ clicking an internal link stays on /de/ and
 * the SSR for that route keeps rendering in German.
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
