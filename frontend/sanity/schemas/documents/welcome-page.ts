import { defineType, defineField } from "sanity";
import { SparklesIcon } from "lucide-react";
import { sanityIcon } from "../../icon-wrapper";

export const welcomePage = defineType({
  name: "welcomePage",
  title: "Welcome Page",
  type: "document",
  icon: sanityIcon(SparklesIcon),
  fields: [
    defineField({
      name: "nextSteps",
      title: "Next Steps",
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
  ],
  preview: {
    prepare() { return { title: "Welcome Page" }; },
  },
});
