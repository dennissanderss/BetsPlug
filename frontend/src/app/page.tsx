import { HomeContent } from "./home-content";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  ServiceJsonLd,
  FaqJsonLd,
} from "@/components/seo/json-ld";
import { fetchAllArticles, fetchAllTestimonials, fetchHomepage, fetchPricingConfig } from "@/lib/sanity-data";
import { homeFaqItems } from "@/data/home-faq";

export const revalidate = 60;

/**
 * The homepage FAQ has ONE source of truth: `src/data/home-faq.ts`.
 * Both the visible accordion (`<FaqBlock>` in `seo-section.tsx`) and
 * the Schema.org JSON-LD emitted here read from it — preventing the
 * rich-snippet mismatch that Google otherwise flags.
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

  return (
    <>
      {/* Structured data — server-rendered, invisible to users */}
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <ServiceJsonLd />
      <FaqJsonLd items={homeFaqItems} />

      {/* Client-rendered landing page content */}
      <HomeContent articles={articles} testimonials={testimonials} homepage={homepage} pricingConfig={pricingConfig} />
    </>
  );
}
