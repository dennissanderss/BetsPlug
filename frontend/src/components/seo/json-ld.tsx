/**
 * Server-rendered JSON-LD structured data components
 * ────────────────────────────────────────────────────────────
 * Drop these into any server component page to emit schema.org
 * markup. Google uses this for rich results, knowledge panels,
 * and FAQ rich snippets.
 *
 * Locale-aware: descriptions on Organization / WebSite /
 * SoftwareApplication are rendered in the active server locale
 * via translate(), so /es, /de, /fr crawlers see Spanish, German,
 * and French structured data instead of English fallback. This
 * is a hard requirement for rich-snippets ranking in non-EN SERPs.
 */
import { translate } from "@/i18n/messages";
import { getServerLocale } from "@/lib/seo-helpers";
import type { Locale } from "@/i18n/config";

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

function buildOrganization(locale: Locale) {
  return {
    "@type": ["Organization", "EducationalOrganization"],
    "@id": "https://betsplug.com/#organization",
    name: "BetsPlug",
    url: "https://betsplug.com",
    description: translate(locale, "schema.org.description"),
    logo: {
      "@type": "ImageObject",
      url: "https://betsplug.com/logo.webp",
      width: 512,
      height: 512,
    },
    knowsAbout: [
      "Football statistics",
      "Sports analytics",
      "Probabilistic modeling",
      "Elo rating systems",
      "Poisson goal models",
      "Machine learning for sports",
      "Bankroll management education",
    ],
    sameAs: [
      "https://x.com/betsplug",
      "https://instagram.com/betsplug",
      "https://youtube.com/@betsplug",
      "https://t.me/BetsPluggs",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@betsplug.com",
      contactType: "customer support",
      availableLanguage: ["English", "Dutch", "German", "French", "Spanish", "Italian"],
    },
  };
}

/** Organization schema — add to the homepage or root layout.
 *  Description is rendered in the active locale. */
export function OrganizationJsonLd() {
  const locale = getServerLocale();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        ...buildOrganization(locale),
      }}
    />
  );
}

/* ── WebSite (with SearchAction) ──────────────────────────── */

export function WebSiteJsonLd() {
  const locale = getServerLocale();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://betsplug.com/#website",
        name: "BetsPlug",
        url: "https://betsplug.com",
        inLanguage: locale,
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

/* ── Product / Offer (pricing page) ───────────────────────── */

export interface PricingPlanOffer {
  /** Display name of the plan ("Gold", "Silver", ...). */
  name: string;
  /** Plain price, e.g. "14.99" or "0.01". */
  price: string;
  /** ISO 4217 currency code. */
  priceCurrency: string;
  /** One-line positioning / bestFor text. */
  description: string;
  /** Absolute URL for the checkout / plan landing page. */
  url: string;
  /** One of: https://schema.org/Subscription | TimedSubscription | OneTime.
   *  Default: the caller decides. */
  category?: string;
  /** "https://schema.org/InStock" by default. */
  availability?: string;
  /** For recurring subscriptions — ISO 8601 duration (P1M = 1 month). */
  billingDuration?: string;
}

/**
 * Emits a Product with an offers array — one Offer per pricing tier.
 * Use on the pricing page so Google can show price rich-snippets
 * and comparison cards in SERPs.
 */
export function PricingProductJsonLd({
  name,
  description,
  offers,
}: {
  name: string;
  description: string;
  offers: PricingPlanOffer[];
}) {
  const offerObjects = offers.map((o) => {
    const base: Record<string, unknown> = {
      "@type": "Offer",
      name: o.name,
      description: o.description,
      price: o.price,
      priceCurrency: o.priceCurrency,
      url: o.url,
      availability: o.availability ?? "https://schema.org/InStock",
    };
    if (o.category) base.category = o.category;
    if (o.billingDuration) {
      base.priceSpecification = {
        "@type": "UnitPriceSpecification",
        price: o.price,
        priceCurrency: o.priceCurrency,
        billingDuration: o.billingDuration,
      };
    }
    return base;
  });

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description,
        brand: { "@type": "Brand", name: "BetsPlug" },
        offers: offerObjects,
      }}
    />
  );
}

/* ── SoftwareApplication / Service ──────────────────────────
   Educational analytics application — no AggregateRating (none of the
   ratings are independently verified, so per Google's structured-data
   guidelines they MUST NOT be emitted). Pricing offers live on /pricing
   via PricingProductJsonLd, so no AggregateOffer here either. */

export function ServiceJsonLd() {
  const locale = getServerLocale();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "BetsPlug",
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        description: translate(locale, "schema.app.description"),
        publisher: { "@id": "https://betsplug.com/#organization" },
        inLanguage: locale,
      }}
    />
  );
}
