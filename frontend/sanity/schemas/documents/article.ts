import { defineType, defineField } from "sanity";
import { FileTextIcon } from "lucide-react";

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  icon: FileTextIcon,
  fieldsets: [
    { name: "seo", title: "SEO", options: { collapsible: true, collapsed: true } },
    { name: "cover", title: "Cover", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      description: "Short teaser shown in article cards.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      fieldset: "seo",
      validation: (r) => r.required().max(60),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 2,
      fieldset: "seo",
      validation: (r) => r.required().min(120).max(160),
    }),
    defineField({
      name: "sport",
      title: "Sport",
      type: "string",
      options: { list: [{ title: "Football", value: "football" }] },
      initialValue: "football",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
      initialValue: "The BetsPlug Team",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "date",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "date",
    }),
    defineField({
      name: "readingMinutes",
      title: "Reading Time (minutes)",
      type: "number",
      validation: (r) => r.required().min(1).max(60),
    }),
    defineField({
      name: "coverGradient",
      title: "Cover Gradient",
      type: "string",
      fieldset: "cover",
      description: "CSS gradient string, e.g. linear-gradient(135deg, #1a1a2e 0%, ...)",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "coverPattern",
      title: "Cover Pattern",
      type: "string",
      fieldset: "cover",
      options: {
        list: [
          { title: "Dots", value: "dots" },
          { title: "Grid", value: "grid" },
          { title: "Diagonal", value: "diagonal" },
        ],
      },
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      fieldset: "cover",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverImageAlt",
      title: "Cover Image Alt",
      type: "string",
      fieldset: "cover",
    }),
    defineField({
      name: "tldr",
      title: "TL;DR",
      type: "text",
      rows: 2,
      description: "Pull-quote shown in the article header.",
    }),
    defineField({
      name: "blocks",
      title: "Content Blocks",
      type: "array",
      of: [{ type: "articleBlock" }],
      validation: (r) => r.required().min(1),
    }),
  ],
  orderings: [
    {
      title: "Published Date (newest)",
      name: "publishedDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "sport", date: "publishedAt" },
    prepare({ title, subtitle, date }) {
      return {
        title,
        subtitle: `${subtitle ?? "football"} — ${date ?? "draft"}`,
      };
    },
  },
});
