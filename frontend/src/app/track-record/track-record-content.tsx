"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  ChevronRight,
  Activity,
  Database,
  Filter,
  Sliders,
  Layers,
  Target,
  CheckCircle2,
  ShieldCheck,
  LineChart,
  Eye,
  Lock,
  TrendingUp,
  Trophy,
  Percent,
  Hash,
  Gauge,
  Quote,
  Download,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { TierEmblem } from "@/components/noct/tier-emblem";
import { TIER_THEME, type TierKey } from "@/components/noct/tier-theme";
import { Pill } from "@/components/noct/pill";
import { usePotdNumbers } from "@/hooks/use-potd-numbers";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { BotdTrackRecordSection } from "@/components/ui/botd-track-record-section";
import { LockedLivePlaceholder } from "@/components/ui/locked-live-placeholder";

/* ── Live API data hook ─────────────────────────────────── */
interface LiveStats {
  totalPredictions: number | null;
  accuracy: number | null;
  brierScore: number | null;
  botdTotal: number | null;
  botdAccuracy: number | null;
}

type PublicTier = "all" | "free" | "silver" | "gold" | "platinum";

function useLiveTrackRecordStats(pickTier: PublicTier = "all"): LiveStats {
  const [stats, setStats] = useState<LiveStats>({
    totalPredictions: null,
    accuracy: null,
    brierScore: null,
    botdTotal: null,
    botdAccuracy: null,
  });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const tierQs = pickTier !== "all" ? `?pick_tier=${pickTier}` : "";

    // BOTD trackrecord is always the raw BOTD stream, not tier-scoped
    // (BOTD itself is a Gold+ feature). The summary call, in contrast,
    // respects the ?pick_tier= public filter so each tab reshapes KPIs.
    //
    // The BOTD KPI now pulls /bet-of-the-day/model-validation (same
    // source as the section 3 card below) so the hero accuracy figure
    // never disagrees with the detailed section. Previously the top
    // card used /bet-of-the-day/track-record which returns zero rows
    // when only future live picks exist, producing a confusing "0%
    // accuracy" tile right above a section claiming 58.6%.
    Promise.allSettled([
      fetch(`${API}/trackrecord/summary${tierQs}`).then((r) => r.json()),
      fetch(`${API}/bet-of-the-day/model-validation?limit=1`).then((r) => r.json()),
    ]).then(([summaryResult, botdResult]) => {
      const next: LiveStats = {
        totalPredictions: null,
        accuracy: null,
        brierScore: null,
        botdTotal: null,
        botdAccuracy: null,
      };
      if (summaryResult.status === "fulfilled" && summaryResult.value) {
        const s = summaryResult.value;
        next.totalPredictions = s.total_predictions ?? null;
        next.accuracy = s.accuracy ?? null;
        next.brierScore = s.brier_score ?? s.avg_brier_score ?? null;
      }
      if (botdResult.status === "fulfilled" && botdResult.value) {
        const summary = botdResult.value?.summary ?? {};
        next.botdTotal = summary.total_picks ?? null;
        // accuracy_pct is a percentage (0-100); the tile expects a
        // fraction (0-1) so it can multiply by 100 itself.
        next.botdAccuracy =
          typeof summary.accuracy_pct === "number"
            ? summary.accuracy_pct / 100
            : null;
      }
      setStats(next);
    });
  }, [pickTier]);

  return stats;
}

// Tier metadata for the public tabs. The dot colour and active
// border/background are derived from TIER_THEME so Silver=silver,
// Gold=gold, Platinum=diamond-blue — no gold-but-blue / platinum-
// but-green mismatches.
//
// The "All tiers" and "Free · 45%+" tabs were deliberately removed:
// on the public marketing surface they return the full-sample
// accuracy (60.1%), which reads as "Free subscribers get a weak
// product" even though the number simply reflects the lowest
// confidence floor. The three remaining tiers (60% / 70% / 80%+)
// are the ones the paid product actually promises, so they are
// the only numbers worth advertising here. The full dataset
// remains downloadable via the per-tier CSV export.
const PUBLIC_TIER_TABS: {
  key: PublicTier;
  label: string;
  /** Hex colour for the leading dot. */
  dotHex: string;
  /** Active-state ring + tint; both derived from the tier hex. */
  ringHex: string;
  tintHex: string;
  textHex: string;
}[] = [
  {
    key: "silver",
    label: "Silver · 60%+",
    dotHex: TIER_THEME.silver.colorHex,
    ringHex: TIER_THEME.silver.ringHex,
    tintHex: TIER_THEME.silver.bgTintHex,
    textHex: TIER_THEME.silver.highlightHex,
  },
  {
    key: "gold",
    label: "Gold · 70%+",
    dotHex: TIER_THEME.gold.colorHex,
    ringHex: TIER_THEME.gold.ringHex,
    tintHex: TIER_THEME.gold.bgTintHex,
    textHex: TIER_THEME.gold.highlightHex,
  },
  {
    key: "platinum",
    label: "Platinum · 80%+",
    dotHex: TIER_THEME.platinum.colorHex,
    ringHex: TIER_THEME.platinum.ringHex,
    tintHex: TIER_THEME.platinum.bgTintHex,
    textHex: TIER_THEME.platinum.highlightHex,
  },
];

// Client-side auth probe, reads the localStorage token written by
// the login flow. Used only to decide whether to surface the "Download
// CSV" anchor vs a "Sign in to download" CTA on the public page. The
// real authorisation still happens server-side; this just avoids the
// crude 401 screen anonymous users would otherwise see.
function useHasAuthToken(): boolean {
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    try {
      setHasToken(Boolean(window.localStorage.getItem("betsplug_token")));
    } catch {
      setHasToken(false);
    }
  }, []);
  return hasToken;
}

function PublicTierTabs({
  value,
  onChange,
}: {
  value: PublicTier;
  onChange: (v: PublicTier) => void;
}) {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const csvSuffix = value !== "all" ? `?pick_tier=${value}` : "";
  const hasToken = useHasAuthToken();
  const localize = useLocalizedHref();
  const localizedLogin = localize("/login");

  return (
    <div className="card-neon card-neon-green rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-3">
        <span className="section-label inline-flex items-center gap-2">
          <ShieldCheck className="h-3 w-3" />
          Model validation per tier
        </span>
        {hasToken ? (
          <button
            type="button"
            onClick={async () => {
              // A plain <a href> can't attach the Authorization header
              // the backend requires, so the CSV endpoint always
              // 401'd. Fetch the bytes with the bearer token, wrap in
              // a blob, and trigger a synthetic download.
              try {
                const token =
                  typeof window !== "undefined"
                    ? window.localStorage.getItem("betsplug_token")
                    : null;
                const resp = await fetch(
                  `${api}/trackrecord/export.csv${csvSuffix}`,
                  {
                    headers: token
                      ? { Authorization: `Bearer ${token}` }
                      : undefined,
                  }
                );
                if (!resp.ok) {
                  // Surface the backend's own `detail` message when
                  // present — covers 402 (tier too low), 429 (rate-
                  // limit) and any 5xx. Falls back to a friendly
                  // default when the body isn't JSON.
                  let detail: string | null = null;
                  try {
                    const body = await resp.json();
                    detail = typeof body?.detail === "string" ? body.detail : null;
                  } catch {
                    /* non-JSON body */
                  }
                  const msg =
                    resp.status === 401 || resp.status === 403
                      ? "Log opnieuw in om de CSV te downloaden."
                      : resp.status === 402
                        ? detail ||
                          "Deze tier zit niet in je abonnement. Upgrade om de CSV te downloaden."
                        : detail ||
                          `Download mislukt (${resp.status}), probeer het zo opnieuw.`;
                  window.alert(msg);
                  return;
                }
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `trackrecord${value !== "all" ? `-${value}` : ""}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch {
                window.alert("Download mislukt, probeer het zo opnieuw.");
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
        ) : (
          // B1.1: the CSV endpoint now requires authentication and only
          // serves tiers up to the caller's own. Public visitors can
          // still browse every tier's aggregate numbers above, but the
          // row-level export (match names, picks, odds, outcomes) is a
          // paid deliverable, swap the anchor for a sign-in CTA.
          <Link
            href={localizedLogin}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-emerald-400/40 hover:text-emerald-300 transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            Sign in to download CSV
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 p-3">
        {PUBLIC_TIER_TABS.map((tab) => {
          const active = tab.key === value;
          // Active-state colours come straight from TIER_THEME, so the
          // Gold tab is metallic gold, Platinum is diamond-blue, etc.
          // Inactive tabs stay neutral so the active one pops.
          const activeStyle = active
            ? {
                borderColor: tab.ringHex,
                background: tab.tintHex,
                color: tab.textHex,
              }
            : undefined;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              style={activeStyle}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? ""
                  : "border-white/[0.08] bg-transparent text-slate-400 hover:border-white/[0.15] hover:text-slate-200"
              }`}
              aria-pressed={active}
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  background: tab.dotHex ?? "transparent",
                  border: tab.dotHex
                    ? `1px solid ${tab.dotHex}`
                    : "1px solid rgba(255,255,255,0.35)",
                  boxShadow: active && tab.dotHex ? `0 0 8px ${tab.dotHex}` : undefined,
                }}
              />
              {tab.label}
            </button>
          );
        })}
      </div>
      <p className="border-t border-white/[0.05] px-5 py-2 text-[10px] text-slate-500 leading-relaxed">
        Historically validated on pre-kickoff snapshots (batch + live). Live-only numbers sit on the Pick-of-the-Day track record. Download the raw rows to recompute accuracy, Brier and calibration yourself.
      </p>
    </div>
  );
}

const KPI_VARIANTS = ["green", "purple", "blue", "green"] as const;
const PIPELINE_VARIANTS = ["green", "purple", "blue", "green", "purple", "blue"] as const;

type Accent = "green" | "purple" | "blue";

/** Map the public tier selector value to a TierKey for emblem rendering. */
function publicTierToTierKey(t: PublicTier): TierKey | null {
  if (t === "free") return "bronze";
  if (t === "silver") return "silver";
  if (t === "gold") return "gold";
  if (t === "platinum") return "platinum";
  return null; // 'all'
}

/**
 * Track Record, NOCTURNE rebuild.
 */
export function TrackRecordContent({ faqSlot, trackRecordPage }: { faqSlot?: React.ReactNode; trackRecordPage?: any }) {
  const { t, locale } = useTranslations();
  const isNl = locale === "nl";
  const loc = useLocalizedHref();
  const home = loc("/");
  // v8.5, default to Gold tier (70%+) on the public page so first-time
  // visitors immediately see the most compelling honest number.
  // Users can still explore every tier via the tab strip below.
  const [pickTier, setPickTier] = useState<PublicTier>("gold");
  const live = useLiveTrackRecordStats(pickTier);
  const potd = usePotdNumbers();

  // BOTD KPI no longer lives in the hero row — the "All tiers" tab
  // was removed, and showing BOTD alongside Silver/Gold/Platinum
  // caused the "tier changed but this number didn't" impression
  // because BOTD is tier-agnostic. The full BOTD stats have their
  // own dedicated section further down the page.
  const showBotdKpi = false;
  const kpis = [
    {
      icon: Percent,
      value:
        live.accuracy != null
          ? `${(live.accuracy * 100).toFixed(1)}%`
          : t("tr.kpi1Value"),
      label: t("tr.kpi1Label"),
      note: t("tr.kpi1Note"),
    },
    ...(showBotdKpi
      ? [
          {
            icon: TrendingUp,
            value:
              live.botdAccuracy != null
                ? `${(live.botdAccuracy * 100).toFixed(1)}%`
                : t("tr.kpi2Value", potd),
            label: t("tr.kpi2Label", potd),
            note: t("tr.kpi2Note"),
          },
        ]
      : []),
    {
      icon: Hash,
      value:
        live.totalPredictions != null
          ? live.totalPredictions.toLocaleString()
          : t("tr.kpi3Value"),
      label: t("tr.kpi3Label"),
      note: t("tr.kpi3Note"),
    },
    {
      icon: Gauge,
      value:
        live.brierScore != null
          ? live.brierScore.toFixed(3)
          : t("tr.kpi4Value"),
      label: t("tr.kpi4Label"),
      note: t("tr.kpi4Note"),
    },
  ];

  const pipeline = [
    { icon: Database, title: t("tr.pipe1Title"), desc: t("tr.pipe1Desc") },
    { icon: Filter, title: t("tr.pipe2Title"), desc: t("tr.pipe2Desc") },
    { icon: Sliders, title: t("tr.pipe3Title"), desc: t("tr.pipe3Desc") },
    { icon: Layers, title: t("tr.pipe4Title"), desc: t("tr.pipe4Desc") },
    { icon: Target, title: t("tr.pipe5Title"), desc: t("tr.pipe5Desc") },
    { icon: CheckCircle2, title: t("tr.pipe6Title"), desc: t("tr.pipe6Desc") },
  ];

  const methodology = [
    { icon: Activity, title: t("tr.method1Title"), desc: t("tr.method1Desc") },
    { icon: LineChart, title: t("tr.method2Title"), desc: t("tr.method2Desc") },
    { icon: Lock, title: t("tr.method3Title"), desc: t("tr.method3Desc") },
    { icon: Eye, title: t("tr.method4Title"), desc: t("tr.method4Desc") },
  ];

  const cases = [
    {
      role: t("tr.case1Role"),
      name: t("tr.case1Name"),
      quote: t("tr.case1Quote"),
      outcome: t("tr.case1Outcome"),
      initial: "L",
      metrics: [
        { label: t("tr.case1Metric1Label"), value: t("tr.case1Metric1Value") },
        { label: t("tr.case1Metric2Label"), value: t("tr.case1Metric2Value") },
        { label: t("tr.case1Metric3Label"), value: t("tr.case1Metric3Value") },
      ],
    },
    {
      role: t("tr.case2Role"),
      name: t("tr.case2Name"),
      quote: t("tr.case2Quote"),
      outcome: t("tr.case2Outcome"),
      initial: "P",
      metrics: [
        { label: t("tr.case2Metric1Label"), value: t("tr.case2Metric1Value") },
        { label: t("tr.case2Metric2Label"), value: t("tr.case2Metric2Value") },
        { label: t("tr.case2Metric3Label"), value: t("tr.case2Metric3Value") },
      ],
    },
    {
      role: t("tr.case3Role"),
      name: t("tr.case3Name"),
      quote: t("tr.case3Quote"),
      outcome: t("tr.case3Outcome"),
      initial: "M",
      metrics: [
        { label: t("tr.case3Metric1Label"), value: t("tr.case3Metric1Value") },
        { label: t("tr.case3Metric2Label"), value: t("tr.case3Metric2Value") },
        { label: t("tr.case3Metric3Label"), value: t("tr.case3Metric3Value") },
      ],
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteNav />

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.14)", filter: "blur(160px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-40 h-[480px] w-[480px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.12)", filter: "blur(160px)" }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label mb-6 inline-flex items-center gap-2"
          >
            <ShieldCheck className="h-3 w-3" />
            {t("tr.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-display text-balance break-words text-4xl text-[#ededed] sm:text-5xl md:text-6xl"
          >
            {t("tr.heroTitleA")}{" "}
            <span className="gradient-text-green">{t("tr.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            {t("tr.heroSubtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href={`${home}#track-record`} className="btn-primary">
              {t("tr.heroCtaPrimary")}
            </Link>
            <Link href={home} className="btn-glass">
              {t("tr.heroCtaSecondary")}
            </Link>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            aria-label="Breadcrumb"
            className="mt-10 flex items-center justify-center gap-2 text-xs text-[#a3a9b8]"
          >
            <Link href={home} className="transition-colors hover:text-[#4ade80]">
              {t("tr.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#ededed]">{t("tr.breadcrumbTrack")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ───────────── TABLE OF CONTENTS ─────────────
          Public-facing roadmap of what lives on this page. Four
          distinct data surfaces, all honest, each with a clear
          "backtest vs live" label so visitors never conflate the
          historical validation numbers with the small-but-growing
          live-measurement numbers that only started after the v8.1
          deploy cut-off. */}
      <section className="relative py-12 md:py-16">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="mb-8 max-w-3xl"
          >
            <span className="section-label mb-3 inline-flex items-center gap-2">
              <Eye className="h-3 w-3" />
              {isNl ? "Wat vind je op deze pagina?" : "What's on this page?"}
            </span>
            <h2 className="text-heading text-balance text-2xl text-[#ededed] sm:text-3xl">
              {isNl
                ? "Vier verschillende meetpunten, allemaal eerlijk gelabeld."
                : "Four distinct measurements, each honestly labelled."}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">
              {isNl
                ? "Klik op een blok om direct naar die sectie te springen. Elk blok is óf een historische backtest (groter sample, retroactief) óf een live meting (klein en groeiend, strikt vóór aftrap vastgezet)."
                : "Click a card to jump to that section. Each one is either a historical backtest (larger sample, retroactive) or a live measurement (small and growing, locked strictly before kickoff)."}
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "1",
                kind: isNl ? "Backtest" : "Backtest",
                title: isNl ? "Tier-accuraatheid" : "Tier accuracy",
                desc: isNl
                  ? "Free / Silver / Gold / Platinum — historische trefzekerheid per tier."
                  : "Free / Silver / Gold / Platinum — historical hit rate per tier.",
                href: "#tier-kpis",
                tone: "green",
              },
              {
                n: "2",
                kind: isNl ? "Live meting" : "Live measurement",
                title: isNl ? "Per tier · live 🔒" : "Per tier · live 🔒",
                desc: isNl
                  ? "Alleen picks die écht vóór de aftrap werden vastgezet. Zichtbaar na inloggen."
                  : "Only picks locked strictly before kickoff. Visible after sign-in.",
                href: "#live-measurement",
                tone: "blue",
              },
              {
                n: "3",
                kind: isNl ? "Backtest" : "Backtest",
                title: isNl ? "Pick van de Dag" : "Pick of the Day",
                desc: isNl
                  ? "De dagelijkse topper toegepast op recent afgelopen wedstrijden."
                  : "The daily top pick applied to recently finished matches.",
                href: "#model-validation",
                tone: "purple",
              },
              {
                n: "4",
                kind: isNl ? "Live meting" : "Live measurement",
                title: isNl ? "Pick van de Dag · live 🔒" : "Pick of the Day · live 🔒",
                desc: isNl
                  ? "Strikt pre-match BOTD-picks. Zichtbaar na inloggen."
                  : "Strictly pre-match BOTD picks. Visible after sign-in.",
                href: "#botd-live",
                tone: "green",
              },
            ].map((item) => (
              <a
                key={item.n}
                href={item.href}
                className={`card-neon card-neon-${item.tone} group block rounded-2xl transition-transform hover:-translate-y-0.5`}
              >
                <div className="relative p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-stat text-2xl text-[#ededed]">
                      {item.n}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        item.kind === (isNl ? "Live meting" : "Live measurement")
                          ? "border-blue-400/30 bg-blue-500/10 text-blue-300"
                          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {item.kind}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#ededed]">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#a3a9b8]">
                    {item.desc}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-[#4ade80] group-hover:gap-2 transition-all">
                    {isNl ? "Spring erheen" : "Jump to section"}
                    <ChevronRight className="h-3 w-3" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── KPIs ───────────── */}
      <section id="tier-kpis" className="relative overflow-hidden py-20 md:py-28 scroll-mt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(160px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <Gauge className="h-3 w-3" />
              {isNl
                ? "1 · Tier-accuraatheid (historische backtest)"
                : "1 · Tier accuracy (historical backtest)"}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("tr.kpisTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">
              {t("tr.kpisSubtitle")}
            </p>
          </motion.div>

          {/* v8.3, public tier selector. Numbers above the KPI grid
              update as you click a tab; the CSV download in the tab
              header stays in sync with the selected tier. */}
          <div className="mb-8">
            <PublicTierTabs value={pickTier} onChange={setPickTier} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              const variant = KPI_VARIANTS[i % KPI_VARIANTS.length] as Accent;
              // Accuracy card (i===0) gets a tier-coloured emblem when a
              // specific tier tab is active so the hex colour matches the
              // tier the number belongs to — Free=bronze, Silver=silver,
              // Gold=gold, Platinum=diamond-blue. 'All tiers' keeps the
              // generic green hex.
              const tierKey = i === 0 ? publicTierToTierKey(pickTier) : null;
              return (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`card-neon card-neon-${variant} rounded-2xl`}
                >
                  <div className="relative p-6">
                    {tierKey ? (
                      <div className="mb-4">
                        <TierEmblem tier={tierKey} size="md" />
                      </div>
                    ) : (
                      <HexBadge variant={variant} size="md" className="mb-4">
                        <Icon className="h-5 w-5" />
                      </HexBadge>
                    )}
                    <div className="text-stat text-3xl text-[#ededed] sm:text-4xl">{k.value}</div>
                    <p className="mt-2 text-sm font-semibold text-[#ededed]">{k.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">{k.note}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── 2 · LIVE MEASUREMENT (tier) — LOCKED ─────────────
          Live tier data is intentionally hidden from anonymous visitors
          while it grows from zero (cut-off 2026-04-16). Showing 0/0 on
          the marketing surface would read as "product doesn't work"
          instead of "warm-up phase". Signed-in users see the real
          numbers on the authed /trackrecord dashboard. */}
      <LockedLivePlaceholder number="2" variant="tier" id="live-measurement" />

      {/* ───────────── 3 · BOTD BACKTEST ───────────── */}
      <BotdTrackRecordSection />

      {/* ───────────── 4 · BOTD LIVE — LOCKED ───────────── */}
      <LockedLivePlaceholder number="4" variant="botd" id="botd-live" />

      {/* ───────────── PIPELINE ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-blue) / 0.12)", filter: "blur(160px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 bottom-0 h-[460px] w-[460px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(160px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <Layers className="h-3 w-3" />
              {t("tr.pipeBadge")}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("tr.pipeTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">
              {t("tr.pipeSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pipeline.map((step, i) => {
              const Icon = step.icon;
              const variant = PIPELINE_VARIANTS[i % PIPELINE_VARIANTS.length] as Accent;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`card-neon card-neon-${variant} rounded-2xl`}
                >
                  <div className="relative p-7">
                    <div className="mb-5 flex items-center gap-3">
                      <HexBadge variant={variant} size="md">
                        <Icon className="h-5 w-5" />
                      </HexBadge>
                      <Pill tone={variant === "green" ? "active" : variant === "purple" ? "purple" : "info"}>
                        Step {String(i + 1).padStart(2, "0")}
                      </Pill>
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-[#ededed]">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-[#a3a9b8]">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── METHODOLOGY ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/4 top-10 h-[460px] w-[460px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.14)", filter: "blur(160px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" />
              {t("tr.methodBadge")}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("tr.methodTitle")} <span className="gradient-text-purple">·</span>
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">
              {t("tr.methodSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {methodology.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="card-neon card-neon-purple rounded-2xl"
                >
                  <div className="relative flex gap-5 p-7">
                    <HexBadge variant="purple" size="md">
                      <Icon className="h-5 w-5" />
                    </HexBadge>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-[#ededed]">{m.title}</h3>
                      <p className="text-sm leading-relaxed text-[#a3a9b8]">{m.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── CASE STUDIES ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(160px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <Trophy className="h-3 w-3" />
              {t("tr.casesBadge")}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("tr.casesTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">
              {t("tr.casesSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {cases.map((c, i) => (
              <motion.article
                key={c.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="card-neon card-neon-green rounded-3xl"
              >
                <div className="relative flex flex-1 flex-col p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <HexBadge variant="green" size="lg">
                      <span className="text-lg font-bold">{c.initial}</span>
                    </HexBadge>
                    <div>
                      <Pill tone="active" className="!text-[10px]">
                        {c.role}
                      </Pill>
                      <h3 className="mt-1 text-lg font-semibold text-[#ededed]">
                        {c.name}
                      </h3>
                    </div>
                  </div>

                  <div className="glass-panel relative mb-6 rounded-2xl p-5">
                    <Quote className="absolute -top-2 left-4 h-4 w-4 rotate-180 text-[#4ade80]" />
                    <p className="text-sm leading-relaxed text-[#a3a9b8]">
                      &ldquo;{c.quote}&rdquo;
                    </p>
                  </div>

                  <div className="glass-panel mb-6 grid grid-cols-3 gap-2 rounded-2xl p-3 sm:p-4">
                    {c.metrics.map((m) => (
                      <div key={m.label} className="min-w-0 text-center">
                        <div className="text-stat truncate text-base text-[#4ade80] sm:text-lg">
                          {m.value}
                        </div>
                        <div className="mt-1 break-words text-[10px] uppercase tracking-wider leading-tight text-[#a3a9b8]">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex items-start gap-2 border-t border-white/[0.06] pt-5">
                    <Trophy className="h-4 w-4 shrink-0 translate-y-0.5 text-[#4ade80]" />
                    <p className="text-xs leading-relaxed text-[#a3a9b8]">{c.outcome}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {faqSlot}

      {/* ───────────── TRANSPARENCY CTA ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="card-neon card-neon-green relative overflow-hidden rounded-3xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.25)", filter: "blur(140px)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -bottom-20 h-[400px] w-[400px] rounded-full"
              style={{ background: "hsl(var(--accent-purple) / 0.2)", filter: "blur(140px)" }}
            />

            <div className="relative p-6 sm:p-10 md:p-16">
              <span className="section-label mb-6 inline-flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {t("tr.transBadge")}
              </span>
              <h2 className="text-display text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t("tr.transTitle")}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                {t("tr.transSubtitle")}
              </p>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link href={`${home}#pricing`} className="btn-primary">
                  {t("tr.transCta2")}
                </Link>
                <Link href={`${home}#track-record`} className="btn-glass">
                  {t("tr.transCta1")}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

export default TrackRecordContent;
