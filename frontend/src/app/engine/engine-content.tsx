"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Shield,
  Activity,
  BarChart3,
  Database,
  Target,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { HexBadge } from "@/components/noct/hex-badge";
import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import { api } from "@/lib/api";
import type { PickTierSlug, PricingTierData } from "@/types/api";
import { useLocalizedHref } from "@/i18n/locale-provider";

/**
 * Long-form transparency page. Single scroll with anchor links in the
 * sticky sub-nav at the top so users (and press) can deep-link to any
 * section.
 */

const SECTIONS = [
  { id: "how-it-works", label: "How it works", icon: Activity },
  { id: "per-tier", label: "Accuracy per tier", icon: Target },
  { id: "validation", label: "Walk-forward validation", icon: BarChart3 },
  { id: "data", label: "Data sources", icon: Database },
  { id: "disclaimers", label: "Disclaimers", icon: AlertTriangle },
];

// Order tiers high → low in the table
const TIER_ORDER: PickTierSlug[] = ["platinum", "gold", "silver", "free"];

export function EngineContent() {
  const loc = useLocalizedHref();

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["pricing-comparison-engine"],
    queryFn: () => api.getPricingComparison(),
    staleTime: 5 * 60_000,
  });

  // Index tier data by slug for easy lookup
  const tierMap = new Map<PickTierSlug, PricingTierData>();
  (tiers ?? []).forEach((t) => tierMap.set(t.pick_tier, t));

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-20 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="section-label mb-5 inline-flex items-center gap-2"
          >
            <Sparkles className="h-3 w-3" />
            Engine transparency
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
          >
            How we classify picks and{" "}
            <span className="gradient-text-green">measure accuracy.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            Every BetsPlug prediction is classified into one of four quality tiers
            based on the league and the model&rsquo;s confidence. Each tier has its
            own historical accuracy — measured on the same public evaluation set
            used in our track record.
          </motion.p>

          {/* Sub-nav anchors */}
          <nav
            aria-label="Engine sections"
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/5 hover:text-emerald-300"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ── SECTION: HOW IT WORKS ── */}
      <section id="how-it-works" className="scroll-mt-24 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={Activity}
            label="How it works"
            title="Ensemble of four independent models"
            subtitle="We combine Elo ratings, Logistic Regression, XGBoost and a Poisson goal-model. Weighted average, calibrated probabilities."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <ExplainCard
              icon={Activity}
              title="39 point-in-time features"
              body="Every prediction uses recent form (5/10 matches), venue-specific stats, head-to-head, season averages, Elo differential, rest days, and clean-sheet rate — all computed as of the match kickoff so there is zero future information."
            />
            <ExplainCard
              icon={BarChart3}
              title="Weighted ensemble"
              body="Logistic Regression (40%) and XGBoost (60%) form the main ensemble, with Elo as a sanity anchor. Probabilities are normalised so home + draw + away = 1.00."
            />
            <ExplainCard
              icon={Target}
              title="Tier classification at prediction time"
              body="A pick is Platinum if the match is in our top-5 leagues AND confidence ≥ 75%. Gold = top-10 + ≥ 70%. Silver = top-14 + ≥ 65%. Free = anything else with confidence ≥ 55%. Picks below 55% are not shown."
            />
            <ExplainCard
              icon={Shield}
              title="No post-hoc tuning"
              body="The model version that produced each historical pick is the same one live today. We don't backfill old picks with new models to make our trackrecord look better — every pick in our track record is the original one."
            />
          </div>
        </div>
      </section>

      {/* ── SECTION: PER-TIER ACCURACY ── */}
      <section id="per-tier" className="scroll-mt-24 py-12 md:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={Target}
            label="Accuracy per tier"
            title="Live numbers, updated as each match finishes"
            subtitle="Sourced from /api/pricing/comparison. Sample sizes and Wilson 95% lower bounds included — because a point estimate without a confidence interval is advertising, not science."
          />

          <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Accuracy
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:table-cell">
                    95% LB
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sample
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">
                    Conf ≥
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">
                    Leagues
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIER_ORDER.map((slug) => {
                  const t = tierMap.get(slug);
                  return (
                    <tr
                      key={slug}
                      className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <PickTierBadge
                          tier={slug}
                          size="sm"
                          showAccuracy={false}
                        />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-100">
                        {isLoading || !t
                          ? "…"
                          : `${t.accuracy_pct.toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400 hidden sm:table-cell">
                        {isLoading || !t
                          ? "…"
                          : `${t.wilson_ci_lower_pct.toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                        {isLoading || !t
                          ? "…"
                          : t.sample_size.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400 hidden md:table-cell">
                        {isLoading || !t
                          ? "…"
                          : `${(t.confidence_threshold * 100).toFixed(0)}%`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400 hidden md:table-cell">
                        {isLoading || !t
                          ? "…"
                          : t.leagues_count == null
                          ? "all"
                          : t.leagues_count.toString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            The accuracy column is the point estimate. The 95% lower bound (Wilson
            interval) tells you the worst-case accuracy consistent with the
            observed sample — an honest floor, not the headline.
          </p>
        </div>
      </section>

      {/* ── SECTION: WALK-FORWARD VALIDATION ── */}
      <section id="validation" className="scroll-mt-24 py-12 md:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={BarChart3}
            label="Walk-forward validation"
            title="Trained on yesterday, tested on tomorrow"
            subtitle="The most honest backtest we can run: the model never sees data from after the match it&rsquo;s predicting."
          />

          <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-300">
            <p>
              A common mistake in football modelling is training on the full
              2020–2026 dataset, then testing accuracy on the same years. That
              leaks information — the model has already &ldquo;seen&rdquo;
              future features like final league standings, season averages, and
              late-season form. The numbers look great. They&rsquo;re
              meaningless.
            </p>
            <p>
              We validate differently. The engine rolls through every match in
              chronological order. For a match on March 12 2024, the model is
              only trained on data available up to and including March 11. Form
              tables are truncated. Elo ratings are reconstructed to their
              March 11 state. Features are computed point-in-time.
            </p>
            <p>
              The current v8.1 walk-forward run covered{" "}
              <span className="font-semibold text-emerald-400">
                28,838 out-of-sample predictions
              </span>
              {" "}across four time-folds. Results directly match what the
              Per-tier table above shows — we use the same methodology in
              production.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION: DATA SOURCES ── */}
      <section id="data" className="scroll-mt-24 py-12 md:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={Database}
            label="Data sources"
            title="One licensed feed, no scraping"
            subtitle="API-Football Pro tier. 29 competitions, daily ingestion, auditable lineage."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ExplainCard
              icon={Database}
              title="Matches & results"
              body="Kickoff times, final scores, in-game events. Ingested hourly during match windows, nightly otherwise."
            />
            <ExplainCard
              icon={BarChart3}
              title="Team statistics"
              body="Match-level shots, possession, corners, cards. Season-level standings, goal differentials. All point-in-time snapshotted."
            />
            <ExplainCard
              icon={Target}
              title="Odds (read-only)"
              body="Pre-match 1X2 odds captured for retrospective analysis. We never place bets and never write to bookmakers — odds are context, not signal."
            />
          </div>
        </div>
      </section>

      {/* ── SECTION: DISCLAIMERS ── */}
      <section id="disclaimers" className="scroll-mt-24 py-12 md:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={AlertTriangle}
            label="Disclaimers"
            title="What this is, and what it isn't"
            subtitle=""
          />

          <div className="mt-8 space-y-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-6 text-sm text-slate-300">
            <p>
              <strong className="text-amber-300">Educational / simulation only.</strong>{" "}
              BetsPlug provides statistical analysis of historical sports data.
              All predictions are presented as simulations for educational
              purposes. Nothing on this site constitutes betting advice, financial
              advice, or a guarantee of future results.
            </p>
            <p>
              <strong className="text-amber-300">Past performance is not indicative of future results.</strong>{" "}
              Tier accuracy figures (85%+, 70%+, etc.) are historical backtest
              measurements. Sample sizes and confidence intervals are published
              above so you can verify the scope of each claim.
            </p>
            <p>
              <strong className="text-amber-300">No gambling licence. No affiliation with bookmakers.</strong>{" "}
              BetsPlug operates under an educational / analytical framework (no
              KSA licence required in the Netherlands). We are not affiliated
              with any bookmaker and do not facilitate bet placement.
            </p>
            <p>
              <strong className="text-amber-300">Responsible use.</strong>{" "}
              Sports betting involves financial risk. If you or someone you know
              struggles with gambling, please visit{" "}
              <Link
                href={loc("/responsible-gambling")}
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                our responsible-gambling page
              </Link>
              .
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href={loc("/pricing")}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-colors hover:border-emerald-400/60 hover:bg-emerald-400/20"
            >
              See our plans
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

/* ─── Small reusable blocks ─────────────────────────────────────── */

function SectionHeader({
  icon: Icon,
  label,
  title,
  subtitle,
}: {
  icon: typeof Activity;
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <HexBadge variant="green" size="md">
          <Icon className="h-5 w-5" />
        </HexBadge>
        <span className="section-label">{label}</span>
      </div>
      <h2 className="text-heading text-balance break-words text-2xl text-[#ededed] sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl text-sm text-[#a3a9b8]">{subtitle}</p>
      )}
    </div>
  );
}

function ExplainCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Activity;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center gap-2 text-emerald-300">
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}
