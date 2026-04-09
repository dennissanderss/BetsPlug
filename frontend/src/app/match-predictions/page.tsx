import type { Metadata } from "next";
import { MatchPredictionsContent } from "./match-predictions-content";

/**
 * Public marketing teaser for the prediction engine.
 * Shows 3 upcoming matches with full probabilities, then
 * blurs the rest behind an "Unlock all games" paywall CTA.
 * Data comes from the same public /fixtures/upcoming endpoint
 * used on the members-only /predictions page.
 */
export const metadata: Metadata = {
  title: "Free AI Match Predictions - Upcoming Games | BetsPlug",
  description:
    "Preview 3 free AI-powered match predictions with win probabilities and confidence scores. Unlock the full slate of upcoming games with a BetsPlug subscription.",
  alternates: {
    canonical: "/match-predictions",
  },
  openGraph: {
    title: "Free AI Match Predictions - BetsPlug",
    description:
      "Preview 3 free AI-powered match predictions. Unlock the rest with a trial.",
    type: "website",
  },
};

export default function MatchPredictionsPage() {
  return <MatchPredictionsContent />;
}
