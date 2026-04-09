import type { Metadata } from "next";
import { HowItWorksContent } from "./how-it-works-content";

/* ── Per-page SEO metadata ─────────────────────────────────────
   The How-It-Works page is the main trust-building entry point
   for prospects doing due diligence. It gets dedicated title,
   description, canonical URL and OpenGraph tags.               */
export const metadata: Metadata = {
  title:
    "How BetsPlug Works — From raw match data to AI-driven predictions",
  description:
    "A full, step-by-step walkthrough of the BetsPlug prediction engine: how we collect data, engineer features, train models, detect value and publish picks you can verify.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title:
      "How BetsPlug works — the honest, step-by-step prediction engine",
    description:
      "14 data sources. 1,200+ features. 4 independent models. Every pick timestamped and publicly verifiable. This is the exact pipeline.",
    type: "website",
  },
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
