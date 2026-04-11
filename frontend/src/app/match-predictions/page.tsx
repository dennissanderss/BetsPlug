import type { Metadata } from "next";
import { MatchPredictionsContent } from "./match-predictions-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

/**
 * Public marketing teaser for the prediction engine.
 * Shows 3 upcoming matches with full probabilities, then
 * blurs the rest behind an "Unlock all games" paywall CTA.
 * Data comes from the same public /fixtures/upcoming endpoint
 * used on the members-only /predictions page.
 */
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
  return <MatchPredictionsContent />;
}
