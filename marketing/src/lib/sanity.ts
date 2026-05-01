import { createClient, type SanityClient } from "@sanity/client";
import { toHTML } from "@portabletext/to-html";

const projectId =
  import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "nk7ioy85";
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? "production";

/** Read-only Sanity client. Cached at build / request time by Astro. */
export const sanity: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: true,
});

// ── Localised string helper ──────────────────────────────────
// Sanity stores `title`, `tagline` etc. as { en, nl, ... } objects.
// On the marketing site we only ever render English at this point —
// keep the helper centralized so when a locale switcher arrives
// later it's a one-line change.
export type LocalisedString = Record<string, string | undefined> | string | undefined;

export function localised(value: LocalisedString, locale = "en"): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] ?? value.en ?? "";
}

// ── Portable text → HTML (server-side) ──────────────────────
// Renders Sanity's rich-text format to plain HTML strings without
// any client-side JavaScript. Astro pages can drop this into a
// <Fragment set:html={...}> with our existing `Prose` styling.
export function renderPortableText(blocks: unknown): string {
  if (!blocks) return "";
  try {
    return toHTML(blocks as any, {
      components: {
        block: {
          h1: ({ children }: any) => `<h1>${children}</h1>`,
          h2: ({ children }: any) => `<h2>${children}</h2>`,
          h3: ({ children }: any) => `<h3>${children}</h3>`,
          h4: ({ children }: any) => `<h4>${children}</h4>`,
          normal: ({ children }: any) => `<p>${children}</p>`,
          blockquote: ({ children }: any) =>
            `<blockquote>${children}</blockquote>`,
        },
        marks: {
          link: ({ children, value }: any) =>
            `<a href="${value?.href ?? "#"}" rel="noopener" target="_blank">${children}</a>`,
          strong: ({ children }: any) => `<strong>${children}</strong>`,
          em: ({ children }: any) => `<em>${children}</em>`,
        },
      },
    });
  } catch {
    return "";
  }
}

// ── Queries (mirrors frontend/sanity/lib/queries.ts) ────────
export const allLearnPillarsQuery = `
  *[_type == "learnPillar"] | order(title.en asc) {
    _id, title, slug, tagline
  }
`;

export const learnPillarBySlugQuery = `
  *[_type == "learnPillar" && slug.current == $slug][0] {
    _id, title, slug, tagline, metaTitle, metaDescription,
    intro, sections, faqs,
    related[]->{ _id, title, slug, tagline }
  }
`;

// ── Types ────────────────────────────────────────────────────
export interface LearnPillarSummary {
  _id: string;
  title: LocalisedString;
  slug: { current: string };
  tagline: LocalisedString;
}

export interface LearnPillarSection {
  _key: string;
  heading?: LocalisedString;
  body?: unknown; // portable-text array, locale-keyed
}

export interface LearnPillarFaq {
  _key: string;
  question?: LocalisedString;
  answer?: LocalisedString;
}

export interface LearnPillar extends LearnPillarSummary {
  metaTitle?: LocalisedString;
  metaDescription?: LocalisedString;
  intro?: unknown;
  sections?: LearnPillarSection[];
  faqs?: LearnPillarFaq[];
  related?: LearnPillarSummary[];
}
