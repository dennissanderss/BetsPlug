import type { Metadata } from "next";
import { Suspense } from "react";
import { WelcomeContent } from "./welcome-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { fetchWelcomePage } from "@/lib/sanity-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/welcome"]?.[locale] ?? PAGE_META["/welcome"].en;
  const alternates = getLocalizedAlternates("/welcome");

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function WelcomePage() {
  const [welcomePage] = await Promise.all([fetchWelcomePage()]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <WelcomeContent welcomePage={welcomePage} />
    </Suspense>
  );
}
