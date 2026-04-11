import type { Metadata } from "next";
import { ArticlesContent } from "./articles-content";

/**
 * Public articles archive page.
 * Lists every article with tab filters per sport and a hero
 * featured post at the top. Data comes from the static
 * src/data/articles.ts source so the page is fully SSG-friendly.
 */
export const metadata: Metadata = {
  title:
    "Latest Football Analysis & AI Betting Articles | BetsPlug",
  description:
    "Football news, AI match breakdowns and data-driven betting insights across the Premier League, La Liga, Bundesliga, Serie A and more. Read the latest analysis from the BetsPlug research team.",
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    title: "Latest Football Analysis - BetsPlug",
    description:
      "AI football match breakdowns and data-driven betting insights from the BetsPlug research team.",
    type: "website",
  },
};

export default function ArticlesPage() {
  return <ArticlesContent />;
}
