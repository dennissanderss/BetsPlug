import type { Metadata } from "next";
import { AboutContent } from "./about-content";

/* ── Per-page SEO metadata ─────────────────────────────────────
   Overrides the root layout defaults so the About page has its
   own title, description and canonical URL — essential for
   indexability and rich-result eligibility.                     */
export const metadata: Metadata = {
  title: "About BetsPlug - The team behind the AI football analytics platform",
  description:
    "Meet the two engineers building BetsPlug. Football fanatics with an ICT background, turning raw match data into transparent, probability-driven football predictions.",
  alternates: {
    canonical: "/about-us",
  },
  openGraph: {
    title: "About BetsPlug - The team behind the edge",
    description:
      "Two engineers. 20+ years of combined ICT experience. One obsession: turning football data into a measurable edge.",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
