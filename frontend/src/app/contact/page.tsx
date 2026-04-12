import { ContactContent } from "./contact-content";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />
      <ContactContent />
    </>
  );
}
