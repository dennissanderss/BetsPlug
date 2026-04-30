import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackRecordContent } from "./track-record-content";
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
import { fetchTrackRecordPage } from "@/lib/sanity-data";
import { isLocale, locales, type Locale } from "@/i18n/config";

export const dynamic = "force-static";
export const revalidate = 60;

type Params = { locale: string };

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

const TRACK_FAQ_KEYS = [
  { q: "faq.track.q1", a: "faq.track.a1" },
  { q: "faq.track.q2", a: "faq.track.a2" },
  { q: "faq.track.q3", a: "faq.track.a3" },
  { q: "faq.track.q4", a: "faq.track.a4" },
  { q: "faq.track.q5", a: "faq.track.a5" },
  { q: "faq.track.q6", a: "faq.track.a6" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;

  const meta = PAGE_META["/track-record"]?.[locale] ?? PAGE_META["/track-record"].en;
  const alternates = getLocalizedAlternates("/track-record", undefined, locale);
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

export default async function TrackRecordPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const [trackRecordPage] = await Promise.all([fetchTrackRecordPage()]);
  const faqItems = getLocalizedFaq(TRACK_FAQ_KEYS, locale);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.trackRecord", canonicalPath: "/track-record" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FaqJsonLd items={faqItems} />
      <TrackRecordContent
        trackRecordPage={trackRecordPage}
        faqSlot={
          <FaqSection
            title={translate(locale, "faqTitle.trackRecord" as any)}
            subtitle={translate(locale, "faqTitle.trackRecordSub" as any)}
            items={faqItems}
          />
        }
      />
    </>
  );
}
