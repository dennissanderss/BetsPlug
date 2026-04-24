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
  Star,
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
import { AccuracyPlusPreview } from "@/components/noct/accuracy-plus-preview";

/* ── Live API data hook ─────────────────────────────────── */
interface LiveStats {
  totalPredictions: number | null;
  accuracy: number | null;
  wilsonLow: number | null;
  wilsonHigh: number | null;
  brierScore: number | null;
  botdTotal: number | null;
  botdAccuracy: number | null;
}

type PublicTier = "all" | "free" | "silver" | "gold" | "platinum";

function useLiveTrackRecordStats(pickTier: PublicTier = "all"): LiveStats {
  const [stats, setStats] = useState<LiveStats>({
    totalPredictions: null,
    accuracy: null,
    wilsonLow: null,
    wilsonHigh: null,
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
        wilsonLow: null,
        wilsonHigh: null,
        brierScore: null,
        botdTotal: null,
        botdAccuracy: null,
      };
      if (summaryResult.status === "fulfilled" && summaryResult.value) {
        const s = summaryResult.value;
        next.totalPredictions = s.total_predictions ?? null;
        next.accuracy = s.accuracy ?? null;
        next.wilsonLow = s.wilson_ci_low ?? null;
        next.wilsonHigh = s.wilson_ci_high ?? null;
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

// ─── Phase divider ─────────────────────────────────────────────────
// Grote visuele banner die de pagina splitst in "Backtest" (boven) en
// "Live meting" (onder). Zonder deze scheiding gaan de vier track-
// record-blokken (2× per tier, 2× per BotD) visueel door elkaar en
// begrijpt niemand wat nou simulatie is en wat pre-match meting.

function PhaseDivider({
  kicker,
  title,
  subtitle,
  accent = "blue",
}: {
  kicker: string;
  title: string;
  subtitle: string;
  accent?: "blue" | "emerald";
}) {
  const ringVar =
    accent === "emerald" ? "var(--accent-green)" : "var(--accent-blue)";
  return (
    <section className="relative py-10 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{
          background: `linear-gradient(90deg, transparent 0%, hsl(${ringVar} / 0.35) 50%, transparent 100%)`,
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-center sm:p-8"
          style={{
            background: `linear-gradient(135deg, hsl(${ringVar} / 0.12) 0%, hsl(230 22% 9% / 0.9) 55%, hsl(${ringVar} / 0.14) 100%)`,
            border: `1px solid hsl(${ringVar} / 0.28)`,
            boxShadow: `0 0 0 1px hsl(${ringVar} / 0.08) inset, 0 20px 60px rgba(0,0,0,0.35)`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-[260px] w-[260px] rounded-full"
            style={{ background: `hsl(${ringVar} / 0.22)`, filter: "blur(110px)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -bottom-24 h-[260px] w-[260px] rounded-full"
            style={{ background: `hsl(${ringVar} / 0.18)`, filter: "blur(110px)" }}
          />
          <div className="relative">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4ade80]">
              {kicker}
            </span>
            <h2 className="text-heading mt-3 text-balance break-words text-2xl text-[#ededed] sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#a3a9b8]">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
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
  const { t } = useTranslations();

  return (
    <div className="card-neon card-neon-green rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-3">
        <span className="section-label inline-flex items-center gap-2">
          <ShieldCheck className="h-3 w-3" />
          Model validation per tier
        </span>
        {hasToken ? (
          <div className="flex flex-wrap items-center gap-2">
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
          {/* BotD dedicated CSV — streams the historical Pick-of-the-Day
              validation picks only (1 row per day). Separate download
              because users asked for "give me just the BotD history to
              paste into my own sheet" without wading through every
              evaluated prediction. */}
          <button
            type="button"
            title={t("trackRecord.btnBotdCsvTitle")}
            onClick={async () => {
              try {
                const token =
                  typeof window !== "undefined"
                    ? window.localStorage.getItem("betsplug_token")
                    : null;
                const resp = await fetch(
                  `${api}/bet-of-the-day/export.csv`,
                  {
                    headers: token
                      ? { Authorization: `Bearer ${token}` }
                      : undefined,
                  }
                );
                if (!resp.ok) {
                  window.alert(
                    resp.status === 401 || resp.status === 403
                      ? t("trackRecord.dlSigninAgain")
                      : t("trackRecord.dlFailed", { status: resp.status }),
                  );
                  return;
                }
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "betsplug-pick-of-the-day.csv";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch {
                window.alert(t("trackRecord.dlFailedTryAgain"));
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
            {t("trackRecord.btnBotdCsv")}
          </button>
          </div>
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
  const { t } = useTranslations();
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
  // Kleine "95% CI" subregel onder de Nauwkeurigheid-KPI zodat de
  // bezoeker naast het percentage ook de betrouwbaarheidsmarge ziet.
  // Valt terug op de statische tr.kpi1Note als de API geen Wilson CI
  // levert (bv. lege dataset of endpoint nog niet up-to-date).
  const accuracyNote =
    live.accuracy != null && live.wilsonLow != null && live.wilsonHigh != null && live.totalPredictions
      ? `${(live.wilsonLow * 100).toFixed(1)}% – ${(live.wilsonHigh * 100).toFixed(1)}% (95% betrouwbaarheid, op ${live.totalPredictions.toLocaleString()} predicties)`
      : t("tr.kpi1Note");

  const kpis = [
    {
      icon: Percent,
      value:
        live.accuracy != null
          ? `${(live.accuracy * 100).toFixed(1)}%`
          : t("tr.kpi1Value"),
      label: t("tr.kpi1Label"),
      note: accuracyNote,
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

      {/* ───────────── DIKKE SCHEIDING: BACKTEST PHASE ─────────────
          Markeer duidelijk dat alles tussen deze banner en de
          "Live meting" banner verderop historische simulatie is —
          niet pre-match meting. User feedback was dat het oude
          interleaved layout (tier-backtest → tier-live → botd-backtest
          → botd-live) verwarrend was. */}
      <PhaseDivider
        kicker={t("trackRecord.phaseBacktestKicker")}
        title={t("trackRecord.phaseBacktestTitle")}
        subtitle={t("trackRecord.phaseBacktestSubtitle")}
        accent="emerald"
      />

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
              {t("trackRecord.tierKpisLabel")}
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

      {/* ───────────── BOTD BACKTEST — directly after tier backtest ─────
          User feedback was dat BotD-backtest als aparte container naast
          de tier-backtest hoort, zodat alle "historische analyse"
          onderdelen bij elkaar staan vóór we aan live meting beginnen. */}
      <BotdTrackRecordSection publicMode />

      {/* Full details + CSV export + live measurement per tier are
          intentionally gated to the authenticated app — Free Access
          users sign up once and get the rest inside the dashboard. */}
      <section className="relative py-12 md:py-16">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="section-label mb-4 inline-flex items-center gap-2 mx-auto">
            <Lock className="h-3 w-3" />
            {t("trackRecord.signInLockedBadge")}
          </span>
          <h3 className="text-heading text-balance text-2xl text-[#ededed] sm:text-3xl">
            {t("trackRecord.signInLockedTitle")}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8]">
            {t("trackRecord.signInLockedLede")}
          </p>
          <Link
            href={loc("/register")}
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            {t("trackRecord.signInLockedCta")}
            <ChevronRight className="h-4 w-4" />
          </Link>
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
