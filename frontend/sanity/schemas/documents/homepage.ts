import { defineType, defineField } from "sanity";

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fieldsets: [
    { name: "hero", title: "Hero Section", options: { collapsible: true } },
    { name: "comparison", title: "Comparison Table", options: { collapsible: true, collapsed: true } },
    { name: "trusted", title: "Trusted Section", options: { collapsible: true, collapsed: true } },
    { name: "features", title: "Features Grid", options: { collapsible: true, collapsed: true } },
    { name: "trackRecord", title: "Track Record Stats", options: { collapsible: true, collapsed: true } },
    { name: "seo", title: "SEO Section", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "heroStats",
      title: "Hero Stats",
      type: "array",
      fieldset: "hero",
      of: [
        {
          type: "object",
          fields: [
            { name: "value", type: "string", title: "Value" },
            { name: "label", type: "localeString", title: "Label" },
          ],
          preview: {
            select: { title: "value", subtitle: "label.en" },
          },
        },
      ],
    }),
    defineField({
      name: "accuracyBars",
      title: "Accuracy Bars",
      type: "array",
      fieldset: "hero",
      of: [
        {
          type: "object",
          fields: [
            { name: "league", type: "string", title: "League Name" },
            { name: "percentage", type: "number", title: "Accuracy %", validation: (r: any) => r.min(0).max(100) },
          ],
          preview: {
            select: { title: "league", subtitle: "percentage" },
            prepare({ title, subtitle }: any) { return { title, subtitle: `${subtitle}%` }; },
          },
        },
      ],
    }),
    defineField({
      name: "comparisonRows",
      title: "Comparison Rows",
      type: "array",
      fieldset: "comparison",
      of: [
        {
          type: "object",
          fields: [
            { name: "feature", type: "localeString", title: "Feature" },
            { name: "betsplug", type: "boolean", title: "BetsPlug", initialValue: true },
            { name: "freeTools", type: "boolean", title: "Free Tools", initialValue: false },
            { name: "bookmakers", type: "boolean", title: "Bookmakers", initialValue: false },
            { name: "note", type: "localeString", title: "Note (optional)" },
          ],
          preview: {
            select: { title: "feature.en" },
          },
        },
      ],
    }),
    defineField({
      name: "trustedCards",
      title: "Trusted Cards",
      type: "array",
      fieldset: "trusted",
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
      name: "featuresGrid",
      title: "Features",
      type: "array",
      fieldset: "features",
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
      name: "trackRecordStats",
      title: "Track Record Stats",
      type: "array",
      fieldset: "trackRecord",
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
      name: "seoPillars",
      title: "SEO Pillars",
      type: "array",
      fieldset: "seo",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "localeString", title: "Title" },
            { name: "description", type: "localeText", title: "Description" },
          ],
          preview: { select: { title: "title.en" } },
        },
      ],
    }),
    defineField({
      name: "seoFaqs",
      title: "SEO FAQs",
      type: "array",
      fieldset: "seo",
      of: [{ type: "localeFaq" }],
    }),
  ],
  preview: {
    prepare() { return { title: "Homepage" }; },
  },
});
