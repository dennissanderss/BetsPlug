import type { Metadata } from "next";
import { MatchPredictionsContent } from "./match-predictions-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";

const MATCH_PREDICTIONS_FAQS = [
  {
    question: "How are match predictions generated?",
    answer:
      "Our engine combines Elo ratings, expected goals (xG), recent form, and dozens of contextual features. A machine-learning pipeline processes these inputs to produce calibrated AI predictions for every fixture.",
  },
  {
    question: "How accurate are the predictions?",
    answer:
      "Accuracy varies by league and market, but our models consistently beat naive baselines and bookmaker-implied odds. Check our public track record and Brier scores for detailed, independently verifiable stats.",
  },
  {
    question: "When are predictions published?",
    answer:
      "AI predictions are typically available 24-48 hours before kick-off once team news and the latest Elo ratings have been factored in. Odds and value flags update right up until the match starts.",
  },
  {
    question: "Which markets are covered?",
    answer:
      "We cover 1X2 (match result), over/under goals, both teams to score, and Asian handicap markets. Each market shows win probabilities derived from our expected goals and football analytics models.",
  },
  {
    question: "Can I get predictions for free?",
    answer:
      "Yes — a selection of upcoming match predictions is available for free on this page. Premium members unlock every fixture, full probability breakdowns, value betting alerts, and advanced Elo analytics.",
  },
  {
    question: "How do I interpret the probability scores?",
    answer:
      "Each prediction shows a percentage reflecting the model's confidence. Compare these AI-generated probabilities with bookmaker odds to spot value bets where the true chance exceeds the implied odds.",
  },
];

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
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Match Predictions", href: "/match-predictions" },
        ]}
      />
      <MatchPredictionsContent />
      <FaqSection
        title="Football Predictions FAQ"
        subtitle="Everything you need to know about our AI match predictions."
        items={MATCH_PREDICTIONS_FAQS}
      />
    </>
  );
}
