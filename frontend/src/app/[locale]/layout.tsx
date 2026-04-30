import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LocaleProvider } from "@/i18n/locale-provider";
import { isLocale, locales, type Locale } from "@/i18n/config";

/**
 * Nested layout for locale-aware static routes.
 * ────────────────────────────────────────────────────────────
 * Wraps every page under `app/[locale]/...` in a LocaleProvider
 * whose locale comes from the URL parameter — NOT from cookies
 * or headers — so the whole subtree can be statically pre-rendered
 * for each value `generateStaticParams()` returns.
 *
 * The root `<html>` element lives in app/layout.tsx with
 * `lang="en"` (Next.js requires html/body in the root layout
 * only and doesn't allow it elsewhere). Per-locale signals come
 * from og:locale, hreflang, body content and meta tags — Google
 * detects language from those just as well.
 */

type Params = { locale: string };

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  return (
    <LocaleProvider locale={locale}>
      {/* Skip-to-content link — sr-only by default, becomes visible
          on keyboard focus. WCAG 2.4.1 (Bypass Blocks) and meets
          screen-reader user expectation. The id="main" lives on
          the implicit <main> wrapper Next emits for [locale] pages
          via the rendered children's first <main>/<section>. We
          place the link at the start of the locale subtree so it
          appears first in the tab order on every public page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#0d1321] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#ededed] focus:ring-2 focus:ring-[#4ade80]"
      >
        Skip to main content
      </a>
      <main id="main">{children}</main>
    </LocaleProvider>
  );
}
