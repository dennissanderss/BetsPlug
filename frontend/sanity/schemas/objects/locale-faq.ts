import { defineType } from "sanity";

export const localeFaq = defineType({
  name: "localeFaq",
  title: "FAQ Item",
  type: "object",
  fields: [
    {
      name: "question",
      title: "Question",
      type: "localeString",
      validation: (r) => r.required(),
    },
    {
      name: "answer",
      title: "Answer",
      type: "localeText",
      validation: (r) => r.required(),
    },
  ],
  preview: {
    select: { title: "question.en" },
  },
});
