import { defineType, defineField } from "sanity";
import { BookIcon } from "@sanity/icons";

export const learnPillar = defineType({
  name: "learnPillar",
  title: "Learn Pillar",
  type: "document",
  icon: BookIcon,
  fieldsets: [
    { name: "seo", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.en", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "localeString",
      fieldset: "seo",
      description: "Max 60 characters per locale.",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "localeText",
      fieldset: "seo",
      description: "120-160 characters per locale.",
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "localeText",
      description: "Opening paragraph before the first section.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [{ type: "localeSection" }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      of: [{ type: "localeFaq" }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "related",
      title: "Related Pillars",
      type: "array",
      of: [{ type: "reference", to: [{ type: "learnPillar" }] }],
      validation: (r) => r.max(3),
    }),
  ],
  preview: {
    select: { title: "title.en", slug: "slug.current" },
    prepare({ title, slug }) {
      return { title: title ?? slug, subtitle: `/learn/${slug}` };
    },
  },
});
