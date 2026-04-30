import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchPredictionsContent } from "./match-predictions-content";
import {
  getLocalizedAlternates,
  getLocalizedFaq,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";
import { translate } from "@/i18n/messages";
import { isLocale, locales, type Locale } from "@/i18n/config";

export const dynamic = "force-static";
export const revalidate = 60;

type Params = { locale: string };

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

const PRED_FAQ_KEYS = [
  { q: "faq.pred.q1", a: "faq.pred.a1" },
  { q: "faq.pred.q2", a: "faq.pred.a2" },
  { q: "faq.pred.q3", a: "faq.pred.a3" },
  { q: "faq.pred.q4", a: "faq.pred.a4" },
  { q: "faq.pred.q5", a: "faq.pred.a5" },
  { q: "faq.pred.q6", a: "faq.pred.a6" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;

  const meta = PAGE_META["/match-predictions"]?.[locale] ?? PAGE_META["/match-predictions"].en;
  const alternates = getLocalizedAlternates("/match-predictions", undefined, locale);
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

export default async function MatchPredictionsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const faqItems = getLocalizedFaq(PRED_FAQ_KEYS, locale);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.matchPredictions", canonicalPath: "/match-predictions" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FaqJsonLd items={faqItems} />
      <MatchPredictionsContent
        faqSlot={
          <FaqSection
            title={translate(locale, "faqTitle.predictions" as any)}
            subtitle={translate(locale, "faqTitle.predictionsSub" as any)}
            items={faqItems}
          />
        }
      />
    </>
  );
}
