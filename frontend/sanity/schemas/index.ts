// Locale types (must be registered first — documents reference them)
import { localeString, localeText, localeBlockContent } from "./locale-types";

// Object types
import { localeFaq } from "./objects/locale-faq";
import { localeSection } from "./objects/locale-section";
import { articleBlock } from "./objects/article-block";

// Document types
import { article } from "./documents/article";
import { learnPillar } from "./documents/learn-pillar";
import { leagueHub } from "./documents/league-hub";
import { betTypeHub } from "./documents/bet-type-hub";
import { legalPage } from "./documents/legal-page";
import { testimonial } from "./documents/testimonial";
import { pageMeta } from "./documents/page-meta";

export const schemaTypes = [
  // Locale types
  localeString,
  localeText,
  localeBlockContent,
  // Object types
  localeFaq,
  localeSection,
  articleBlock,
  // Document types
  article,
  learnPillar,
  leagueHub,
  betTypeHub,
  legalPage,
  testimonial,
  pageMeta,
];
