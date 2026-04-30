import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutContent } from "./about-content";
import {
  getLocalizedAlternates,
  getLocalizedFaq,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq-section";
import { translate } from "@/i18n/messages";
import { fetchAboutPage, getLocaleValue } from "@/lib/sanity-data";
import { isLocale, locales, type Locale } from "@/i18n/config";

export const dynamic = "force-static";
export const revalidate = 60;

type Params = { locale: string };

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

const ABOUT_FAQ_KEYS = [
  { q: "faq.about.q1", a: "faq.about.a1" },
  { q: "faq.about.q2", a: "faq.about.a2" },
  { q: "faq.about.q3", a: "faq.about.a3" },
  { q: "faq.about.q4", a: "faq.about.a4" },
  { q: "faq.about.q5", a: "faq.about.a5" },
  { q: "faq.about.q6", a: "faq.about.a6" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;

  const meta = PAGE_META["/about-us"]?.[locale] ?? PAGE_META["/about-us"].en;
  const alternates = getLocalizedAlternates("/about-us", undefined, locale);
  const og = getOpenGraphLocales(locale);
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
      locale: og.locale,
      alternateLocale: og.alternateLocales,
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const faqItems = getLocalizedFaq(ABOUT_FAQ_KEYS, locale);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.aboutUs", canonicalPath: "/about-us" },
  ]);

  const aboutData = await fetchAboutPage();

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
