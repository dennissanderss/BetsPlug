/**
 * Articles data source
 * ────────────────────────────────────────────────────────────
 * Static content for the public /articles archive and the
 * /articles/[slug] single-post template. Each article defines
 * its own SEO metadata (metaTitle + metaDescription), sport
 * category, hero gradient and long-form body content.
 *
 * Content is rendered by a single reusable template so every
 * post has an identical layout, typography and CTA banner.
 */

export type Sport = "football" | "nba" | "nfl" | "mlb" | "nhl";

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  sport: Sport;
  /** Author display name shown in byline */
  author: string;
  /** ISO date string */
  publishedAt: string;
  /**
   * Optional ISO date string for the last modification. When set,
   * it's emitted in the JSON-LD `dateModified` field and used by
   * the sitemap's `lastModified`. Defaults to `publishedAt`.
   */
  updatedAt?: string;
  /** Rough reading time in minutes */
  readingMinutes: number;
  /**
   * Hero "cover image" is a layered gradient so posts look
   * cohesive with the rest of the site without requiring any
   * remote image configuration. A large sport icon is overlaid
   * on top in the card/hero components.
   */
  coverGradient: string;
  coverPattern?: "dots" | "grid" | "diagonal";
  /**
   * Optional raster cover image (typically a .webp under
   * /public/articles/). When present, it is used for OpenGraph,
   * Twitter cards and the JSON-LD Article schema. The gradient
   * still renders as a fallback behind the image.
   */
  coverImage?: string;
  /** Optional alt text for the raster cover image */
  coverImageAlt?: string;
  /** Optional pull-quote to surface in the article header */
  tldr?: string;
  blocks: ArticleBlock[];
};

export const SPORTS: {
  id: Sport | "all";
  label: string;
}[] = [
  { id: "all", label: "All Articles" },
  { id: "football", label: "Football" },
  { id: "nba", label: "NBA" },
  { id: "nfl", label: "NFL" },
  { id: "mlb", label: "MLB" },
  { id: "nhl", label: "NHL" },
];

/* ── Articles ──────────────────────────────────────────────── */

export const articles: Article[] = [
  {
    slug: "ai-edge-matchday-research",
    title:
      "How to Find a Real Edge on Matchday: An AI Research Framework for Modern Bettors",
    excerpt:
      "Most bettors burn their bankroll on gut calls and recency bias. Here's the exact 5-step research framework our AI models use to isolate a repeatable edge on every matchday - across football, basketball and beyond.",
    metaTitle:
      "How to Find a Real Edge on Matchday - AI Research Framework | BetsPlug",
    metaDescription:
      "Learn the exact 5-step AI research framework BetsPlug uses to find a repeatable betting edge on every matchday. Elo, Poisson, XGBoost, live odds and disciplined bankroll - explained.",
    sport: "football",
    author: "The BetsPlug Team",
    publishedAt: "2026-04-09",
    readingMinutes: 6,
    coverGradient:
      "linear-gradient(135deg, #0b1220 0%, #0f2a1a 40%, #064e3b 100%)",
    coverPattern: "dots",
    tldr:
      "Winning bettors are just disciplined researchers. Follow this five-step framework every matchday and the edge finds you - not the other way around.",
    blocks: [
      {
        type: "paragraph",
        text: "Ask ten bettors how they picked their last bet and you'll get ten different answers - a hot team, a gut feeling, something they saw on Twitter, a friend's tip. The one thing almost none of them will say is \"I followed a written process.\" And that's exactly the gap a data-driven bettor can exploit. The bookmakers don't outsmart us because they have better models; they outsmart us because they are disciplined and we are not.",
      },
      {
        type: "paragraph",
        text: "At BetsPlug we built four AI models - Elo, Poisson, Logistic Regression and an XGBoost Ensemble - because the raw research work required to beat the closing line is genuinely exhausting to do by hand. But even with machines doing the heavy lifting, the humans who get the most out of our platform all share the same pre-match routine. This is that routine, written down, so you can steal it.",
      },
      {
        type: "heading",
        text: "Step 1 - Start with the market, not the match",
      },
      {
        type: "paragraph",
        text: "The opening line is the collective wisdom of thousands of sharp bettors. Before you form a single opinion, write down what the market thinks: the decimal odds, the implied probabilities, and the overround. If Manchester City is trading at 1.50, the market is telling you they win roughly 67% of the time. Your job is not to prove the market wrong - your job is to find the matches where you have a specific, defensible reason to disagree.",
      },
      {
        type: "paragraph",
        text: "We feed live odds into every one of our models as a prior. It anchors the analysis in reality and stops you from falling in love with a fairy-tale upset that the market has already priced in.",
      },
      {
        type: "heading",
        text: "Step 2 - Check Elo and form (but know their blind spots)",
      },
      {
        type: "paragraph",
        text: "Elo is the best single-number summary of a team's strength. Our Elo ratings update after every match, weight recent games more heavily, and factor in margin of victory. A 120-point Elo gap translates into a meaningful probability swing - not a decisive one, but enough to flag a potential value.",
      },
      {
        type: "paragraph",
        text: "The trap with Elo is that it can't see injuries, lineup rotation, or tactical tweaks. That's why we pair it with a rolling xG-based form window. If a team is outperforming its Elo because of unsustainable finishing luck, the model knows to be cautious. If they're underperforming because of early red cards, the model knows to be patient.",
      },
      {
        type: "heading",
        text: "Step 3 - Bring in a goal model (Poisson is your friend)",
      },
      {
        type: "paragraph",
        text: "Win/draw/lose markets are only half the picture. A proper Poisson model decomposes the match into home attack, away attack, home defence and away defence - four numbers that let you reason about totals, Asian handicaps, and BTTS markets without guessing. Most weekends our Poisson engine flags more edges in Over/Under 2.5 than in the 1X2 market, simply because totals are where bookmakers are least sharp.",
      },
      {
        type: "list",
        items: [
          "Is the expected goal total above or below the line by at least 0.25 goals? That's a small edge.",
          "Is one team's expected goals above the Asian line by 0.5+? That's a bigger one.",
          "Are both teams expected to score 1.0+ goals? BTTS becomes interesting.",
        ],
      },
      {
        type: "heading",
        text: "Step 4 - Let the Ensemble call the shots",
      },
      {
        type: "paragraph",
        text: "No single model should ever make a final decision. Our Ensemble stacks Elo, Poisson, Logistic and XGBoost on top of each other and lets them vote, weighted by each model's recent calibration. The result is a single probability per outcome that is almost always better calibrated than any individual model - we publish Brier scores on our public track record to prove it.",
      },
      {
        type: "quote",
        text: "If the Ensemble confidence is below 60%, you don't have a pick. You have an opinion. There's a difference.",
        cite: "BetsPlug research log",
      },
      {
        type: "heading",
        text: "Step 5 - Sanity-check with the eye test",
      },
      {
        type: "paragraph",
        text: "Finally - and this is the part most data bros skip - take two minutes to read the pre-match news. Is a key striker suspended? Did the manager rotate last week and is he rotating again? Is there a continental fixture three days later? Models are brilliant at pattern recognition and terrible at reading press conferences. Five minutes of human context saves dozens of bad bets per season.",
      },
      {
        type: "paragraph",
        text: "Once the eye test agrees with the Ensemble - only then do you place the bet. And even then, only at the stake your bankroll rules allow. Discipline is the moat. The models just make the moat wider.",
      },
      {
        type: "heading",
        text: "Putting it all together",
      },
      {
        type: "paragraph",
        text: "This framework is not a secret. It's not even original. What it is - is repeatable. If you follow it every single matchday, your long-run results will drift upward, slowly but relentlessly, just like the closing line drifts toward truth. That's the whole game.",
      },
      {
        type: "paragraph",
        text: "If you'd rather skip the manual work and let our AI do it for you, every BetsPlug subscription includes the full Ensemble output, live probability tracking, and a daily Pick of the Day - selected automatically by the same framework you just read. Start your free 7-day trial and see the edge in action.",
      },
    ],
  },
];

/* ── Helpers ───────────────────────────────────────────────── */

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getRelatedArticles(
  current: Article,
  limit = 3
): Article[] {
  const sameSport = articles.filter(
    (a) => a.slug !== current.slug && a.sport === current.sport
  );
  const rest = articles.filter(
    (a) => a.slug !== current.slug && a.sport !== current.sport
  );
  return [...sameSport, ...rest].slice(0, limit);
}

/**
 * Returns the chronologically adjacent articles for the given post.
 * Articles are sorted from newest to oldest, so:
 *   - prev = the OLDER article (further down the list)
 *   - next = the NEWER article (further up the list)
 * Either side can be undefined if the current article is at an edge.
 */
export function getAdjacentArticles(current: Article): {
  prev?: Article;
  next?: Article;
} {
  const sorted = [...articles].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
  const idx = sorted.findIndex((a) => a.slug === current.slug);
  if (idx === -1) return {};
  return {
    next: idx > 0 ? sorted[idx - 1] : undefined,
    prev: idx < sorted.length - 1 ? sorted[idx + 1] : undefined,
  };
}
