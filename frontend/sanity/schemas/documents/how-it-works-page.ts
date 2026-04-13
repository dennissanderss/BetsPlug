import { defineType, defineField } from "sanity";

export const howItWorksPage = defineType({
  name: "howItWorksPage",
  title: "How It Works Page",
  type: "document",
  fields: [
    defineField({
      name: "heroStats",
      title: "Hero Stats",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "value", type: "string", title: "Value" },
            { name: "label", type: "localeString", title: "Label" },
          ],
          preview: { select: { title: "value", subtitle: "label.en" } },
        },
      ],
    }),
    defineField({
      name: "steps",
      title: "Steps",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "localeString", title: "Title" },
            { name: "description", type: "localeText", title: "Description" },
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
    prepare() { return { title: "How It Works" }; },
  },
});
