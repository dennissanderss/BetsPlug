import type { Metadata } from "next";
import { TrackRecordContent } from "./track-record-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";

const TRACK_RECORD_FAQS = [
  {
    question: "How is the track record verified?",
    answer:
      "Every prediction is timestamped and logged before kick-off. Results are matched automatically from official data feeds, so our AI prediction track record cannot be edited or cherry-picked after the fact.",
  },
  {
    question: "What does the Brier score mean?",
    answer:
      "The Brier score measures how close our probability forecasts are to actual outcomes. Lower is better — a score of 0 is perfect. We use it to benchmark our football analytics models against the market.",
  },
  {
    question: "How far back does the track record go?",
    answer:
      "Our public track record covers every prediction since launch. Historical data spans multiple seasons across top European leagues, giving you a long-term view of our AI prediction accuracy and calibration.",
  },
  {
    question: "Do you show losses too?",
    answer:
      "Absolutely. Full transparency is a core principle. We display every win, loss, and void so you can evaluate our Elo-based predictions honestly — no hidden results or selective reporting of value bets.",
  },
  {
    question: "What leagues are tracked?",
    answer:
      "We track all leagues with live data syncs including the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, and Eredivisie. Each league has its own Elo ratings, expected goals models, and accuracy stats.",
  },
  {
    question: "How often is the track record updated?",
    answer:
      "The track record updates automatically after every match day. Final results, profit/loss figures, and Brier scores refresh within hours of the last whistle so our football prediction stats stay current.",
  },
];

/* ── Per-page SEO metadata ─────────────────────────────────────
   The track-record page is one of BetsPlug's highest-trust
   entry points, so it gets its own rich metadata -- distinct
   title, description and canonical URL.                         */
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
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Track Record", href: "/track-record" },
        ]}
      />
      <TrackRecordContent />
      <FaqSection
        title="Track Record FAQ"
        subtitle="How we measure and share our prediction performance."
        items={TRACK_RECORD_FAQS}
      />
    </>
  );
}
