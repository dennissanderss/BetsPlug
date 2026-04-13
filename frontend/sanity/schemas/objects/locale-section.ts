import { defineType } from "sanity";

export const localeSection = defineType({
  name: "localeSection",
  title: "Content Section",
  type: "object",
  fields: [
    {
      name: "heading",
      title: "Heading",
      type: "localeString",
      validation: (r) => r.required(),
    },
    {
      name: "body",
      title: "Body",
      type: "localeText",
      description: "Separate paragraphs with a blank line.",
      validation: (r) => r.required(),
    },
  ],
  preview: {
    select: { title: "heading.en" },
  },
});
