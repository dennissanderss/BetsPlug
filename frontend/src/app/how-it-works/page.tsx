import type { Metadata } from "next";
import { HowItWorksContent } from "./how-it-works-content";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedFaq,
  getLocalizedBreadcrumbs,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";

const HOW_FAQ_KEYS = [
  { q: "faq.how.q1", a: "faq.how.a1" },
  { q: "faq.how.q2", a: "faq.how.a2" },
  { q: "faq.how.q3", a: "faq.how.a3" },
  { q: "faq.how.q4", a: "faq.how.a4" },
  { q: "faq.how.q5", a: "faq.how.a5" },
  { q: "faq.how.q6", a: "faq.how.a6" },
];

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
  const faqItems = getLocalizedFaq(HOW_FAQ_KEYS);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.howItWorks", canonicalPath: "/how-it-works" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FaqJsonLd items={faqItems} />
      <HowItWorksContent />
    </>
  );
}
