import { ContactContent } from "./contact-content";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getLocalizedBreadcrumbs } from "@/lib/seo-helpers";

export default function ContactPage() {
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "bc.contact", canonicalPath: "/contact" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ContactContent />
    </>
  );
}
