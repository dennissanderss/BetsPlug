import { defineType } from "sanity";

// Keep in lockstep with `src/i18n/config.ts`.
// Adding a locale here:
//   1. Add the locale to config.ts locales + localeMeta.
//   2. Add the row below.
//   3. Run `node scripts/translate-sanity.mjs` to backfill content.
const localeFields = [
  { name: "en", title: "English", fieldset: undefined },
  { name: "nl", title: "Dutch", fieldset: "translations" },
  { name: "de", title: "German", fieldset: "translations" },
  { name: "fr", title: "French", fieldset: "translations" },
  { name: "es", title: "Spanish", fieldset: "translations" },
  { name: "it", title: "Italian", fieldset: "translations" },
  { name: "sw", title: "Swahili", fieldset: "translations" },
  { name: "id", title: "Indonesian", fieldset: "translations" },
  { name: "pt", title: "Portuguese", fieldset: "translations" },
  { name: "tr", title: "Turkish", fieldset: "translations" },
  { name: "pl", title: "Polish", fieldset: "translations" },
  { name: "ro", title: "Romanian", fieldset: "translations" },
  { name: "ru", title: "Russian", fieldset: "translations" },
  { name: "el", title: "Greek", fieldset: "translations" },
  { name: "da", title: "Danish", fieldset: "translations" },
  { name: "sv", title: "Swedish", fieldset: "translations" },
] as const;

export const localeString = defineType({
  name: "localeString",
  title: "Localized String",
  type: "object",
  fieldsets: [
    {
      name: "translations",
      title: "Translations",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: localeFields.map((loc) => ({
    name: loc.name,
    title: loc.title,
    type: "string" as const,
    fieldset: loc.fieldset,
    validation: loc.name === "en" ? (r: any) => r.required() : undefined,
  })),
});

export const localeText = defineType({
  name: "localeText",
  title: "Localized Text",
  type: "object",
  fieldsets: [
    {
      name: "translations",
      title: "Translations",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: localeFields.map((loc) => ({
    name: loc.name,
    title: loc.title,
    type: "text" as const,
    rows: 4,
    fieldset: loc.fieldset,
    validation: loc.name === "en" ? (r: any) => r.required() : undefined,
  })),
});

export const localeBlockContent = defineType({
  name: "localeBlockContent",
  title: "Localized Rich Text",
  type: "object",
  fieldsets: [
    {
      name: "translations",
      title: "Translations",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: localeFields.map((loc) => ({
    name: loc.name,
    title: loc.title,
    type: "array" as const,
    fieldset: loc.fieldset,
    of: [
      {
        type: "block" as const,
        styles: [
          { title: "Normal", value: "normal" as const },
          { title: "H2", value: "h2" as const },
          { title: "H3", value: "h3" as const },
        ],
        lists: [
          { title: "Bullet", value: "bullet" as const },
          { title: "Numbered", value: "number" as const },
        ],
        marks: {
          decorators: [
            { title: "Bold", value: "strong" as const },
            { title: "Italic", value: "em" as const },
          ],
          annotations: [
            {
              name: "link",
              type: "object" as const,
              title: "Link",
              fields: [
                { name: "href", type: "url" as const, title: "URL" },
              ],
            },
          ],
        },
      },
    ],
    validation: loc.name === "en" ? (r: any) => r.required() : undefined,
  })),
});
