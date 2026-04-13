import { defineType, defineField } from "sanity";

export const checkoutPage = defineType({
  name: "checkoutPage",
  title: "Checkout Page",
  type: "document",
  fields: [
    defineField({
      name: "trustStrip",
      title: "Trust Strip Labels",
      type: "array",
      description: "Trust badges shown below the checkout form.",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", type: "localeString", title: "Label" },
            { name: "icon", type: "string", title: "Icon name (lucide)" },
          ],
          preview: { select: { title: "label.en" } },
        },
      ],
    }),
  ],
  preview: {
    prepare() { return { title: "Checkout Page" }; },
  },
});
