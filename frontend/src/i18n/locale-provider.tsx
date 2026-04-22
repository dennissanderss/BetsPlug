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

    // Remember the UI choice so the switcher can highlight it
    // after reload.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Drive Google Translate via its `googtrans` cookie. The widget
    // is loaded once in layout.tsx; on page load it reads this cookie
    // and transforms the DOM in place — no URL change, no SSR
    // translation, no SEO surface (Google sees the untranslated EN).
    //
    // Setting EN clears the cookie (both host-only + domain-scoped
    // variants) so reload shows the original source.
    const clearGoogtrans = () => {
      document.cookie = "googtrans=; path=/; max-age=0";
      // Google Translate also sometimes writes to the registrable
      // domain (e.g. `.betsplug.com`), so clear that variant too.
      const host = window.location.hostname;
      const parts = host.split(".");
      const registrable =
        parts.length >= 2 ? `.${parts.slice(-2).join(".")}` : `.${host}`;
      document.cookie = `googtrans=; path=/; domain=${registrable}; max-age=0`;
    };

    if (next === defaultLocale) {
      clearGoogtrans();
    } else {
      // Google Translate expects /<source>/<target>. Our locale codes
      // line up with its ISO-639-1 codes (nl, de, fr, es, it, sw, id).
      document.cookie = `googtrans=/en/${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    }

    // Reload so the widget picks up the new cookie on the next paint.
    window.location.reload();
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
 * Passthrough href helper kept for call-site compatibility.
 *
 * URLs are English-only since 2026-04-22 — the middleware
 * 308-redirects any /xx/ prefix to the canonical EN path and
 * Google Translate handles visitor-facing translation client-
 * side. Every internal href stays on the English URL.
 *
 * External URLs (http…) and hash/query fragments still pass
 * through untouched.
 */
export function useLocalizedHref() {
  return useCallback((href: string) => href, []);
}
