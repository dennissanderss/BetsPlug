import type { Metadata } from "next";
import { TrackRecordContent } from "./track-record-content";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedFaq,
  getLocalizedBreadcrumbs,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";
import { translate } from "@/i18n/messages";

const TRACK_FAQ_KEYS = [
  { q: "faq.track.q1", a: "faq.track.a1" },
  { q: "faq.track.q2", a: "faq.track.a2" },
  { q: "faq.track.q3", a: "faq.track.a3" },
  { q: "faq.track.q4", a: "faq.track.a4" },
  { q: "faq.track.q5", a: "faq.track.a5" },
  { q: "faq.track.q6", a: "faq.track.a6" },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/track-record"]?.[locale] ?? PAGE_META["/track-record"].en;
  const alternates = getLocalizedAlternates("/track-record");

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
    },
  };
}

export default function TrackRecordPage() {
  const locale = getServerLocale();
  const faqItems = getLocalizedFaq(TRACK_FAQ_KEYS);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.trackRecord", canonicalPath: "/track-record" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <TrackRecordContent
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
