import type { Metadata } from "next";
import { AboutContent } from "./about-content";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedFaq,
  getLocalizedBreadcrumbs,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";
import { translate } from "@/i18n/messages";
import { fetchAboutPage, getLocaleValue } from "@/lib/sanity-data";

export const revalidate = 60;

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

export default async function AboutPage() {
  const locale = getServerLocale();
  const faqItems = getLocalizedFaq(ABOUT_FAQ_KEYS);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.aboutUs", canonicalPath: "/about-us" },
  ]);

  const aboutData = await fetchAboutPage();

  // Pre-resolve Sanity data to serializable objects for the client component
  const sanityAbout = aboutData
    ? {
        founders: (aboutData.founders ?? []).map((f: any) => ({
          name: f.name ?? "",
          initial: f.initial ?? "",
          role: getLocaleValue(f.role, locale),
          bio: getLocaleValue(f.bio, locale),
        })),
        stats: (aboutData.stats ?? []).map((s: any) => ({
          value: s.value ?? "",
          label: getLocaleValue(s.label, locale),
        })),
        values: (aboutData.values ?? []).map((v: any) => ({
          title: getLocaleValue(v.title, locale),
          description: getLocaleValue(v.description, locale),
          icon: v.icon ?? "",
        })),
      }
    : undefined;

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FaqJsonLd items={faqItems} />
      <AboutContent
        sanityAbout={sanityAbout}
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
