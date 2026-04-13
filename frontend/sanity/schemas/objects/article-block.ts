import { defineType } from "sanity";

export const articleBlock = defineType({
  name: "articleBlock",
  title: "Article Block",
  type: "object",
  fields: [
    {
      name: "blockType",
      title: "Block Type",
      type: "string",
      options: {
        list: [
          { title: "Paragraph", value: "paragraph" },
          { title: "Heading", value: "heading" },
          { title: "Quote", value: "quote" },
          { title: "List", value: "list" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (r) => r.required(),
    },
    {
      name: "text",
      title: "Text",
      type: "text",
      rows: 3,
      hidden: ({ parent }: { parent?: { blockType?: string } }) =>
        parent?.blockType === "list",
    },
    {
      name: "cite",
      title: "Citation",
      type: "string",
      hidden: ({ parent }: { parent?: { blockType?: string } }) =>
        parent?.blockType !== "quote",
    },
    {
      name: "items",
      title: "List Items",
      type: "array",
      of: [{ type: "string" }],
      hidden: ({ parent }: { parent?: { blockType?: string } }) =>
        parent?.blockType !== "list",
    },
  ],
  preview: {
    select: { blockType: "blockType", text: "text" },
    prepare({ blockType, text }: { blockType?: string; text?: string }) {
      return {
        title: text ? text.slice(0, 80) : "(empty)",
        subtitle: blockType ?? "block",
      };
    },
  },
});
