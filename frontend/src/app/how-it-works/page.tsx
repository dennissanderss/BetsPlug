import type { Metadata } from "next";
import { HowItWorksContent } from "./how-it-works-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";

/* ── Per-page SEO metadata ─────────────────────────────────────
   The How-It-Works page is the main trust-building entry point
   for prospects doing due diligence. It gets dedicated title,
   description, canonical URL and OpenGraph tags.               */
export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/how-it-works"]?.[locale] ?? PAGE_META["/how-it-works"].en;
  const alternates = getLocalizedAlternates("/how-it-works");

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

export default function HowItWorksPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "How It Works", href: "/how-it-works" },
        ]}
      />
      <FaqJsonLd
        items={[
          {
            question: "How accurate are your predictions?",
            answer:
              "Our 3-way match predictions (home/draw/away) hit around 50% accuracy. That\u2019s above the 33% random baseline, but we\u2019re honest - it\u2019s not a magic number. Every prediction is timestamped before kick-off and graded automatically after the match, so you can verify the track record yourself.",
          },
          {
            question: "What happens on a losing streak?",
            answer:
              "Losing predictions stay visible permanently. We publish them just as openly as the winners. Our Strategy Lab strategies were backtested on a 90-day sample, so we expect variance. Losing streaks happen - that\u2019s football.",
          },
          {
            question: "Why not just use one really smart model?",
            answer:
              "Because every model has blind spots. Our three models - Elo ratings, Poisson goal model and Logistic regression - each capture different patterns. The ensemble with weighted averaging consistently outperforms any single member.",
          },
          {
            question: "Can I actually profit from these predictions?",
            answer:
              "Our backtested strategies show positive ROI over 90 days, but backtesting is not a guarantee. Real-world performance depends on odds you get, timing, and variance. We provide the data and analysis - the rest is your call.",
          },
          {
            question: "Which football leagues do you cover?",
            answer:
              "We cover 70+ football competitions worldwide, including the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie and all major UEFA competitions. We\u2019re always adding more leagues as our models mature.",
          },
          {
            question: "Is this gambling advice?",
            answer:
              "No. BetsPlug is a football analytics platform. We publish probabilities, confidence scores and a verifiable track record. What you do with that information is entirely your decision.",
          },
        ]}
      />
      <HowItWorksContent />
    </>
  );
}
