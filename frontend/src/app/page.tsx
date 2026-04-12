import { HomeContent } from "./home-content";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  ServiceJsonLd,
  FaqJsonLd,
} from "@/components/seo/json-ld";

/* ── Homepage FAQ (server-rendered for Google rich results) ── */

const FAQ_ITEMS = [
  {
    question: "How does BetsPlug predict football matches?",
    answer:
      "BetsPlug combines four AI models — Elo ratings, Poisson distribution, logistic regression, and an XGBoost ensemble — to calculate win/draw/loss probabilities for every match. The models are trained on historical data from 15+ leagues and updated before each match day.",
  },
  {
    question: "What is the accuracy of BetsPlug predictions?",
    answer:
      "Our ensemble model achieves approximately 50% match-outcome accuracy across all leagues, with a Brier score below 0.22. Accuracy varies by league and bet type. All results are publicly tracked on our Track Record page — we publish wins and losses alike.",
  },
  {
    question: "Is BetsPlug free to use?",
    answer:
      "BetsPlug offers a 7-day full-access trial for €0.01. After the trial, you can choose a monthly or annual subscription. Free visitors can browse league hubs, articles, and our public track record without signing up.",
  },
  {
    question: "Which football leagues does BetsPlug cover?",
    answer:
      "BetsPlug covers 15+ leagues including the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Primeira Liga, Süper Lig, Championship, and Belgian Pro League, with more leagues being added regularly.",
  },
  {
    question: "What AI models does BetsPlug use?",
    answer:
      "Our platform uses an ensemble of four models: (1) Elo ratings for team-strength ranking, (2) Poisson distribution for goal prediction, (3) logistic regression for pattern recognition, and (4) XGBoost for combining all signals into final probabilities.",
  },
  {
    question: "How is BetsPlug different from tipster sites?",
    answer:
      "Unlike tipster sites, BetsPlug is fully transparent: every prediction is timestamped before kick-off, our track record is public (wins and losses), and we show the exact probabilities and reasoning behind each pick. There is no cherry-picking or hidden results.",
  },
  {
    question: "Can I use BetsPlug for value betting?",
    answer:
      "Yes. BetsPlug identifies value bets by comparing our model's probabilities against bookmaker odds. When our model assigns a higher probability than the implied odds suggest, a positive expected value (+EV) edge exists. Our Strategy Lab lets you filter for these opportunities.",
  },
  {
    question: "What are expected goals (xG) and how does BetsPlug use them?",
    answer:
      "Expected goals (xG) measure the quality of chances created in a match. BetsPlug incorporates xG data alongside Elo ratings and historical form to improve prediction accuracy, especially for over/under and both-teams-to-score markets.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Structured data — server-rendered, invisible to users */}
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <ServiceJsonLd />
      <FaqJsonLd items={FAQ_ITEMS} />

      {/* Client-rendered landing page content */}
      <HomeContent />
    </>
  );
}
