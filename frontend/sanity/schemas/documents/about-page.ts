import { defineType, defineField } from "sanity";
import { UsersIcon } from "lucide-react";
import { sanityIcon } from "../../icon-wrapper";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  icon: sanityIcon(UsersIcon),
  fieldsets: [
    { name: "team", title: "Team", options: { collapsible: true } },
    { name: "stats", title: "Statistics", options: { collapsible: true, collapsed: true } },
    { name: "values", title: "Values", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "founders",
      title: "Founders",
      type: "array",
      fieldset: "team",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string", title: "Name" },
            { name: "initial", type: "string", title: "Initial (1 letter)" },
            { name: "role", type: "localeString", title: "Role" },
            { name: "bio", type: "localeText", title: "Bio" },
          ],
          preview: { select: { title: "name", subtitle: "role.en" } },
        },
      ],
    }),
    defineField({
      name: "stats",
      title: "Stats",
      type: "array",
      fieldset: "stats",
      of: [
        {
          type: "object",
          fields: [
            { name: "value", type: "string", title: "Value", description: "e.g. 20+, 450+" },
            { name: "label", type: "localeString", title: "Label" },
          ],
          preview: { select: { title: "value", subtitle: "label.en" } },
        },
      ],
    }),
    defineField({
      name: "values",
      title: "Values",
      type: "array",
      fieldset: "values",
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
  ],
  preview: {
    prepare() { return { title: "About Page" }; },
  },
});
