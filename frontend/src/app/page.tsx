import { HomeContent } from "./home-content";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  ServiceJsonLd,
  FaqJsonLd,
} from "@/components/seo/json-ld";
import { getLocalizedFaq } from "@/lib/seo-helpers";
import { fetchAllArticles, fetchAllTestimonials, fetchHomepage } from "@/lib/sanity-data";

export const revalidate = 60;

/* ── Homepage FAQ keys (resolved per-locale at render time) ── */

const FAQ_KEYS = [
  { q: "faq.home.q1", a: "faq.home.a1" },
  { q: "faq.home.q2", a: "faq.home.a2" },
  { q: "faq.home.q3", a: "faq.home.a3" },
  { q: "faq.home.q4", a: "faq.home.a4" },
  { q: "faq.home.q5", a: "faq.home.a5" },
  { q: "faq.home.q6", a: "faq.home.a6" },
  { q: "faq.home.q7", a: "faq.home.a7" },
  { q: "faq.home.q8", a: "faq.home.a8" },
];

export default async function HomePage() {
  const [articles, sanityTestimonials, faqItems, homepage] = await Promise.all([
    fetchAllArticles(),
    fetchAllTestimonials(),
    Promise.resolve(getLocalizedFaq(FAQ_KEYS)),
    fetchHomepage(),
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
      <FaqJsonLd items={faqItems} />

      {/* Client-rendered landing page content */}
      <HomeContent articles={articles} testimonials={testimonials} homepage={homepage} />
    </>
  );
}
