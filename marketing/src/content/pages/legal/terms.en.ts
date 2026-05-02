/**
 * Terms of Service — EN canonical source.
 *
 * Templates per docs/specs/15-legal-pages.md. NOT legal advice;
 * lawyer review required before production launch.
 */
import type { LegalPageContent } from "./types";

export const termsEn: LegalPageContent = {
  _meta: {
    translationStatus: "source",
    needsReview: true,
    lastUpdated: "2026-05-02",
    version: "1.0",
    effectiveDate: "2026-05-02",
  },
  meta: {
    title: "Terms of Service | BetsPlug",
    description:
      "Terms governing your use of BetsPlug. Subscription, acceptable use, liability and disputes — written for clarity.",
    ogImage: "/og-images/legal-default.jpg",
  },
  hero: {
    h1: "Terms of Service",
    intro:
      "These Terms of Service ('Terms') govern your access to and use of BetsPlug. By creating an account or using our service, you agree to these Terms. If you don't agree, don't use our service.",
  },
  labels: {
    tocTitle: "Table of contents",
    lastUpdatedLabel: "Last updated",
    versionLabel: "Version",
    effectiveDateLabel: "Effective",
    lawyerReviewWarning:
      "TODO: Lawyer review required before production launch. This document is a template and is not legal advice.",
    contactHeading: "Contact",
  },
  sections: [
    {
      id: "acceptance-of-terms",
      number: 1,
      title: "Acceptance of terms",
      body: [
        "By accessing or using BetsPlug, you confirm that:",
        {
          kind: "ul",
          items: [
            "You are at least 18 years old (or legal gambling age in your jurisdiction, whichever is higher)",
            "You have the legal capacity to enter into binding agreements",
            "You will use the service in compliance with applicable laws",
            "You agree to these Terms in their entirety",
          ],
        },
        "If you're using BetsPlug on behalf of an organisation, you confirm you have authority to bind that organisation to these Terms.",
      ],
    },
    {
      id: "service-description",
      number: 2,
      title: "Service description",
      body: [
        "BetsPlug provides AI-driven football match predictions and related statistical analysis. Our service:",
        {
          kind: "ul",
          items: [
            "Generates predictions using statistical models and machine learning",
            "Publishes predictions in a public track record",
            "Offers tiered subscription access to predictions and features",
          ],
        },
        "What BetsPlug is NOT:",
        {
          kind: "ul",
          items: [
            "A bookmaker, casino, or gambling operator",
            "A licensed financial services provider",
            "A guarantee of betting outcomes",
            "An advisor on specific gambling decisions",
          ],
        },
        "Predictions are statistical analysis for informational purposes only. Any decisions you make based on our predictions are your own responsibility.",
      ],
    },
    {
      id: "account-registration",
      number: 3,
      title: "Account registration",
      body: [
        "To access most features, you must create an account:",
        {
          kind: "ul",
          items: [
            "Provide accurate, complete information",
            "Keep your login credentials secure",
            "Notify us immediately of unauthorised access",
            "One account per person — no sharing or transferring",
          ],
        },
        "We reserve the right to refuse registration, suspend or terminate accounts violating these Terms, and require verification of account information.",
      ],
    },
    {
      id: "subscription-payment",
      number: 4,
      title: "Subscription & payment",
      body: [
        "BetsPlug offers free and paid subscription tiers.",
        {
          kind: "ul",
          items: [
            "Free tier: unlimited duration, limited features (5 predictions/day, top 3 leagues only)",
            "Paid tiers (Silver, Gold): billed monthly or annually; auto-renews unless cancelled before billing date; cancel anytime from account dashboard",
            "7-day money-back guarantee on first paid month. After 7 days, no pro-rated refunds for partial periods",
          ],
        },
        "Pricing:",
        {
          kind: "ul",
          items: [
            "Current prices listed on /pricing",
            "We reserve the right to change pricing with 30 days notice",
            "Existing subscribers honor old pricing until next renewal",
          ],
        },
        "Failed payments: service may be suspended after 3 failed attempts. Account preserved for 30 days, then converted to free tier.",
        {
          kind: "callout",
          tone: "info",
          text:
            "TODO: Verify pricing tiers, refund window, and payment processor name with the legal team before launch.",
        },
      ],
    },
    {
      id: "acceptable-use",
      number: 5,
      title: "Acceptable use",
      body: [
        "You agree NOT to:",
        {
          kind: "ul",
          items: [
            "Use BetsPlug for any illegal purpose",
            "Share or resell access to your account",
            "Reverse engineer, scrape, or systematically extract our data",
            "Attempt to bypass security or access controls",
            "Submit false information or impersonate others",
            "Interfere with service operation",
            "Use BetsPlug to facilitate match-fixing or fraud",
            "Harass, threaten, or harm other users or staff",
            "Violate intellectual property rights",
            "Use predictions for purposes that violate gambling laws in your jurisdiction",
          ],
        },
        "Violation may result in immediate account termination without refund.",
      ],
    },
    {
      id: "intellectual-property",
      number: 6,
      title: "Intellectual property",
      body: [
        "All BetsPlug content — including predictions, statistical analysis, algorithm and methodology descriptions, website design and code, and content (text, images, videos) — is owned by BetsPlug or our licensors and protected by intellectual property laws.",
        "You may view predictions for personal use and cite our content with proper attribution and a link to betsplug.com.",
        "You may NOT redistribute or republish predictions in bulk, create derivative services using our predictions, remove copyright notices or attribution, or use BetsPlug content for commercial purposes without permission.",
      ],
    },
    {
      id: "disclaimer-of-warranties",
      number: 7,
      title: "Disclaimer of warranties",
      body: [
        {
          kind: "callout",
          tone: "warn",
          text:
            "BETSPLUG IS PROVIDED 'AS IS' AND 'AS AVAILABLE'. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, ACCURACY OF PREDICTIONS, UNINTERRUPTED AVAILABILITY, AND ERROR-FREE OPERATION.",
        },
        "Predictions may be inaccurate. Football outcomes involve genuine unpredictability that no model can fully capture. You use predictions at your own risk.",
      ],
    },
    {
      id: "limitation-of-liability",
      number: 8,
      title: "Limitation of liability",
      body: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, BetsPlug, its officers, employees, and partners are not liable for:",
        {
          kind: "ul",
          items: [
            "Direct, indirect, incidental, consequential, or punitive damages",
            "Lost profits, lost data, or business interruption",
            "Damages arising from prediction inaccuracy",
            "Damages arising from your gambling decisions",
            "Third-party actions or content",
          ],
        },
        "Our total liability for any claim is limited to the amount you paid BetsPlug in the 12 months before the claim arose. If you haven't paid (free tier), our liability is limited to €100.",
        "Some jurisdictions don't allow these limitations. In those cases, liability is limited to the maximum extent permitted by local law.",
      ],
    },
    {
      id: "indemnification",
      number: 9,
      title: "Indemnification",
      body: [
        "You agree to indemnify and hold harmless BetsPlug from claims arising from:",
        {
          kind: "ul",
          items: [
            "Your use of the service",
            "Your violation of these Terms",
            "Your violation of third-party rights",
            "Your gambling activities or decisions",
          ],
        },
      ],
    },
    {
      id: "termination",
      number: 10,
      title: "Termination",
      body: [
        "You may terminate your account anytime from account dashboard.",
        "We may terminate or suspend your account for violation of these Terms, non-payment, abusive behavior, or at our discretion with reasonable notice.",
        "Upon termination:",
        {
          kind: "ul",
          items: [
            "Your access to paid features ends immediately (no refund)",
            "Your data is retained per Privacy Policy retention periods",
            "Track record predictions you made remain in our public record (anonymised after retention period)",
          ],
        },
      ],
    },
    {
      id: "changes-to-terms",
      number: 11,
      title: "Changes to terms",
      body: [
        "We may update these Terms. When we do:",
        {
          kind: "ul",
          items: [
            "We'll update 'Last updated' at the top",
            "For material changes, we'll notify users via email or prominent site notice",
            "Changes take effect 30 days after notification",
            "Continued use after changes constitutes acceptance",
            "If you don't accept changes, terminate your account before effective date",
          ],
        },
      ],
    },
    {
      id: "governing-law-disputes",
      number: 12,
      title: "Governing law & disputes",
      body: [
        "These Terms are governed by the laws of [COUNTRY/JURISDICTION], without regard to conflict of laws principles.",
        "Disputes:",
        {
          kind: "ul",
          items: [
            "First, contact us at legal@betsplug.com to attempt resolution",
            "If unresolved within 60 days, disputes shall be resolved in the courts of [JURISDICTION]",
            "For EU consumers, mandatory consumer protection laws of your country of residence apply",
          ],
        },
        "You may also use the EU Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr/",
        {
          kind: "callout",
          tone: "info",
          text: "TODO: Replace [COUNTRY/JURISDICTION] placeholders before launch — needs lawyer review.",
        },
      ],
    },
    {
      id: "severability",
      number: 13,
      title: "Severability",
      body: [
        "If any part of these Terms is found unenforceable, the remaining provisions stay in effect. The unenforceable provision shall be modified to the minimum extent necessary to make it enforceable.",
      ],
    },
    {
      id: "contact",
      number: 14,
      title: "Contact",
      body: [
        "For questions about these Terms, see the contact details below.",
      ],
    },
  ],
  contact: {
    email: "legal@betsplug.com",
    postalAddressLine: "[COMPANY ADDRESS — replace before launch]",
  },
};
