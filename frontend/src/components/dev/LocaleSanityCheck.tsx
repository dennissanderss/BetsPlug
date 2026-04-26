"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";

/**
 * Dev-only sanity check that reads the rendered <main> text and
 * detects whether the dominant language matches the URL locale.
 *
 * Catches the class of bug where a component hardcodes a string
 * in a different language (e.g. a Dutch banner on a German page).
 * Logs a single console.error per (locale, mismatch) and tags
 * the offending text snippet so devs can grep for it.
 *
 * Production: renders nothing, no franc bundle pulled in (the
 * dynamic import lives behind the NODE_ENV guard).
 */

const EXPECTED_LANG: Partial<Record<Locale, string>> = {
  en: "eng",
  nl: "nld",
  de: "deu",
  fr: "fra",
  es: "spa",
  it: "ita",
  // Parked locales are intentionally not surfaced — even if a
  // user lands on /pt/, we don't want noise from a parked locale.
};

// franc-min struggles on short Latin-script strings (Dutch vs
// German false-positives below ~80 chars). 200 keeps signal high.
const MIN_LENGTH = 200;

export function LocaleSanityCheck({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const expected = EXPECTED_LANG[locale];
    if (!expected) return;

    let cancelled = false;

    // Wait one tick for client-side React to paint, then sample.
    const timer = setTimeout(async () => {
      if (cancelled) return;

      const main = document.querySelector("main");
      const root =
        (main as HTMLElement | null) ??
        (document.body as HTMLElement | null);
      if (!root) return;

      // Strip elements that legitimately mix languages: brand spans,
      // language switcher, code blocks, navigation.
      const clone = root.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll(
          "[data-i18n-skip], code, pre, kbd, [aria-label*='language'], [aria-label*='taal'], nav[aria-label*='Breadcrumb']",
        )
        .forEach((n) => n.remove());

      const text = clone.innerText.replace(/\s+/g, " ").trim();
      if (text.length < MIN_LENGTH) return;

      // Dynamic import so franc-min never enters the production
      // bundle (the NODE_ENV check above already guards calls).
      const { franc } = await import("franc-min");
      if (cancelled) return;
      const detected = franc(text.slice(0, 4000), { minLength: MIN_LENGTH });

      if (detected !== "und" && detected !== expected) {
        // Find a 200-char window in the dominant language that's
        // likely the offending fragment. Naive: just slice the
        // start of the sample.
        const snippet = text.slice(0, 200);
        // eslint-disable-next-line no-console
        console.error(
          `[i18n] LocaleSanityCheck: page is /${locale}/ but content reads as '${detected}' (expected '${expected}').\n` +
            `Sample: "${snippet}…"\n` +
            `Likely cause: hardcoded string outside t() in a component on this route.`,
        );
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [locale]);

  return null;
}
