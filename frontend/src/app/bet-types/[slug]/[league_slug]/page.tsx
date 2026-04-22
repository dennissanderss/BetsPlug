import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
  Target,
  BookOpen,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { UnlockBanner } from "@/components/match-predictions/unlock-banner";
import { HexBadge } from "@/components/noct/hex-badge";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { translate } from "@/i18n/messages";
import { formatMsg } from "@/i18n/format";
import { localizePath } from "@/i18n/routes";
import { getLocalizedAlternates, getServerLocale } from "@/lib/seo-helpers";
import { getLeagueLogoPath } from "@/data/league-logos";
import { BET_TYPE_HUBS } from "@/data/bet-type-hubs";
import { COMBO_LEAGUE_SLUGS, LEAGUE_SCORING_PROFILE } from "@/data/bet-type-league-combos";
import { LEAGUE_CATALOG, getLeagueName } from "@/data/league-catalog";
import {
  buildCombo,
  getAllComboSlugs,
  type ComboLocale,
  type BetTypeLeagueCombo,
} from "@/data/bet-type-league-combos";

export const revalidate = 3600;

/**
 * Bet-type × League combo landing page.
 * URL: /bet-types/[slug]/[league_slug]
 *
 * Example: /bet-types/both-teams-to-score/premier-league
 *
 * Targets longtail queries that neither the bet-type hub nor the
 * league hub ranks for individually ("BTTS Premier League tips",
 * "Over 2.5 La Liga predictions", etc.). Content is programmatic
 * but per-combo unique via the LEAGUE_SCORING_PROFILE stats
 * injection in the skeleton generator.
 */

const SITE_URL = "https://betsplug.com";

type Params = { slug: string; league_slug: string };

/* ── Static params ────────────────────────────────────────── */

export async function generateStaticParams(): Promise<Params[]> {
  return getAllComboSlugs().map(({ betTypeSlug, leagueSlug }) => ({
    slug: betTypeSlug,
    league_slug: leagueSlug,
  }));
}

/* ── Helpers ──────────────────────────────────────────────── */

function readLocaleFromCookie(): ComboLocale {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  const uiLocale = isLocale(raw) ? raw : defaultLocale;
  // Combo content is EN + NL only; everything else falls back to EN.
  return uiLocale === "nl" ? "nl" : "en";
}

/* ── Metadata ─────────────────────────────────────────────── */

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, league_slug } = await props.params;
  const combo = buildCombo(slug, league_slug);
  if (!combo) {
    return {
      title: "Bet-type combo not found · BetsPlug",
      description:
        "The bet-type × league page you're looking for could not be found.",
    };
  }

  const locale = readLocaleFromCookie();
  const title = combo.metaTitle[locale];
  const description = combo.metaDescription[locale];
  const alternates = getLocalizedAlternates(
    `/bet-types/${slug}/${league_slug}`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/bet-types/${slug}/${league_slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ── JSON-LD builder ──────────────────────────────────────── */

function buildJsonLd(combo: BetTypeLeagueCombo, locale: ComboLocale) {
  const url = `${SITE_URL}/bet-types/${combo.betTypeSlug}/${combo.leagueSlug}`;
  const logoPath = getLeagueLogoPath(combo.leagueSlug);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: combo.metaTitle[locale],
        description: combo.metaDescription[locale],
        inLanguage: locale,
        dateModified: new Date().toISOString(),
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}#website`,
          name: "BetsPlug",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "BetsPlug", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Bet Types",
            item: `${SITE_URL}/bet-types`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: combo.name.betType[locale],
            item: `${SITE_URL}/bet-types/${combo.betTypeSlug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: combo.name.league[locale],
            item: url,
          },
        ],
      },
      {
        "@type": "SportsOrganization",
        "@id": `${url}#league`,
        name: combo.name.league.en,
        sport: "Soccer",
        ...(logoPath ? { logo: `${SITE_URL}${logoPath}` } : {}),
        url: `${SITE_URL}/match-predictions/${combo.leagueSlug}`,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: combo.faqs[locale].map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      },
    ],
  };
}

/* ── Page ─────────────────────────────────────────────────── */

export default async function BetTypeLeagueComboPage(props: {
  params: Promise<Params>;
}) {
  const { slug, league_slug } = await props.params;
  const combo = buildCombo(slug, league_slug);
  if (!combo) notFound();

  const locale = readLocaleFromCookie();
  // UI locale (all 8 locales) for URL building; `locale` above is
  // editorial only (EN + NL). Keeps href generation in the visitor's
  // actual locale so internal links don't cross-reference the EN
  // canonical path from e.g. a German user's page.
  const uiLocale = getServerLocale();
  const lhref = (canonical: string) => localizePath(canonical, uiLocale);
  const jsonLd = buildJsonLd(combo, locale);
  const leagueLogo = getLeagueLogoPath(league_slug);

  const betTypeName = combo.name.betType[locale];
  const leagueName = combo.name.league[locale];

  // Sibling leagues — same bet type, other COMBO_LEAGUE_SLUGS.
  const siblingLeagues = COMBO_LEAGUE_SLUGS.filter((s) => s !== league_slug)
    .slice(0, 8)
    .map((s) => {
      const entry = LEAGUE_CATALOG.find((l) => l.slug === s);
      return entry ? { slug: s, name: getLeagueName(entry, locale), logo: getLeagueLogoPath(s) } : null;
    })
    .filter(Boolean) as Array<{ slug: string; name: string; logo: string | null }>;

  // Sibling markets — same league, other bet types.
  const siblingMarkets = BET_TYPE_HUBS.filter((h) => h.slug !== slug).map((h) => ({
    slug: h.slug,
    name: h.name[locale],
    shortCode: h.shortCode,
  }));

  const profile = LEAGUE_SCORING_PROFILE[league_slug];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-[#ededed]">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteNav />

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <HeroMediaBgLite />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#6b7280]"
          >
            <Link href={lhref("/")} className="transition-colors hover:text-[#ededed]">
              {translate(locale, "betTypeCombo.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={lhref("/bet-types")} className="transition-colors hover:text-[#ededed]">
              {translate(locale, "betTypeCombo.breadcrumbBetTypes")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={lhref(`/bet-types/${slug}`)}
              className="transition-colors hover:text-[#ededed]"
            >
              {betTypeName}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#a3a9b8]">{leagueName}</span>
          </nav>

          {/* Title block */}
          <div className="flex flex-wrap items-center gap-4">
            {leagueLogo ? (
              <div
                className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl p-2 shrink-0"
                style={{
                  background: "hsl(var(--glass-1))",
                  border: "1px solid hsl(0 0% 100% / 0.06)",
                }}
              >
                <Image
                  src={leagueLogo}
                  alt={`${combo.name.league.en} logo`}
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <HexBadge variant="green" size="md" noGlow>
                <Target className="h-5 w-5" />
              </HexBadge>
            )}
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded border border-[#4ade80]/20 bg-[#4ade80]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4ade80]">
                  {combo.shortCode}
                </span>
                <span className="section-label">
                  <Sparkles className="h-3 w-3" />
                  {translate(locale, "betTypeCombo.aiPredictions")}
                </span>
              </div>
              <h1 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {betTypeName}{" "}
                <span className="gradient-text-green">
                  {leagueName}
                </span>{" "}
                {translate(locale, "betTypeCombo.predictionsSuffix")}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-[#a3a9b8]">
                {combo.tagline[locale]}
              </p>
            </div>
          </div>

          {/* Quick stat bar */}
          {profile && (
            <div
              className="mt-8 grid gap-3 rounded-xl border p-4 sm:grid-cols-3"
              style={{
                borderColor: "hsl(0 0% 100% / 0.06)",
                background: "hsl(230 16% 10% / 0.4)",
              }}
            >
              <StatCell
                label={translate(locale, "betTypeCombo.statAvgGoals")}
                value={profile.avgGoalsPerGame.toFixed(2).replace(".", translate(locale, "betTypeCombo.decimalSep"))}
              />
              <StatCell
                label={translate(locale, "betTypeCombo.statBtts")}
                value={`${profile.bttsYesPct}%`}
              />
              <StatCell
                label={translate(locale, "betTypeCombo.statOver25")}
                value={`${profile.over25Pct}%`}
              />
            </div>
          )}
        </div>
      </section>

      {/* ═══ Body — intro + stats + strategy ═══ */}
      <section className="relative mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <SectionBlock
          icon={<BookOpen className="h-4 w-4" />}
          title={formatMsg(translate(locale, "betTypeCombo.howWeRead"), { leagueName, betTypeName })}
          body={combo.intro[locale]}
        />

        <SectionBlock
          icon={<Target className="h-4 w-4" />}
          title={translate(locale, "betTypeCombo.theNumbers")}
          body={combo.statsBlock[locale]}
        />

        <SectionBlock
          icon={<Lightbulb className="h-4 w-4" />}
          title={translate(locale, "betTypeCombo.valueHides")}
          body={combo.angle[locale]}
        />

        {/* Dual CTA */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href={lhref(`/match-predictions/${league_slug}`)}
            className="btn-primary inline-flex items-center gap-2"
          >
            {formatMsg(translate(locale, "betTypeCombo.seeAllPicks"), { leagueName })}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={lhref(`/bet-types/${slug}`)}
            className="btn-ghost inline-flex items-center gap-2"
          >
            {formatMsg(translate(locale, "betTypeCombo.moreOn"), { betTypeName })}
          </Link>
        </div>

        {/* Unlock banner (shared CTA) */}
        <div className="mt-12">
          <UnlockBanner />
        </div>

        {/* ═══ FAQ ═══ */}
        <section className="mt-16">
          <span className="section-label mb-4">
            <HelpCircle className="h-3 w-3" />
            FAQ
          </span>
          <h2 className="text-heading mb-6 text-2xl text-[#ededed] sm:text-3xl">
            {leagueName} {betTypeName}{" "}
            <span className="gradient-text-green">FAQ</span>
          </h2>
          <div className="space-y-3">
            {combo.faqs[locale].map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border p-5 transition-colors hover:border-white/[0.12]"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(230 16% 10% / 0.4)",
                }}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold text-[#ededed] [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#6b7280] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ═══ Sibling combos: same market, other leagues ═══ */}
        <section className="mt-16">
          <span className="section-label mb-4">
            <Sparkles className="h-3 w-3" />
            {translate(locale, "betTypeCombo.sameMarketHeader")}
          </span>
          <h2 className="text-heading mb-6 text-2xl text-[#ededed] sm:text-3xl">
            {betTypeName}{" "}
            <span className="gradient-text-green">
              {translate(locale, "betTypeCombo.byLeague")}
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {siblingLeagues.map((l) => (
              <Link
                key={l.slug}
                href={lhref(`/bet-types/${slug}/${l.slug}`)}
                className="group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-[#4ade80]/40"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(230 16% 10% / 0.4)",
                }}
              >
                {l.logo ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.03] p-1">
                    <Image src={l.logo} alt="" width={32} height={32} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-white/[0.03]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                    {l.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#6b7280]">
                    {betTypeName}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#6b7280] transition-all group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ Sibling combos: same league, other markets ═══ */}
        <section className="mt-16">
          <span className="section-label mb-4">
            <Sparkles className="h-3 w-3" />
            {translate(locale, "betTypeCombo.otherMarketsHeader")}
          </span>
          <h2 className="text-heading mb-6 text-2xl text-[#ededed] sm:text-3xl">
            {leagueName}{" "}
            <span className="gradient-text-green">
              {translate(locale, "betTypeCombo.marketBreakdowns")}
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {siblingMarkets.map((m) => (
              <Link
                key={m.slug}
                href={lhref(`/bet-types/${m.slug}/${league_slug}`)}
                className="group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-[#4ade80]/40"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(230 16% 10% / 0.4)",
                }}
              >
                <span className="inline-flex h-10 min-w-[48px] items-center justify-center rounded-lg border border-[#4ade80]/20 bg-[#4ade80]/5 px-2 text-[11px] font-semibold tracking-wider text-[#4ade80]">
                  {m.shortCode}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                    {m.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#6b7280]">
                    {leagueName}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#6b7280] transition-all group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
              </Link>
            ))}
          </div>
        </section>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

/* ── Small components ─────────────────────────────────────── */

function SectionBlock({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <HexBadge variant="green" size="sm" noGlow>
          {icon}
        </HexBadge>
        <h2 className="text-heading text-lg text-[#ededed] sm:text-xl">
          {title}
        </h2>
      </div>
      <p className="text-[15px] leading-relaxed text-[#cbd3e0]">{body}</p>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
        {label}
      </div>
      <div className="mt-1 text-stat text-xl text-[#4ade80]">{value}</div>
    </div>
  );
}

/* Lite hero background — just an ambient glow, no image chrome. */
function HeroMediaBgLite() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background:
          "radial-gradient(closest-side, hsl(var(--accent-green) / 0.12), transparent 70%)",
      }}
    />
  );
}
