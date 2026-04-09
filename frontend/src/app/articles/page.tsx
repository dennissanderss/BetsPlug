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
    "Latest Sports Analysis & AI Betting Articles | BetsPlug",
  description:
    "Sports news, AI match breakdowns and data-driven betting insights across football, NBA, NFL, MLB and NHL. Read the latest analysis from the BetsPlug research team.",
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    title: "Latest Sports Analysis - BetsPlug",
    description:
      "AI match breakdowns and data-driven betting insights from the BetsPlug research team.",
    type: "website",
  },
};

export default function ArticlesPage() {
  return <ArticlesContent />;
}
