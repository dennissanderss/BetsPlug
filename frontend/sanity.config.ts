import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";
import { structure } from "./sanity/desk-structure";

export default defineConfig({
  name: "betsplug",
  title: "BetsPlug Content",

  projectId: "nk7ioy85",
  dataset: "production",

  basePath: "/studio",

  plugins: [structureTool({ structure }), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
