import { groq } from "next-sanity";

// ── Articles ──────────────────────────────────────────────
export const allArticlesQuery = groq`
  *[_type == "article"] | order(publishedAt desc) {
    _id, title, slug, excerpt, sport, author, publishedAt,
    readingMinutes, coverGradient, coverPattern, coverImage, coverImageAlt
  }
`;

export const articleBySlugQuery = groq`
  *[_type == "article" && slug.current == $slug][0] {
    _id, title, slug, excerpt, metaTitle, metaDescription,
    sport, author, publishedAt, updatedAt, readingMinutes,
    coverGradient, coverPattern, coverImage, coverImageAlt,
    tldr, blocks
  }
`;

// ── Learn Pillars ─────────────────────────────────────────
export const allLearnPillarsQuery = groq`
  *[_type == "learnPillar"] | order(title.en asc) {
    _id, title, slug, tagline
  }
`;

export const learnPillarBySlugQuery = groq`
  *[_type == "learnPillar" && slug.current == $slug][0] {
    _id, title, slug, tagline, metaTitle, metaDescription,
    intro, sections, faqs,
    related[]->{ _id, title, slug, tagline }
  }
`;

// ── League Hubs ───────────────────────────────────────────
export const allLeagueHubsQuery = groq`
  *[_type == "leagueHub"] | order(name.en asc) {
    _id, name, slug, countryCode, countryFlag, country
  }
`;

export const leagueHubBySlugQuery = groq`
  *[_type == "leagueHub" && slug.current == $slug][0] {
    _id, name, slug, sportSlug, countryCode, countryFlag,
    country, tagline, intro, metaTitle, metaDescription, faqs
  }
`;

// ── Bet Type Hubs ─────────────────────────────────────────
export const allBetTypeHubsQuery = groq`
  *[_type == "betTypeHub"] | order(name.en asc) {
    _id, name, slug, shortCode, tagline
  }
`;

export const betTypeHubBySlugQuery = groq`
  *[_type == "betTypeHub" && slug.current == $slug][0] {
    _id, name, slug, shortCode, tagline, explainer, strategy,
    matchesHeading, matchesSub, metaTitle, metaDescription, faqs
  }
`;

// ── Testimonials ──────────────────────────────────────────
export const allTestimonialsQuery = groq`
  *[_type == "testimonial"] {
    _id, name, role, text, image
  }
`;

// ── Legal Pages ───────────────────────────────────────────
export const legalPageByTypeQuery = groq`
  *[_type == "legalPage" && pageType == $pageType][0] {
    _id, pageType, title, intro, lastUpdated,
    body, metaTitle, metaDescription
  }
`;

// ── Page SEO ──────────────────────────────────────────────
export const pageMetaByKeyQuery = groq`
  *[_type == "pageMeta" && pageKey == $pageKey][0] {
    _id, pageKey, title, description, ogTitle, ogDescription
  }
`;
