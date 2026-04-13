import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";

export const pricingConfig = defineType({
  name: "pricingConfig",
  title: "Pricing",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "plans",
      title: "Plans",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "planId", type: "string", title: "Plan ID", description: "e.g. bronze, silver, gold, platinum" },
            { name: "name", type: "localeString", title: "Plan Name" },
            { name: "monthlyPrice", type: "number", title: "Monthly Price (€)" },
            { name: "yearlyPrice", type: "number", title: "Yearly Price (€/month)" },
            { name: "features", type: "array", title: "Features", of: [{ type: "localeString" }] },
            { name: "badge", type: "localeString", title: "Badge (optional)", description: "e.g. Most Popular" },
            { name: "highlighted", type: "boolean", title: "Highlighted", initialValue: false },
          ],
          preview: {
            select: { title: "name.en", price: "monthlyPrice" },
            prepare({ title, price }: any) { return { title, subtitle: `€${price}/mo` }; },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() { return { title: "Pricing Configuration" }; },
  },
});
