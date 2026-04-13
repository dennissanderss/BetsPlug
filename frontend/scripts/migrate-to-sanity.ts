/**
 * One-time migration script: hardcoded data → Sanity
 * Run: npx tsx scripts/migrate-to-sanity.ts
 */
import "dotenv/config";
import { createClient } from "@sanity/client";

// ── Sanity write client ───────────────────────────────────
const client = createClient({
  projectId: "nk7ioy85",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

if (!process.env.SANITY_API_TOKEN) {
  console.error("❌ SANITY_API_TOKEN not set in .env.local");
  process.exit(1);
}

// ── Import source data ────────────────────────────────────
import { articles } from "../src/data/articles";
import { LEARN_PILLARS } from "../src/data/learn-pillars";
import { LEAGUE_HUBS } from "../src/data/league-hubs";
import { BET_TYPE_HUBS } from "../src/data/bet-type-hubs";
import { PAGE_META } from "../src/data/page-meta";

// ── Testimonials (not exported, define inline) ────────────
const testimonials = [
  {
    name: "Lucas van Dijk",
    role: "Semi-pro Bettor",
    text: "BetsPlug completely changed how I approach football predictions. The Elo and Poisson models give me an edge I never had before. I've tripled my hit-rate in three months.",
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Sophie Hendriks",
    role: "Data Analyst",
    text: "The transparency of their track record is what sold me. Every prediction is logged and verifiable - no cherry-picking like other tipster sites. I finally trust the numbers.",
    imageUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Mark Jansen",
    role: "Football Trader",
    text: "As a data nerd, I love that BetsPlug shows the math behind every pick. Confidence scores, Elo deltas, edge percentages - it's like having a quant desk in my pocket.",
    imageUrl: "https://randomuser.me/api/portraits/men/52.jpg",
  },
  {
    name: "Emma Dekker",
    role: "Football Analyst",
    text: "I was skeptical at first, but the Pick of the Day feature alone paid for my subscription ten times over. The AI picks consistently outperform my own gut calls.",
    imageUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Daniel Kowalski",
    role: "Tipster & Content Creator",
    text: "Running my own tipping community used to take hours of research. BetsPlug gives me data-backed insights in seconds. My subscribers have never been happier.",
    imageUrl: "https://randomuser.me/api/portraits/men/23.jpg",
  },
  {
    name: "Isabella Rossi",
    role: "Live Bettor",
    text: "The live probabilities update during matches is a game-changer. I can spot value shifts in real-time and make informed in-play decisions. Nothing else comes close.",
    imageUrl: "https://randomuser.me/api/portraits/women/17.jpg",
  },
  {
    name: "Ahmed Malik",
    role: "Quant Bettor",
    text: "Strategy backtesting saved me from a losing system I was convinced worked. Turns out my edge was just variance. Now I only deploy strategies that pass backtest.",
    imageUrl: "https://randomuser.me/api/portraits/men/78.jpg",
  },
  {
    name: "Chloe Dubois",
    role: "Subscriber",
    text: "The Telegram tips are pure gold. Clean, concise, and the hit-rate speaks for itself. Best decision I made this season was signing up for BetsPlug.",
    imageUrl: "https://randomuser.me/api/portraits/women/29.jpg",
  },
  {
    name: "Thomas Bergström",
    role: "Professional Handicapper",
    text: "Finally a predictions platform that treats football betting like the science it should be. Every claim is backed by data, and the results are on the board for everyone to see.",
    imageUrl: "https://randomuser.me/api/portraits/men/41.jpg",
  },
];

// ── Helpers ────────────────────────────────────────────────

/** Upload an image from URL to Sanity and return the asset reference. */
async function uploadImageFromUrl(url: string): Promise<{ _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const buffer = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename: url.split("/").pop() ?? "image.jpg",
    });
    return {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
    };
  } catch (e) {
    console.warn(`  ⚠ Failed to upload image: ${url}`);
    return undefined;
  }
}

/** Convert Record<locale, string> to Sanity localeString object. */
function toLocale(rec: Record<string, string>): Record<string, string> & { _type: string } {
  return { _type: "localeString", ...rec };
}
function toLocaleText(rec: Record<string, string>): Record<string, string> & { _type: string } {
  return { _type: "localeText", ...rec };
}

// ── Migrate Articles ──────────────────────────────────────
async function migrateArticles() {
  console.log("\n📝 Migrating articles...");
  for (const a of articles) {
    const doc = {
      _id: `article-${a.slug}`,
      _type: "article",
      title: a.title,
      slug: { _type: "slug", current: a.slug },
      excerpt: a.excerpt,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      sport: a.sport,
      author: a.author,
      publishedAt: a.publishedAt,
      updatedAt: a.updatedAt ?? undefined,
      readingMinutes: a.readingMinutes,
      coverGradient: a.coverGradient,
      coverPattern: a.coverPattern ?? undefined,
      coverImageAlt: a.coverImageAlt ?? undefined,
      tldr: a.tldr ?? undefined,
      blocks: a.blocks.map((b, i) => ({
        _key: `block-${i}`,
        _type: "articleBlock",
        blockType: b.type,
        text: "text" in b ? b.text : undefined,
        cite: b.type === "quote" && "cite" in b ? b.cite : undefined,
        items: b.type === "list" ? b.items : undefined,
      })),
    };
    await client.createOrReplace(doc);
    console.log(`  ✅ ${a.title}`);
  }
}

// ── Migrate Learn Pillars ─────────────────────────────────
async function migrateLearnPillars() {
  console.log("\n📚 Migrating learn pillars...");

  // Pass 1: create all pillars WITHOUT related refs
  for (const p of LEARN_PILLARS) {
    const doc = {
      _id: `learnPillar-${p.slug}`,
      _type: "learnPillar",
      title: { _type: "localeString", en: p.title.en, nl: p.title.nl },
      slug: { _type: "slug", current: p.slug },
      tagline: { _type: "localeString", en: p.tagline.en, nl: p.tagline.nl },
      metaTitle: { _type: "localeString", en: p.metaTitle.en, nl: p.metaTitle.nl },
      metaDescription: { _type: "localeText", en: p.metaDescription.en, nl: p.metaDescription.nl },
      intro: { _type: "localeText", en: p.intro.en, nl: p.intro.nl },
      sections: p.sections.map((s, i) => ({
        _key: `section-${i}`,
        _type: "localeSection",
        heading: { _type: "localeString", en: s.heading.en, nl: s.heading.nl },
        body: {
          _type: "localeText",
          en: s.body.en.join("\n\n"),
          nl: s.body.nl.join("\n\n"),
        },
      })),
      faqs: (p.faqs.en ?? []).map((faq, i) => ({
        _key: `faq-${i}`,
        _type: "localeFaq",
        question: {
          _type: "localeString",
          en: faq.q,
          nl: p.faqs.nl?.[i]?.q ?? faq.q,
        },
        answer: {
          _type: "localeText",
          en: faq.a,
          nl: p.faqs.nl?.[i]?.a ?? faq.a,
        },
      })),
    };
    await client.createOrReplace(doc);
    console.log(`  ✅ ${p.title.en}`);
  }

  // Pass 2: patch related references (now all pillars exist)
  for (const p of LEARN_PILLARS) {
    if (p.related.length === 0) continue;
    await client
      .patch(`learnPillar-${p.slug}`)
      .set({
        related: p.related.map((slug) => ({
          _key: `rel-${slug}`,
          _type: "reference",
          _ref: `learnPillar-${slug}`,
        })),
      })
      .commit();
    console.log(`  🔗 Linked ${p.title.en} → ${p.related.join(", ")}`);
  }
}

// ── Migrate League Hubs ───────────────────────────────────
async function migrateLeagueHubs() {
  console.log("\n⚽ Migrating league hubs...");
  for (const h of LEAGUE_HUBS) {
    const doc = {
      _id: `leagueHub-${h.slug}`,
      _type: "leagueHub",
      name: { _type: "localeString", en: h.name.en, nl: h.name.nl },
      slug: { _type: "slug", current: h.slug },
      sportSlug: h.sportSlug,
      countryCode: h.countryCode,
      countryFlag: h.countryFlag,
      country: { _type: "localeString", en: h.country.en, nl: h.country.nl },
      tagline: { _type: "localeString", en: h.tagline.en, nl: h.tagline.nl },
      intro: { _type: "localeText", en: h.intro.en, nl: h.intro.nl },
      metaTitle: { _type: "localeString", en: h.metaTitle.en, nl: h.metaTitle.nl },
      metaDescription: { _type: "localeText", en: h.metaDescription.en, nl: h.metaDescription.nl },
      faqs: (h.faqs.en ?? []).map((faq, i) => ({
        _key: `faq-${i}`,
        _type: "localeFaq",
        question: {
          _type: "localeString",
          en: faq.q,
          nl: h.faqs.nl?.[i]?.q ?? faq.q,
        },
        answer: {
          _type: "localeText",
          en: faq.a,
          nl: h.faqs.nl?.[i]?.a ?? faq.a,
        },
      })),
    };
    await client.createOrReplace(doc);
    console.log(`  ✅ ${h.name.en}`);
  }
}

// ── Migrate Bet Type Hubs ─────────────────────────────────
async function migrateBetTypeHubs() {
  console.log("\n🎯 Migrating bet type hubs...");
  for (const b of BET_TYPE_HUBS) {
    const doc = {
      _id: `betTypeHub-${b.slug}`,
      _type: "betTypeHub",
      name: { _type: "localeString", en: b.name.en, nl: b.name.nl },
      slug: { _type: "slug", current: b.slug },
      shortCode: b.shortCode,
      tagline: { _type: "localeString", en: b.tagline.en, nl: b.tagline.nl },
      explainer: { _type: "localeText", en: b.explainer.en, nl: b.explainer.nl },
      strategy: { _type: "localeText", en: b.strategy.en, nl: b.strategy.nl },
      matchesHeading: { _type: "localeString", en: b.matchesHeading.en, nl: b.matchesHeading.nl },
      matchesSub: { _type: "localeText", en: b.matchesSub.en, nl: b.matchesSub.nl },
      metaTitle: { _type: "localeString", en: b.metaTitle.en, nl: b.metaTitle.nl },
      metaDescription: { _type: "localeText", en: b.metaDescription.en, nl: b.metaDescription.nl },
      faqs: (b.faqs.en ?? []).map((faq, i) => ({
        _key: `faq-${i}`,
        _type: "localeFaq",
        question: {
          _type: "localeString",
          en: faq.q,
          nl: b.faqs.nl?.[i]?.q ?? faq.q,
        },
        answer: {
          _type: "localeText",
          en: faq.a,
          nl: b.faqs.nl?.[i]?.a ?? faq.a,
        },
      })),
    };
    await client.createOrReplace(doc);
    console.log(`  ✅ ${b.name.en}`);
  }
}

// ── Migrate Testimonials ──────────────────────────────────
async function migrateTestimonials() {
  console.log("\n💬 Migrating testimonials...");
  for (const t of testimonials) {
    const image = await uploadImageFromUrl(t.imageUrl);
    const doc: Record<string, unknown> = {
      _id: `testimonial-${t.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
      _type: "testimonial",
      name: t.name,
      role: t.role,
      text: t.text,
    };
    if (image) doc.image = image;
    await client.createOrReplace(doc);
    console.log(`  ✅ ${t.name}`);
  }
}

// ── Migrate Page Meta ─────────────────────────────────────
async function migratePageMeta() {
  console.log("\n🔍 Migrating page SEO metadata...");
  const locales = ["en", "nl", "de", "fr", "es", "it", "sw", "id"] as const;

  for (const [pageKey, localeMap] of Object.entries(PAGE_META)) {
    const title: Record<string, string> = { _type: "localeString" };
    const description: Record<string, string> = { _type: "localeText" };
    const ogTitle: Record<string, string> = { _type: "localeString" };
    const ogDescription: Record<string, string> = { _type: "localeText" };

    let hasOgTitle = false;
    let hasOgDescription = false;

    for (const loc of locales) {
      const m = localeMap[loc];
      if (!m) continue;
      title[loc] = m.title;
      description[loc] = m.description;
      if (m.ogTitle) { ogTitle[loc] = m.ogTitle; hasOgTitle = true; }
      if (m.ogDescription) { ogDescription[loc] = m.ogDescription; hasOgDescription = true; }
    }

    const safeId = pageKey === "/" ? "home" : pageKey.replace(/^\//, "").replace(/\//g, "-");
    const doc: Record<string, unknown> = {
      _id: `pageMeta-${safeId}`,
      _type: "pageMeta",
      pageKey,
      title,
      description,
    };
    if (hasOgTitle) doc.ogTitle = ogTitle;
    if (hasOgDescription) doc.ogDescription = ogDescription;

    await client.createOrReplace(doc);
    console.log(`  ✅ ${pageKey}`);
  }
}

// ── Migrate Legal Pages (metadata only) ───────────────────
async function migrateLegalPages() {
  console.log("\n⚖️ Migrating legal page shells...");
  const pages = [
    { pageType: "terms", title: "Terms of Service", intro: "Last updated April 9, 2026. By using BetsPlug you agree to these Terms.", lastUpdated: "2026-04-09" },
    { pageType: "privacy", title: "Privacy Policy", intro: "Last updated April 9, 2026. This policy explains how BetsPlug collects, uses and protects your data.", lastUpdated: "2026-04-09" },
    { pageType: "cookies", title: "Cookie Policy", intro: "Last updated April 9, 2026. This policy explains how BetsPlug uses cookies and similar technologies.", lastUpdated: "2026-04-09" },
  ];
  for (const p of pages) {
    const doc = {
      _id: `legalPage-${p.pageType}`,
      _type: "legalPage",
      pageType: p.pageType,
      title: p.title,
      intro: p.intro,
      lastUpdated: p.lastUpdated,
      // body content must be entered manually via Studio
    };
    await client.createOrReplace(doc);
    console.log(`  ✅ ${p.title} (body content → fill in Studio)`);
  }
}

// ── Run all ───────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting Sanity migration...\n");
  console.log(`   Project: nk7ioy85`);
  console.log(`   Dataset: production`);

  await migrateArticles();
  await migrateLearnPillars();
  await migrateLeagueHubs();
  await migrateBetTypeHubs();
  await migrateTestimonials();
  await migratePageMeta();
  await migrateLegalPages();

  console.log("\n✅ Migration complete! Open /studio to verify.");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
