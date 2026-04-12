import type { Metadata } from "next";
import { MatchPredictionsContent } from "./match-predictions-content";
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

const PRED_FAQ_KEYS = [
  { q: "faq.pred.q1", a: "faq.pred.a1" },
  { q: "faq.pred.q2", a: "faq.pred.a2" },
  { q: "faq.pred.q3", a: "faq.pred.a3" },
  { q: "faq.pred.q4", a: "faq.pred.a4" },
  { q: "faq.pred.q5", a: "faq.pred.a5" },
  { q: "faq.pred.q6", a: "faq.pred.a6" },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/match-predictions"]?.[locale] ?? PAGE_META["/match-predictions"].en;
  const alternates = getLocalizedAlternates("/match-predictions");

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

export default function MatchPredictionsPage() {
  const locale = getServerLocale();
  const faqItems = getLocalizedFaq(PRED_FAQ_KEYS);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.matchPredictions", canonicalPath: "/match-predictions" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <MatchPredictionsContent />
      <FaqSection
        title={translate(locale, "faqTitle.predictions" as any)}
        subtitle={translate(locale, "faqTitle.predictionsSub" as any)}
        items={faqItems}
      />
    </>
  );
}
