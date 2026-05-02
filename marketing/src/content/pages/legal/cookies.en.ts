/**
 * Cookie Policy — EN canonical source.
 *
 * Templates per docs/specs/15-legal-pages.md. NOT legal advice;
 * lawyer review required before production launch.
 */
import type { LegalPageContent } from "./types";

export const cookiesEn: LegalPageContent = {
  _meta: {
    translationStatus: "source",
    needsReview: true,
    lastUpdated: "2026-05-02",
    version: "1.0",
    effectiveDate: "2026-05-02",
  },
  meta: {
    title: "Cookie Policy | BetsPlug",
    description:
      "What cookies BetsPlug uses, why, and how to manage your preferences. Essential cookies only by default.",
    ogImage: "/og-images/legal-default.jpg",
  },
  hero: {
    h1: "Cookie Policy",
    intro:
      "Cookies are small text files stored on your device when you visit websites. This policy explains which cookies BetsPlug uses, why we use them, and how you can manage your preferences.",
  },
  labels: {
    tocTitle: "Table of contents",
    lastUpdatedLabel: "Last updated",
    versionLabel: "Version",
    effectiveDateLabel: "Effective",
    lawyerReviewWarning:
      "TODO: Lawyer review required before production launch. This document is a template and is not legal advice.",
    contactHeading: "Questions about cookies?",
  },
  sections: [
    {
      id: "what-are-cookies",
      number: 1,
      title: "What are cookies?",
      body: [
        "Cookies are small text files stored on your device when you visit websites. They help sites remember your preferences and provide functionality.",
        "BetsPlug uses cookies and similar technologies (local storage, session storage, pixels) to operate our service.",
      ],
    },
    {
      id: "cookies-we-use",
      number: 2,
      title: "Cookies we use",
      body: [
        "We group the cookies we set into four categories. Essential cookies are required for the site to work; the other categories are opt-in.",
        {
          kind: "callout",
          tone: "info",
          text:
            "Essential cookies (Category 1) — required, no consent needed.",
        },
        {
          kind: "table",
          caption: "Essential cookies",
          headers: ["Name", "Purpose", "Duration"],
          rows: [
            ["session_id", "Maintains login session", "Session"],
            ["auth_token", "Authentication", "30 days"],
            ["csrf_token", "Security (anti-CSRF)", "Session"],
            ["locale_pref", "Language preference", "1 year"],
            ["cookie_consent", "Records your cookie choices", "1 year"],
          ],
        },
        "These cookies are required for the site to function. You cannot opt out of essential cookies and use BetsPlug.",
        {
          kind: "callout",
          tone: "info",
          text: "Functional cookies (Category 2) — optional, opt-in.",
        },
        {
          kind: "table",
          caption: "Functional cookies",
          headers: ["Name", "Purpose", "Duration"],
          rows: [
            ["theme_pref", "Light/dark mode preference", "1 year"],
            ["notification_pref", "Notification settings", "1 year"],
            ["layout_pref", "UI layout preferences", "1 year"],
          ],
        },
        "These remember your preferences for a better experience. Optional.",
        {
          kind: "callout",
          tone: "info",
          text: "Analytics cookies (Category 3) — optional, opt-in.",
        },
        {
          kind: "table",
          caption: "Analytics cookies",
          headers: ["Name", "Purpose", "Duration"],
          rows: [
            ["_plausible_*", "Privacy-friendly page analytics", "Session"],
          ],
        },
        "We use Plausible Analytics (or a similar privacy-friendly tool): no personal data tracked, no cross-site tracking, aggregated data only, GDPR-compliant by design. You can opt out without affecting functionality.",
        {
          kind: "callout",
          tone: "info",
          text: "No advertising cookies (Category 4).",
        },
        "We do NOT use:",
        {
          kind: "ul",
          items: [
            "Advertising cookies",
            "Third-party tracking pixels",
            "Behavioural profiling",
            "Cross-site tracking",
            "Social media tracking pixels",
          ],
        },
      ],
    },
    {
      id: "managing-preferences",
      number: 3,
      title: "Managing your preferences",
      body: [
        "You can manage cookie preferences:",
        {
          kind: "ul",
          items: [
            "First visit: choose preferences when the cookie banner appears",
            "Later: click 'Cookie settings' in the footer",
            "Or: change cookie behaviour in your browser",
          ],
        },
        "Browser-specific instructions:",
        {
          kind: "ul",
          items: [
            "Chrome: support.google.com/chrome/answer/95647",
            "Firefox: support.mozilla.org/kb/enhanced-tracking-protection-firefox",
            "Safari: support.apple.com/guide/safari/manage-cookies-sfri11471",
            "Edge: support.microsoft.com/microsoft-edge/delete-cookies",
          ],
        },
      ],
    },
    {
      id: "do-not-track",
      number: 4,
      title: "Do Not Track signal",
      body: [
        "BetsPlug respects the Do Not Track (DNT) header. When DNT is enabled, we disable analytics cookies regardless of consent banner state.",
      ],
    },
    {
      id: "compliance",
      number: 5,
      title: "Cookie banner compliance",
      body: [
        "Our cookie banner:",
        {
          kind: "ul",
          items: [
            "Appears on first visit",
            "Lists each cookie category with a separate toggle",
            "Includes 'Accept all', 'Reject all', and 'Customise' buttons",
            "Saves your preferences in the cookie_consent cookie (1 year)",
            "Re-appears when this policy is updated",
            "Is accessible via the 'Cookie settings' footer link",
            "Works without JavaScript (essential cookies only)",
            "Respects the Do Not Track header",
          ],
        },
        "Essential cookies are set BEFORE consent (legitimate interest, GDPR Art. 6(1)(f)). Functional and analytics cookies are set ONLY after explicit consent.",
      ],
    },
  ],
  contact: {
    email: "privacy@betsplug.com",
    postalAddressLine: "[COMPANY ADDRESS — replace before launch]",
  },
};
