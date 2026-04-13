import type { Metadata } from "next";
import { AboutContent } from "./about-content";
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

const ABOUT_FAQ_KEYS = [
  { q: "faq.about.q1", a: "faq.about.a1" },
  { q: "faq.about.q2", a: "faq.about.a2" },
  { q: "faq.about.q3", a: "faq.about.a3" },
  { q: "faq.about.q4", a: "faq.about.a4" },
  { q: "faq.about.q5", a: "faq.about.a5" },
  { q: "faq.about.q6", a: "faq.about.a6" },
];

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
  const locale = getServerLocale();
  const faqItems = getLocalizedFaq(ABOUT_FAQ_KEYS);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.aboutUs", canonicalPath: "/about-us" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <AboutContent
        faqSlot={
          <FaqSection
            title={translate(locale, "faqTitle.about" as any)}
            subtitle={translate(locale, "faqTitle.aboutSub" as any)}
            items={faqItems}
          />
        }
      />
    </>
  );
}
