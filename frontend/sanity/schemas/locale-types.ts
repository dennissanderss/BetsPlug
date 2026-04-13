import { defineType } from "sanity";

const localeFields = [
  { name: "en", title: "English", fieldset: undefined },
  { name: "nl", title: "Dutch", fieldset: "translations" },
  { name: "de", title: "German", fieldset: "translations" },
  { name: "fr", title: "French", fieldset: "translations" },
  { name: "es", title: "Spanish", fieldset: "translations" },
  { name: "it", title: "Italian", fieldset: "translations" },
  { name: "sw", title: "Swahili", fieldset: "translations" },
  { name: "id", title: "Indonesian", fieldset: "translations" },
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
