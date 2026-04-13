import { ContactContent } from "./contact-content";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getLocalizedBreadcrumbs } from "@/lib/seo-helpers";
import { fetchContactPage } from "@/lib/sanity-data";

export const revalidate = 60;

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
