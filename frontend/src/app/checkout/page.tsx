import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutContent } from "./checkout-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/checkout"]?.[locale] ?? PAGE_META["/checkout"].en;
  const alternates = getLocalizedAlternates("/checkout");

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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060912]" />}>
      <CheckoutContent />
    </Suspense>
  );
}
