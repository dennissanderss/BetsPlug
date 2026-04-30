import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EngineContent } from "./engine-content";
import {
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { PAGE_META } from "@/data/page-meta";
import { isLocale, locales, type Locale } from "@/i18n/config";

export const dynamic = "force-static";
export const revalidate = 300;

type Params = { locale: string };

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;

  const meta = PAGE_META["/engine"]?.[locale] ?? PAGE_META["/engine"].en;
  const alternates = getLocalizedAlternates("/engine", undefined, locale);
  const og = getOpenGraphLocales(locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      type: "article",
      locale: og.locale,
      alternateLocale: og.alternateLocales,
    },
  };
}

export default async function EnginePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "nav.engine", canonicalPath: "/engine" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <EngineContent />
    </>
  );
}
