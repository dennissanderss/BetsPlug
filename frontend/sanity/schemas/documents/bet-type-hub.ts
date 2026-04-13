import { defineType, defineField } from "sanity";
import { TargetIcon } from "@sanity/icons";

export const betTypeHub = defineType({
  name: "betTypeHub",
  title: "Bet Type Hub",
  type: "document",
  icon: TargetIcon,
  fieldsets: [
    { name: "seo", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Market Name",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name.en", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "shortCode",
      title: "Short Code",
      type: "string",
      description: "Market code, e.g. BTTS, O2.5, DC, DNB.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "explainer",
      title: "Explainer",
      type: "localeText",
      description: "What is this market? (~200 words)",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "strategy",
      title: "Strategy",
      type: "localeText",
      description: "When to use/avoid this market. (~200 words)",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "matchesHeading",
      title: "Matches Heading",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "matchesSub",
      title: "Matches Subtitle",
      type: "localeText",
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
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      of: [{ type: "localeFaq" }],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "name.en", code: "shortCode" },
    prepare({ title, code }) {
      return { title: title ?? "Untitled", subtitle: code };
    },
  },
});
