/**
 * Server-rendered JSON-LD structured data components
 * ────────────────────────────────────────────────────────────
 * Drop these into any server component page to emit schema.org
 * markup. Google uses this for rich results, knowledge panels,
 * and FAQ rich snippets.
 */

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/** Generic JSON-LD script tag — pass any schema.org object(s). */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── Organization ─────────────────────────────────────────── */

const ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://betsplug.com/#organization",
  name: "BetsPlug",
  url: "https://betsplug.com",
  logo: {
    "@type": "ImageObject",
    url: "https://betsplug.com/logo.webp",
    width: 512,
    height: 512,
  },
  sameAs: [
    "https://x.com/betsplug",
    "https://instagram.com/betsplug",
    "https://youtube.com/@betsplug",
    "https://t.me/betsplug",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@betsplug.com",
    contactType: "customer support",
    availableLanguage: ["English", "Dutch", "German", "French", "Spanish", "Italian"],
  },
};

/** Organization schema — add to the homepage or root layout. */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        ...ORGANIZATION,
      }}
    />
  );
}

/* ── WebSite (with SearchAction) ──────────────────────────── */

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://betsplug.com/#website",
        name: "BetsPlug",
        url: "https://betsplug.com",
        publisher: { "@id": "https://betsplug.com/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://betsplug.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

/* ── FAQPage ──────────────────────────────────────────────── */

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}

/* ── BreadcrumbList ───────────────────────────────────────── */

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.href.startsWith("http")
            ? item.href
            : `https://betsplug.com${item.href}`,
        })),
      }}
    />
  );
}

/* ── SoftwareApplication / Service ────────────────────────── */

export function ServiceJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "BetsPlug",
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        description:
          "AI-powered football prediction platform combining Elo ratings, Poisson distribution, and machine learning across 15+ leagues.",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "0.01",
          highPrice: "29.99",
          offerCount: 3,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.6",
          ratingCount: "312",
          bestRating: "5",
        },
        publisher: { "@id": "https://betsplug.com/#organization" },
      }}
    />
  );
}
