import { defineType, defineField } from "sanity";
import { BarChartIcon } from "@sanity/icons";

export const trackRecordPage = defineType({
  name: "trackRecordPage",
  title: "Track Record Page",
  type: "document",
  icon: BarChartIcon,
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
