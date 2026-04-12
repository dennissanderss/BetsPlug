import type { Metadata } from "next";
import { AboutContent } from "./about-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";

const ABOUT_FAQS = [
  {
    question: "Who founded BetsPlug?",
    answer:
      "BetsPlug was founded by a team of sports analytics engineers and football enthusiasts who saw an opportunity to bring AI-driven predictions and Elo rating models to everyday bettors looking for a data-first edge.",
  },
  {
    question: "Where is BetsPlug based?",
    answer:
      "BetsPlug operates as a fully remote company with team members across Europe. Our data infrastructure and football analytics pipelines run on cloud servers optimised for real-time match prediction delivery.",
  },
  {
    question: "Is BetsPlug a tipster or betting site?",
    answer:
      "Neither. BetsPlug is a football analytics platform that uses AI predictions, expected goals, and Elo ratings to surface value betting opportunities. We never place bets on your behalf or accept wagers.",
  },
  {
    question: "How does BetsPlug make money?",
    answer:
      "BetsPlug earns revenue through premium subscriptions that unlock full access to our AI prediction engine, advanced analytics dashboards, and in-depth value betting insights across all supported leagues.",
  },
  {
    question: "Is BetsPlug regulated?",
    answer:
      "BetsPlug is an analytics and information service, not a licensed bookmaker. We do not handle funds or facilitate wagering, so gambling-operator licensing does not apply to our football prediction tools.",
  },
  {
    question: "Can I trust BetsPlug's predictions?",
    answer:
      "Our AI models are calibrated with Brier scores and validated against historical results. We publish a full public track record so you can independently verify prediction accuracy before subscribing.",
  },
];

/* ── Per-page SEO metadata ─────────────────────────────────────
   Overrides the root layout defaults so the About page has its
   own title, description and canonical URL -- essential for
   indexability and rich-result eligibility.                     */
export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/about-us"]?.[locale] ?? PAGE_META["/about-us"].en;
  const alternates = getLocalizedAlternates("/about-us");

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

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About Us", href: "/about-us" },
        ]}
      />
      <AboutContent />
      <FaqSection
        title="About BetsPlug FAQ"
        subtitle="Common questions about who we are and how we work."
        items={ABOUT_FAQS}
      />
    </>
  );
}
