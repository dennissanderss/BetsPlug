import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginContent } from "./login-content";
import { getServerLocale, getLocalizedAlternates,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/login"]?.[locale] ?? PAGE_META["/login"].en;
  const alternates = getLocalizedAlternates("/login");
const og = getOpenGraphLocales();
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
