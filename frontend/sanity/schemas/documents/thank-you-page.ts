import { defineType, defineField } from "sanity";
import { HeartIcon } from "@sanity/icons";

export const thankYouPage = defineType({
  name: "thankYouPage",
  title: "Thank You Page",
  type: "document",
  icon: HeartIcon,
  fields: [
    defineField({
      name: "planFeatures",
      title: "Plan Features",
      type: "array",
      description: "Features shown per plan after purchase.",
      of: [
        {
          type: "object",
          fields: [
            { name: "planId", type: "string", title: "Plan ID", description: "bronze, silver, gold, platinum" },
            {
              name: "features",
              type: "array",
              title: "Features",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "title", type: "localeString", title: "Title" },
                    { name: "body", type: "localeText", title: "Body" },
                  ],
                  preview: { select: { title: "title.en" } },
                },
              ],
            },
          ],
          preview: { select: { title: "planId" } },
        },
      ],
    }),
  ],
  preview: {
    prepare() { return { title: "Thank You Page" }; },
  },
});
