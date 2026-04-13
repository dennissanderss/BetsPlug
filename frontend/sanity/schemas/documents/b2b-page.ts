import { defineType, defineField } from "sanity";
import { BriefcaseIcon } from "lucide-react";

export const b2bPage = defineType({
  name: "b2bPage",
  title: "B2B Page",
  type: "document",
  icon: BriefcaseIcon,
  fields: [
    defineField({
      name: "partnershipTypes",
      title: "Partnership Types",
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
      name: "usps",
      title: "USPs",
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
  ],
  preview: {
    prepare() { return { title: "B2B Page" }; },
  },
});
