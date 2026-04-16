import { HomeContent } from "./home-content";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  ServiceJsonLd,
  FaqJsonLd,
} from "@/components/seo/json-ld";
import { fetchAllArticles, fetchAllTestimonials, fetchHomepage, fetchPricingConfig } from "@/lib/sanity-data";
import { getHomeFaqJsonLdItems } from "@/data/home-faq";
import { getServerLocale } from "@/lib/seo-helpers";

export const revalidate = 60;

/**
 * The homepage FAQ has ONE source of truth: `src/data/home-faq.ts`,
 * which references translation keys in `i18n/messages.ts`. Both the
 * visible accordion (`<FaqBlock>` in `seo-section.tsx`) and the
 * Schema.org JSON-LD emitted here read from that key set —
 * preventing the rich-snippet mismatch that Google otherwise flags.
 *
 * The JSON-LD is resolved server-side using the active locale
 * (from the NEXT_LOCALE cookie) so crawlers see translated Q/As
 * that match the visible page in each hreflang variant.
 */

export default async function HomePage() {
  const [articles, sanityTestimonials, homepage, pricingConfig] = await Promise.all([
    fetchAllArticles(),
    fetchAllTestimonials(),
    fetchHomepage(),
    fetchPricingConfig(),
  ]);

  // Map Sanity testimonials to component format
  const testimonials = sanityTestimonials.map((t) => ({
    text: t.text,
    image: t.imageUrl,
    name: t.name,
    role: t.role,
  }));

  // Resolve FAQ q/a to active-locale strings for JSON-LD output.
  const locale = getServerLocale();
  const faqItems = getHomeFaqJsonLdItems(locale);

  return (
    <>
      {/* Structured data — server-rendered, invisible to users */}
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <ServiceJsonLd />
      <FaqJsonLd items={faqItems} />

      {/* Client-rendered landing page content */}
      <HomeContent articles={articles} testimonials={testimonials} homepage={homepage} pricingConfig={pricingConfig} />
    </>
  );
}
