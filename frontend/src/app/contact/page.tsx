import type { Metadata } from "next";
import { ContactContent } from "./contact-content";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
} from "@/lib/seo-helpers";
import { fetchContactPage } from "@/lib/sanity-data";
import { PAGE_META } from "@/data/page-meta";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta =
    PAGE_META["/contact"]?.[locale] ?? PAGE_META["/contact"].en;
  const alternates = getLocalizedAlternates("/contact");
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      type: "website",
    },
  };
}

export default async function ContactPage() {
  const [contactPage] = await Promise.all([fetchContactPage()]);
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.contact", canonicalPath: "/contact" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ContactContent contactPage={contactPage} />
    </>
  );
}
