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
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * Long-form transparency page. Single scroll with anchor links in the
 * sticky sub-nav at the top so users (and press) can deep-link to any
 * section. All copy is i18n'd (EN + NL) via `engine.*` keys.
 */

const SECTION_KEYS = [
  { id: "how-it-works", key: "engine.nav.howItWorks", icon: Activity },
  { id: "per-tier", key: "engine.nav.perTier", icon: Target },
  { id: "validation", key: "engine.nav.validation", icon: BarChart3 },
  { id: "data", key: "engine.nav.data", icon: Database },
  { id: "disclaimers", key: "engine.nav.disclaimers", icon: AlertTriangle },
] as const;

// Order tiers high → low in the table
const TIER_ORDER: PickTierSlug[] = ["platinum", "gold", "silver", "free"];

export function EngineContent() {
  const loc = useLocalizedHref();
  const { t } = useTranslations();

  const { data: tiers, isLoading, isError } = useQuery({
    queryKey: ["pricing-comparison-engine"],
    queryFn: () => api.getPricingComparison(),
    staleTime: 5 * 60_000,
    retry: 1,
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
            {t("engine.hero.label" as any)}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
          >
            {t("engine.hero.titleA" as any)}{" "}
            <span className="gradient-text-green">
              {t("engine.hero.titleB" as any)}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            {t("engine.hero.subtitle" as any)}
          </motion.p>

          {/* Sub-nav anchors */}
          <nav
            aria-label="Engine sections"
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {SECTION_KEYS.map(({ id, key, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/5 hover:text-emerald-300"
              >
                <Icon className="h-3.5 w-3.5" />
                {t(key as any)}
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
            label={t("engine.how.label" as any)}
            title={t("engine.how.title" as any)}
            subtitle={t("engine.how.subtitle" as any)}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <ExplainCard
              icon={Activity}
              title={t("engine.how.features.title" as any)}
              body={t("engine.how.features.body" as any)}
            />
            <ExplainCard
              icon={BarChart3}
              title={t("engine.how.ensemble.title" as any)}
              body={t("engine.how.ensemble.body" as any)}
            />
            <ExplainCard
              icon={Target}
              title={t("engine.how.classification.title" as any)}
              body={t("engine.how.classification.body" as any)}
            />
            <ExplainCard
              icon={Shield}
              title={t("engine.how.noTuning.title" as any)}
              body={t("engine.how.noTuning.body" as any)}
            />
          </div>
        </div>
      </section>

      {/* ── SECTION: PER-TIER ACCURACY ── */}
      <section id="per-tier" className="scroll-mt-24 py-12 md:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={Target}
            label={t("engine.perTier.label" as any)}
            title={t("engine.perTier.title" as any)}
            subtitle={t("engine.perTier.subtitle" as any)}
          />

          {isError && (
            <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-4 text-sm text-amber-200">
              {t("engine.perTier.errorBannerPrefix" as any)}{" "}
              <a href="/track-record" className="underline">{t("engine.perTier.errorBannerLink" as any)}</a>{" "}
              {t("engine.perTier.errorBannerSuffix" as any)}
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t("engine.perTier.col.tier" as any)}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t("engine.perTier.col.accuracy" as any)}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:table-cell">
                    {t("engine.perTier.col.wilson" as any)}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t("engine.perTier.col.sample" as any)}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">
                    {t("engine.perTier.col.conf" as any)}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">
                    {t("engine.perTier.col.leagues" as any)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIER_ORDER.map((slug) => {
                  const tier = tierMap.get(slug);
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
                        {isLoading || !tier
                          ? "…"
                          : `${tier.accuracy_pct.toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400 hidden sm:table-cell">
                        {isLoading || !tier
                          ? "…"
                          : `${tier.wilson_ci_lower_pct.toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                        {isLoading || !tier
                          ? "…"
                          : tier.sample_size.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400 hidden md:table-cell">
                        {isLoading || !tier
                          ? "…"
                          : `${(tier.confidence_threshold * 100).toFixed(0)}%`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400 hidden md:table-cell">
                        {isLoading || !tier
                          ? "…"
                          : tier.leagues_count == null
                          ? t("engine.perTier.leaguesAll" as any)
                          : tier.leagues_count.toString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {t("engine.perTier.footer" as any)}
          </p>
        </div>
      </section>

      {/* ── SECTION: WALK-FORWARD VALIDATION ── */}
      <section id="validation" className="scroll-mt-24 py-12 md:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={BarChart3}
            label={t("engine.val.label" as any)}
            title={t("engine.val.title" as any)}
            subtitle={t("engine.val.subtitle" as any)}
          />

          <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-300">
            <p>{t("engine.val.p1" as any)}</p>
            <p>{t("engine.val.p2" as any)}</p>
            <p>
              {t("engine.val.p3A" as any)}{" "}
              <span className="font-semibold text-emerald-400">
                {t("engine.val.p3B" as any)}
              </span>
              {" "}
              {t("engine.val.p3C" as any)}
            </p>
          </div>

          {/* Integrity block — distinguishes model validation from live measurement */}
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                {t("engine.val.modelHeader" as any)}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#ededed]">
                {t("engine.val.modelTitle" as any)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {t("engine.val.modelBody" as any)}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-400/20 bg-blue-400/[0.04] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                {t("engine.val.liveHeader" as any)}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#ededed]">
                {t("engine.val.liveTitle" as any)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {t("engine.val.liveBody" as any)}
              </p>
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
            {t("engine.val.integrityDisclaimer" as any)}
          </p>
        </div>
      </section>

      {/* ── SECTION: DATA SOURCES ── */}
      <section id="data" className="scroll-mt-24 py-12 md:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={Database}
            label={t("engine.data.label" as any)}
            title={t("engine.data.title" as any)}
            subtitle={t("engine.data.subtitle" as any)}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ExplainCard
              icon={Database}
              title={t("engine.data.matches.title" as any)}
              body={t("engine.data.matches.body" as any)}
            />
            <ExplainCard
              icon={BarChart3}
              title={t("engine.data.teams.title" as any)}
              body={t("engine.data.teams.body" as any)}
            />
            <ExplainCard
              icon={Target}
              title={t("engine.data.odds.title" as any)}
              body={t("engine.data.odds.body" as any)}
            />
          </div>
        </div>
      </section>

      {/* ── SECTION: DISCLAIMERS ── */}
      <section id="disclaimers" className="scroll-mt-24 py-12 md:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            icon={AlertTriangle}
            label={t("engine.disclaimers.label" as any)}
            title={t("engine.disclaimers.title" as any)}
            subtitle=""
          />

          <div className="mt-8 space-y-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-6 text-sm text-slate-300">
            <p>
              <strong className="text-amber-300">
                {t("engine.disclaimers.edu.strong" as any)}
              </strong>{" "}
              {t("engine.disclaimers.edu.body" as any)}
            </p>
            <p>
              <strong className="text-amber-300">
                {t("engine.disclaimers.past.strong" as any)}
              </strong>{" "}
              {t("engine.disclaimers.past.body" as any)}
            </p>
            <p>
              <strong className="text-amber-300">
                {t("engine.disclaimers.noLicence.strong" as any)}
              </strong>{" "}
              {t("engine.disclaimers.noLicence.body" as any)}
            </p>
            <p>
              <strong className="text-amber-300">
                {t("engine.disclaimers.responsible.strong" as any)}
              </strong>{" "}
              {t("engine.disclaimers.responsible.body" as any)}{" "}
              <Link
                href={loc("/responsible-gambling")}
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                {t("engine.disclaimers.responsible.link" as any)}
              </Link>
              .
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href={loc("/pricing")}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-colors hover:border-emerald-400/60 hover:bg-emerald-400/20"
            >
              {t("engine.seePlans" as any)}
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
