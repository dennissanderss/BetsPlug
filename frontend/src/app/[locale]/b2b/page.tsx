import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { B2BContent } from "./b2b-content";
import {
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { fetchB2bPage } from "@/lib/sanity-data";
import { isLocale, locales, type Locale } from "@/i18n/config";

export const dynamic = "force-static";
export const revalidate = 60;

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

  const meta = PAGE_META["/b2b"]?.[locale] ?? PAGE_META["/b2b"].en;
  const alternates = getLocalizedAlternates("/b2b", undefined, locale);
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
      type: "website",
      locale: og.locale,
      alternateLocale: og.alternateLocales,
    },
  };
}

export default async function B2BPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const [b2bPage] = await Promise.all([fetchB2bPage()]);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.b2b", canonicalPath: "/b2b" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <B2BContent b2bPage={b2bPage} />
    </>
  );
}
