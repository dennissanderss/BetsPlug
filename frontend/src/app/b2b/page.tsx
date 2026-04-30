import type { Metadata } from "next";
import { B2BContent } from "./b2b-content";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { fetchB2bPage } from "@/lib/sanity-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/b2b"]?.[locale] ?? PAGE_META["/b2b"].en;
  const alternates = getLocalizedAlternates("/b2b");
const og = getOpenGraphLocales();
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
  };
}

export default async function B2BPage() {
  const [b2bPage] = await Promise.all([fetchB2bPage()]);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.b2b", canonicalPath: "/b2b" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <B2BContent b2bPage={b2bPage} />
    </>
  );
}
