import { defineType, defineField } from "sanity";
import { MailIcon } from "lucide-react";
import { sanityIcon } from "../../icon-wrapper";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact Page",
  type: "document",
  icon: sanityIcon(MailIcon),
  fields: [
    defineField({
      name: "helpOptions",
      title: "Help Options",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "localeString", title: "Title" },
            { name: "description", type: "localeText", title: "Description" },
            { name: "cta", type: "localeString", title: "CTA Text" },
            { name: "icon", type: "string", title: "Icon name (lucide)" },
          ],
          preview: { select: { title: "title.en" } },
        },
      ],
    }),
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      of: [{ type: "localeFaq" }],
    }),
  ],
  preview: {
    prepare() { return { title: "Contact Page" }; },
  },
});
