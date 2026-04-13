import { defineType, defineField } from "sanity";
import { ShieldIcon } from "lucide-react";
import { sanityIcon } from "../../icon-wrapper";

export const legalPage = defineType({
  name: "legalPage",
  title: "Legal Page",
  type: "document",
  icon: sanityIcon(ShieldIcon),
  fieldsets: [
    { name: "seo", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "pageType",
      title: "Page Type",
      type: "string",
      options: {
        list: [
          { title: "Terms of Service", value: "terms" },
          { title: "Privacy Policy", value: "privacy" },
          { title: "Cookie Policy", value: "cookies" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "intro",
      title: "Subtitle",
      type: "string",
      description: "Shown below the page heading.",
    }),
    defineField({
      name: "lastUpdated",
      title: "Last Updated",
      type: "date",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      title: "Content",
      type: "localeBlockContent",
      description: "Full legal text with headings, paragraphs, and lists.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "localeString",
      fieldset: "seo",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "localeText",
      fieldset: "seo",
    }),
  ],
  preview: {
    select: { title: "title", type: "pageType" },
    prepare({ title, type }) {
      return { title: title ?? "Untitled", subtitle: type };
    },
  },
});
