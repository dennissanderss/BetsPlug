import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactContent } from "./contact-content";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import {
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { fetchContactPage } from "@/lib/sanity-data";
import { PAGE_META } from "@/data/page-meta";
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

  const meta = PAGE_META["/contact"]?.[locale] ?? PAGE_META["/contact"].en;
  const alternates = getLocalizedAlternates("/contact", undefined, locale);
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

export default async function ContactPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const [contactPage] = await Promise.all([fetchContactPage()]);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.contact", canonicalPath: "/contact" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ContactContent contactPage={contactPage} />
    </>
  );
}
