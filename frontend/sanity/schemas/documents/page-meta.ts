import { defineType, defineField } from "sanity";

export const pageMeta = defineType({
  name: "pageMeta",
  title: "Page SEO",
  type: "document",
  fields: [
    defineField({
      name: "pageKey",
      title: "Page Path",
      type: "string",
      description: "Canonical path, e.g. / or /articles or /about-us",
      validation: (r) =>
        r
          .required()
          .custom((val) =>
            typeof val === "string" && val.startsWith("/")
              ? true
              : "Must start with /",
          ),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      description: "Max 60 characters per locale.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localeText",
      description: "120-160 characters per locale.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "ogTitle",
      title: "OG Title",
      type: "localeString",
      description: "Optional shorter title for social media.",
    }),
    defineField({
      name: "ogDescription",
      title: "OG Description",
      type: "localeText",
      description: "Optional description for social media.",
    }),
  ],
  preview: {
    select: { title: "pageKey" },
    prepare({ title }) {
      return { title: title ?? "/", subtitle: "Page SEO" };
    },
  },
});
