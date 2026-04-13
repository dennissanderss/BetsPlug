import { defineType, defineField } from "sanity";
import { TrophyIcon } from "lucide-react";
import { sanityIcon } from "../../icon-wrapper";

export const leagueHub = defineType({
  name: "leagueHub",
  title: "League Hub",
  type: "document",
  icon: sanityIcon(TrophyIcon),
  fieldsets: [
    { name: "seo", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "name",
      title: "League Name",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name.en", maxLength: 96 },
      description: "Must match League.slug in the backend database.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sportSlug",
      title: "Sport",
      type: "string",
      options: { list: [{ title: "Football", value: "football" }] },
      initialValue: "football",
      readOnly: true,
    }),
    defineField({
      name: "countryCode",
      title: "Country Code",
      type: "string",
      description: "ISO-3166-1 alpha-2, e.g. GB, ES, DE. Use EU for UEFA.",
      validation: (r) => r.required().max(3),
    }),
    defineField({
      name: "countryFlag",
      title: "Country Flag",
      type: "string",
      description: "Emoji flag.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "country",
      title: "Country Name",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "localeText",
      description: "~150 word introductory paragraph.",
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
    select: { title: "name.en", flag: "countryFlag" },
    prepare({ title, flag }) {
      return { title: `${flag ?? ""} ${title ?? "Untitled"}` };
    },
  },
});
