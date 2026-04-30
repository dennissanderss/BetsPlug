import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HowItWorksContent } from "./how-it-works-content";
import {
  getLocalizedAlternates,
  getLocalizedFaq,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { fetchHowItWorksPage } from "@/lib/sanity-data";
import { isLocale, locales, type Locale } from "@/i18n/config";

export const dynamic = "force-static";
export const revalidate = 60;

type Params = { locale: string };

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

const HOW_FAQ_KEYS = [
  { q: "faq.how.q1", a: "faq.how.a1" },
  { q: "faq.how.q2", a: "faq.how.a2" },
  { q: "faq.how.q3", a: "faq.how.a3" },
  { q: "faq.how.q4", a: "faq.how.a4" },
  { q: "faq.how.q5", a: "faq.how.a5" },
  { q: "faq.how.q6", a: "faq.how.a6" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;

  const meta = PAGE_META["/how-it-works"]?.[locale] ?? PAGE_META["/how-it-works"].en;
  const alternates = getLocalizedAlternates("/how-it-works", undefined, locale);
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

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const [howItWorksPage] = await Promise.all([fetchHowItWorksPage()]);
  const faqItems = getLocalizedFaq(HOW_FAQ_KEYS, locale);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.howItWorks", canonicalPath: "/how-it-works" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FaqJsonLd items={faqItems} />
      <HowItWorksContent howItWorksPage={howItWorksPage} />
    </>
  );
}
