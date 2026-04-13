import { defineType, defineField } from "sanity";

export const trackRecordPage = defineType({
  name: "trackRecordPage",
  title: "Track Record Page",
  type: "document",
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
