/**
 * Privacy Policy — EN canonical source.
 *
 * Templates per docs/specs/15-legal-pages.md. NOT legal advice;
 * lawyer review required before production launch (TODO markers
 * preserved verbatim in content).
 */
import type { LegalPageContent } from "./types";

export const privacyEn: LegalPageContent = {
  _meta: {
    translationStatus: "source",
    needsReview: true,
    lastUpdated: "2026-05-02",
    version: "1.0",
    effectiveDate: "2026-05-02",
  },
  meta: {
    title: "Privacy Policy | BetsPlug",
    description:
      "How BetsPlug collects, uses, and protects your data. GDPR-compliant, transparent, no data sold to third parties.",
    ogImage: "/og-images/legal-default.jpg",
  },
  hero: {
    h1: "Privacy Policy",
    intro:
      "BetsPlug respects your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data. By using BetsPlug, you agree to the practices described here.",
  },
  labels: {
    tocTitle: "Table of contents",
    lastUpdatedLabel: "Last updated",
    versionLabel: "Version",
    effectiveDateLabel: "Effective",
    lawyerReviewWarning:
      "TODO: Lawyer review required before production launch. This document is a template and is not legal advice.",
    contactHeading: "Contact us",
  },
  sections: [
    {
      id: "information-we-collect",
      number: 1,
      title: "Information we collect",
      body: [
        "We collect information you provide directly:",
        {
          kind: "ul",
          items: [
            "Account information (email, name, password)",
            "Payment information (processed by our payment provider, not stored by us)",
            "Communication content (when you contact support)",
            "Subscription preferences (notification settings, language)",
          ],
        },
        "We collect information automatically:",
        {
          kind: "ul",
          items: [
            "Device information (browser type, OS, device type)",
            "Usage information (pages visited, predictions viewed, time spent)",
            "IP address (used for fraud prevention and locale detection)",
            "Cookies (see Cookies & Tracking section)",
          ],
        },
        "We DO NOT collect:",
        {
          kind: "ul",
          items: [
            "Sensitive personal data (race, religion, political views, etc.)",
            "Biometric data",
            "Location data beyond country-level (from IP)",
            "Browsing history outside BetsPlug",
          ],
        },
      ],
    },
    {
      id: "how-we-use-your-information",
      number: 2,
      title: "How we use your information",
      body: [
        "We use your information to:",
        {
          kind: "ul",
          items: [
            "Provide and improve the BetsPlug service",
            "Process payments and manage subscriptions",
            "Send transactional emails (account verification, billing, support responses)",
            "Send prediction notifications (only if you opt in)",
            "Detect and prevent fraud or abuse",
            "Comply with legal obligations",
            "Analyse service performance (aggregated, anonymised)",
          ],
        },
        "We DO NOT:",
        {
          kind: "ul",
          items: [
            "Sell your personal data to third parties",
            "Share your data with bookmakers or gambling operators",
            "Use your data for behavioural advertising",
            "Profile users for marketing beyond service improvement",
          ],
        },
      ],
    },
    {
      id: "data-sharing-disclosure",
      number: 3,
      title: "Data sharing & disclosure",
      body: [
        "We share your information only with service providers who help us operate BetsPlug:",
        {
          kind: "ul",
          items: [
            "Payment processor (Stripe or equivalent)",
            "Email delivery service (SendGrid or equivalent)",
            "Analytics service (privacy-friendly, aggregated only)",
            "Hosting provider (Vercel or equivalent)",
            "Customer support tools",
          ],
        },
        "These providers are contractually bound to use your data only for providing services to BetsPlug, not for their own purposes.",
        {
          kind: "callout",
          tone: "info",
          text:
            "Legal compliance: we may disclose information when legally required (court order, subpoena, regulatory request). We will notify you of legal requests when permitted by law.",
        },
        "We do NOT share your data with bookmakers, gambling operators, advertisers, marketing networks, or for sale or commercial use beyond service operation.",
      ],
    },
    {
      id: "data-retention",
      number: 4,
      title: "Data retention",
      body: [
        "We retain your data for the following periods:",
        {
          kind: "table",
          headers: ["Data type", "Retention period"],
          rows: [
            ["Account information", "While your account is active + 90 days after cancellation"],
            ["Payment records", "7 years (legal/tax requirement)"],
            ["Usage logs", "12 months (security and improvement)"],
            ["Support correspondence", "24 months"],
            ["Anonymised analytics", "Indefinitely"],
          ],
        },
        "You can request earlier deletion (see Your Rights section).",
      ],
    },
    {
      id: "your-rights",
      number: 5,
      title: "Your rights",
      body: [
        "Under GDPR (and similar laws), you have the right to:",
        {
          kind: "ol",
          items: [
            "Access — request a copy of your personal data",
            "Rectification — correct inaccurate data",
            "Erasure — request deletion of your data ('right to be forgotten')",
            "Restriction — limit how we process your data",
            "Portability — receive your data in machine-readable format",
            "Objection — object to processing for legitimate interests",
            "Withdraw consent — for consent-based processing",
            "Lodge complaints — contact your data protection authority",
          ],
        },
        "To exercise these rights, email privacy@betsplug.com or use the contact form. We respond within 30 days.",
      ],
    },
    {
      id: "cookies-tracking",
      number: 6,
      title: "Cookies & tracking",
      body: [
        "We use cookies and similar technologies. See our Cookie Policy for details on what we use, why, and how to manage preferences.",
        "Summary:",
        {
          kind: "ul",
          items: [
            "Essential cookies — required for service operation",
            "Functional cookies — remember preferences (language, theme)",
            "Analytics cookies — aggregated usage statistics (privacy-friendly)",
            "We do NOT use advertising cookies or third-party tracking pixels",
          ],
        },
      ],
    },
    {
      id: "third-party-services",
      number: 7,
      title: "Third-party services",
      body: [
        "BetsPlug integrates with third-party services. When you use these:",
        {
          kind: "ul",
          items: [
            "Payment processing (Stripe) — handles your payment information. See: stripe.com/privacy",
            "Email delivery (SendGrid) — sends transactional emails on our behalf. See: sendgrid.com/policies/privacy",
            "Analytics — privacy-friendly analytics (Plausible/Fathom or similar). No personal data tracked, only aggregated patterns",
          ],
        },
        "We are not responsible for third-party service privacy practices. Review their policies for full details.",
      ],
    },
    {
      id: "data-security",
      number: 8,
      title: "Data security",
      body: [
        "We implement industry-standard security measures:",
        {
          kind: "ul",
          items: [
            "Encryption in transit (HTTPS everywhere)",
            "Encryption at rest (database and backup encryption)",
            "Access controls (role-based access for staff)",
            "Regular security audits",
            "Incident response plan",
          ],
        },
        {
          kind: "callout",
          tone: "warn",
          text:
            "Despite these measures, no system is 100% secure. We cannot guarantee absolute security. In case of a data breach affecting your data, we will notify you within 72 hours (GDPR requirement).",
        },
      ],
    },
    {
      id: "international-data-transfers",
      number: 9,
      title: "International data transfers",
      body: [
        "BetsPlug operates from [COUNTRY] within the EU. Your data may be processed in EU data centres (primary) or third-country data centres (with appropriate safeguards).",
        "When data transfers outside EU occur:",
        {
          kind: "ul",
          items: [
            "We use Standard Contractual Clauses (SCCs)",
            "Or transfer to countries with EU adequacy decisions",
            "We never transfer data to countries without legal protection",
          ],
        },
      ],
    },
    {
      id: "childrens-privacy",
      number: 10,
      title: "Children's privacy",
      body: [
        "BetsPlug is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has provided us data, contact us immediately and we will delete it.",
      ],
    },
    {
      id: "changes-to-policy",
      number: 11,
      title: "Changes to this policy",
      body: [
        "We may update this Privacy Policy. When we do:",
        {
          kind: "ul",
          items: [
            "We'll update the 'Last updated' date at the top",
            "For material changes, we'll notify users via email or prominent notice on the site",
            "Continued use after changes constitutes acceptance",
          ],
        },
        "You can review previous versions by emailing privacy@betsplug.com.",
      ],
    },
    {
      id: "contact",
      number: 12,
      title: "Contact us",
      body: [
        "For privacy-related questions or to exercise your rights, see the contact details below.",
      ],
    },
  ],
  contact: {
    email: "privacy@betsplug.com",
    postalAddressLine: "[COMPANY ADDRESS — replace before launch]",
    dpo: "Data Protection Officer: not appointed (not required by law for our scale)",
  },
};
