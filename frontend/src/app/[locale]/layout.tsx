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

  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}
