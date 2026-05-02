/**
 * Responsible Gambling — EN canonical source.
 *
 * Templates per docs/specs/15-legal-pages.md. NOT legal advice;
 * lawyer review required before production launch.
 */
import type { LegalPageContent } from "./types";

export const responsibleGamblingEn: LegalPageContent = {
  _meta: {
    translationStatus: "source",
    needsReview: true,
    lastUpdated: "2026-05-02",
    version: "1.0",
    effectiveDate: "2026-05-02",
  },
  meta: {
    title: "Responsible Gambling | BetsPlug",
    description:
      "BetsPlug supports responsible gambling. Recognise problem gambling, find help and self-exclusion options, and protect family and friends.",
    ogImage: "/og-images/legal-default.jpg",
  },
  hero: {
    h1: "Responsible Gambling",
    intro:
      "BetsPlug provides statistical analysis of football matches. We don't operate as a bookmaker or facilitate gambling. However, we recognise that some users may use our predictions in conjunction with gambling activities. This page covers responsible gambling principles and resources.",
  },
  labels: {
    tocTitle: "Table of contents",
    lastUpdatedLabel: "Last updated",
    versionLabel: "Version",
    effectiveDateLabel: "Effective",
    lawyerReviewWarning:
      "TODO: Lawyer review required before production launch. Resource list updated regularly.",
    contactHeading: "Need to talk to us?",
  },
  sections: [
    {
      id: "our-position",
      number: 1,
      title: "Our position on gambling",
      body: [
        "BetsPlug is not a bookmaker or gambling operator. We don't:",
        {
          kind: "ul",
          items: [
            "Accept bets",
            "Hold gambling money",
            "Process gambling transactions",
            "Promote gambling as a primary activity",
            "Offer gambling incentives or bonuses",
          ],
        },
        "We provide statistical analysis. What you do with that information is your own decision.",
        "That said, we acknowledge that gambling-related harm is a real issue. We support responsible gambling principles even though our service isn't gambling itself.",
      ],
    },
    {
      id: "principles",
      number: 2,
      title: "Responsible gambling principles",
      body: [
        "If you choose to gamble using our predictions or otherwise, consider these principles:",
        {
          kind: "ol",
          items: [
            "Set limits — decide how much money you can afford to lose before starting. Stick to that limit.",
            "Time limits — set time boundaries for gambling activities. Don't let gambling consume your day.",
            "Don't chase losses — losing is part of gambling. Trying to win back losses by betting more is the fastest path to bigger problems.",
            "Never gamble with money you need — rent, food, bills come first. Gambling money is entertainment money you can afford to lose.",
            "Don't gamble while emotional — avoid betting when stressed, angry, or drunk. Decisions made in these states are usually poor.",
            "Take breaks — step away regularly. Long gambling sessions reduce judgment.",
            "Track your activity — know how much you've actually spent over time. Memory misleads.",
            "Gambling isn't income — treat it as entertainment that costs money, not a way to make money.",
          ],
        },
      ],
    },
    {
      id: "warning-signs",
      number: 3,
      title: "Recognising problem gambling",
      body: [
        "Gambling becomes a problem when:",
        {
          kind: "ul",
          items: [
            "You spend more than you intended or can afford",
            "You feel anxious or irritable when not gambling",
            "You lie about how much you gamble",
            "You chase losses with bigger bets",
            "You neglect work, family, or responsibilities",
            "You borrow money to gamble",
            "You feel guilt or shame about gambling",
            "You can't stop even when you want to",
          ],
        },
        "If you recognise these signs in yourself or someone close to you, help is available — see the resources section below.",
      ],
    },
    {
      id: "where-to-get-help",
      number: 4,
      title: "Where to get help",
      body: [
        // The component layer renders the locale-aware helpline list
        // immediately after this paragraph; we keep the prose minimal
        // so the list is the primary signal.
        "If you or someone you know needs help, contact one of the resources listed below. Many helplines are free, confidential, and 24/7.",
      ],
    },
    {
      id: "self-exclusion",
      number: 5,
      title: "Self-exclusion options",
      body: [
        "If you want to limit your access to BetsPlug:",
        {
          kind: "ol",
          items: [
            "Account closure — close your account from the dashboard. We honour closure for at least 6 months. To reactivate after, contact support.",
            "Notification opt-out — disable all notifications from account settings if predictions tempt you to gamble.",
          ],
        },
        "National self-exclusion programmes:",
        {
          kind: "ul",
          items: [
            "Netherlands: Cruks (kansspelautoriteit.nl/registratie/cruks)",
            "Germany: OASIS (oasis-bzga.de)",
            "United Kingdom: GamStop (gamstop.co.uk)",
          ],
        },
        "These programmes exclude you from licensed gambling operators in your country, often for 6 months minimum.",
      ],
    },
    {
      id: "age-requirements",
      number: 6,
      title: "Age requirements",
      body: [
        "BetsPlug requires users to be:",
        {
          kind: "ul",
          items: [
            "At least 18 years old, OR",
            "Legal gambling age in your jurisdiction (whichever is higher)",
          ],
        },
        "We don't market to or accept registrations from minors. If you believe a minor has access to our service, contact us immediately at support@betsplug.com.",
      ],
    },
    {
      id: "family-friends",
      number: 7,
      title: "Help for family and friends",
      body: [
        "If you're worried about a loved one's gambling:",
        {
          kind: "ul",
          items: [
            "Don't enable — avoid lending money or covering for them",
            "Talk openly — express concern without judgement",
            "Set boundaries — protect your own finances and wellbeing",
            "Get support — family-focused resources at gamcare.org.uk and similar national organisations",
          ],
        },
        "Many problem gamblers don't seek help on their own. Concerned family members often initiate the path to recovery.",
      ],
    },
  ],
  contact: {
    email: "support@betsplug.com",
    postalAddressLine: "[COMPANY ADDRESS — replace before launch]",
  },
};
