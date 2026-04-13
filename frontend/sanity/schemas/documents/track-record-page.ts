import { defineType, defineField } from "sanity";
import { BarChart3Icon } from "lucide-react";

export const trackRecordPage = defineType({
  name: "trackRecordPage",
  title: "Track Record Page",
  type: "document",
  icon: BarChart3Icon,
  fields: [
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      of: [{ type: "localeFaq" }],
    }),
  ],
  preview: {
    prepare() { return { title: "Track Record Page" }; },
  },
});
