import { defineType, defineField } from "sanity";
import { HomeIcon } from "@sanity/icons";

/**
 * Homepage singleton — full editorial surface for the public landing
 * page. Sections are grouped into collapsible fieldsets so marketing
 * can edit one band at a time without scrolling through 80+ fields.
 *
 * Every user-facing string uses `localeString` / `localeText` so all
 * 8 locales (en, nl, de, fr, es, it, sw, id) can be maintained here.
 *
 * Frontend fetch lives in `src/lib/sanity-data.ts`; when a field is
 * empty, components fall back to the corresponding key in
 * `src/i18n/messages.ts` so the page never ships a blank section.
 */
export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  icon: HomeIcon,
  fieldsets: [
    { name: "hero", title: "Hero Section", options: { collapsible: true } },
    { name: "comparison", title: "Comparison Table", options: { collapsible: true, collapsed: true } },
    { name: "trusted", title: "Trusted Section", options: { collapsible: true, collapsed: true } },
    { name: "features", title: "Features Grid", options: { collapsible: true, collapsed: true } },
    { name: "trackRecord", title: "Track Record Stats", options: { collapsible: true, collapsed: true } },
    { name: "seo", title: "SEO Section", options: { collapsible: true, collapsed: true } },
    { name: "homeFaq", title: "Homepage FAQ", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    /* ── Hero Section ─────────────────────────────────────── */
    defineField({
      name: "heroBadge",
      title: "Hero Badge",
      type: "localeString",
      fieldset: "hero",
      description: 'Pill shown above the hero title. E.g. "AI predictions for every match".',
    }),
    defineField({
      name: "heroTitleLine1",
      title: "Hero Title — Line 1",
      type: "localeString",
      fieldset: "hero",
    }),
    defineField({
      name: "heroTitleLine2",
      title: "Hero Title — Line 2",
      type: "localeString",
      fieldset: "hero",
    }),
    defineField({
      name: "heroTitleLine3",
      title: "Hero Title — Line 3 (optional)",
      type: "localeString",
      fieldset: "hero",
    }),
    defineField({
      name: "heroSubtitle",
      title: "Hero Subtitle",
      type: "localeText",
      fieldset: "hero",
    }),
    defineField({
      name: "heroCtaPrimary",
      title: "Primary CTA Label",
      type: "localeString",
      fieldset: "hero",
    }),
    defineField({
      name: "heroCtaSecondary",
      title: "Secondary CTA Label",
      type: "localeString",
      fieldset: "hero",
    }),
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
      name: "heroUsps",
      title: "Hero USPs",
      type: "array",
      fieldset: "hero",
      description: "Unique-selling-point cards under the hero CTAs.",
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

    /* ── Comparison Section ───────────────────────────────── */
    defineField({
      name: "comparisonBadge",
      title: "Comparison Badge",
      type: "localeString",
      fieldset: "comparison",
    }),
    defineField({
      name: "comparisonTitleA",
      title: "Comparison Title — Part A",
      type: "localeString",
      fieldset: "comparison",
    }),
    defineField({
      name: "comparisonTitleB",
      title: "Comparison Title — Part B (highlighted)",
      type: "localeString",
      fieldset: "comparison",
    }),
    defineField({
      name: "comparisonSubtitle",
      title: "Comparison Subtitle",
      type: "localeText",
      fieldset: "comparison",
    }),
    defineField({
      name: "comparisonCaption",
      title: "Comparison Caption",
      type: "localeText",
      fieldset: "comparison",
      description: "Small caption under the comparison table.",
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

    /* ── Trusted Section ──────────────────────────────────── */
    defineField({
      name: "trustedTitleA",
      title: "Trusted Title — Part A",
      type: "localeString",
      fieldset: "trusted",
    }),
    defineField({
      name: "trustedTitleHighlight",
      title: "Trusted Title — Highlighted Number",
      type: "localeString",
      fieldset: "trusted",
      description: 'E.g. "1,500+".',
    }),
    defineField({
      name: "trustedTitleB",
      title: "Trusted Title — Part B",
      type: "localeString",
      fieldset: "trusted",
    }),
    defineField({
      name: "trustedTitleC",
      title: "Trusted Title — Part C",
      type: "localeString",
      fieldset: "trusted",
    }),
    defineField({
      name: "trustedSubtitle",
      title: "Trusted Subtitle",
      type: "localeText",
      fieldset: "trusted",
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

    /* ── Features Section ─────────────────────────────────── */
    defineField({
      name: "featuresBadge",
      title: "Features Badge",
      type: "localeString",
      fieldset: "features",
    }),
    defineField({
      name: "featuresTitleA",
      title: "Features Title — Part A",
      type: "localeString",
      fieldset: "features",
    }),
    defineField({
      name: "featuresTitleB",
      title: "Features Title — Part B",
      type: "localeString",
      fieldset: "features",
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

    /* ── Track Record Section ─────────────────────────────── */
    defineField({
      name: "trackRecordBadge",
      title: "Track Record Badge",
      type: "localeString",
      fieldset: "trackRecord",
    }),
    defineField({
      name: "trackRecordTitle",
      title: "Track Record Title",
      type: "localeString",
      fieldset: "trackRecord",
    }),
    defineField({
      name: "trackRecordSubtitle",
      title: "Track Record Subtitle",
      type: "localeText",
      fieldset: "trackRecord",
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

    /* ── SEO Section ──────────────────────────────────────── */
    defineField({
      name: "seoBadge",
      title: "SEO Badge",
      type: "localeString",
      fieldset: "seo",
    }),
    defineField({
      name: "seoTitleA",
      title: "SEO Title — Part A",
      type: "localeString",
      fieldset: "seo",
    }),
    defineField({
      name: "seoTitleB",
      title: "SEO Title — Part B (highlighted)",
      type: "localeString",
      fieldset: "seo",
    }),
    defineField({
      name: "seoSubtitle",
      title: "SEO Subtitle",
      type: "localeText",
      fieldset: "seo",
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
      title: "SEO FAQs (legacy)",
      type: "array",
      fieldset: "seo",
      description: "Legacy — use 'Homepage FAQ' below for the new categorized accordion.",
      of: [{ type: "localeFaq" }],
    }),

    /* ── Homepage FAQ ─────────────────────────────────────── */
    defineField({
      name: "faqBadge",
      title: "FAQ Badge",
      type: "localeString",
      fieldset: "homeFaq",
    }),
    defineField({
      name: "faqTitleA",
      title: "FAQ Title — Part A",
      type: "localeString",
      fieldset: "homeFaq",
    }),
    defineField({
      name: "faqTitleB",
      title: "FAQ Title — Part B (highlighted)",
      type: "localeString",
      fieldset: "homeFaq",
    }),
    defineField({
      name: "faqSubtitle",
      title: "FAQ Subtitle",
      type: "localeText",
      fieldset: "homeFaq",
    }),
    defineField({
      name: "faqBrowseBy",
      title: '"Browse by Category" label',
      type: "localeString",
      fieldset: "homeFaq",
    }),
    defineField({
      name: "faqStillQuestions",
      title: '"Still have questions?" label',
      type: "localeString",
      fieldset: "homeFaq",
    }),
    defineField({
      name: "faqSupportBlurb",
      title: "Support blurb",
      type: "localeText",
      fieldset: "homeFaq",
    }),
    defineField({
      name: "faqContactSupport",
      title: '"Contact Support" CTA label',
      type: "localeString",
      fieldset: "homeFaq",
    }),
    defineField({
      name: "homeFaqCategories",
      title: "FAQ Categories",
      type: "array",
      fieldset: "homeFaq",
      description:
        "Categorized accordion. The `id` is a stable slug the frontend uses to map to an icon (getting-started, predictions, pricing, data-security). Each category holds its own list of Q/A items.",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "id",
              type: "string",
              title: "Category ID",
              description: "Slug used by the frontend to map to an icon.",
              options: {
                list: [
                  { title: "Getting Started", value: "getting-started" },
                  { title: "Predictions & Models", value: "predictions" },
                  { title: "Pricing & Billing", value: "pricing" },
                  { title: "Data & Security", value: "data-security" },
                ],
              },
              validation: (r: any) => r.required(),
            },
            { name: "label", type: "localeString", title: "Category Label" },
            {
              name: "items",
              type: "array",
              title: "FAQ Items",
              of: [{ type: "localeFaq" }],
            },
          ],
          preview: {
            select: { title: "label.en", subtitle: "id" },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() { return { title: "Homepage" }; },
  },
});
