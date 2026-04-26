"use client";

/**
 * HowItWorksDemo — animated 5-scene explainer for the homepage.
 *
 * No video file. No external player. Pure React + Framer Motion +
 * NOCTURNE primitives, so it works on every locale, every device,
 * costs zero bandwidth, and stays in lockstep with the actual UI
 * when we ship dashboard changes.
 *
 * Scenes auto-cycle every ~5s. Hover pauses the cycle so visitors
 * can read a slide they care about. The progress bar at the top
 * shows where we are. Manual prev/next dots let visitors click
 * through at their own pace.
 *
 * Each scene tells one story-beat:
 *   1. Match goes in       — "every Premier League fixture, every signal"
 *   2. AI processes        — "4 models, 70k historical matches"
 *   3. Probabilities out   — "probabilities, not opinions"
 *   4. Tier system         — "you choose how much certainty you want"
 *   5. Track record proof  — "publicly verified, no cherry-picking"
 *
 * Copy lives in messages.ts under `demo.*` so all 16 locales render
 * natively. No isNl ternaries, no hardcoded strings.
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  LayoutDashboard,
  Trophy,
  CheckCircle2,
  Eye,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Target,
  ClipboardList,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";

const SCENE_DURATION_MS = 5500;
const TOTAL_SCENES = 5;

export function HowItWorksDemo() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-advance the carousel. Pauses when the user hovers the
  // demo panel, when the page is in the background (tab inactive),
  // or when reduced-motion is requested.
  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
    }
    const id = setInterval(() => {
      setActive((i) => (i + 1) % TOTAL_SCENES);
    }, SCENE_DURATION_MS);
    return () => clearInterval(id);
  }, [paused]);

  // Pause when tab is hidden so it doesn't drain CPU in background.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      aria-label={t("demo.sectionLabel")}
    >
      {/* Ambient glows matching NOCTURNE hero treatment */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-20 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.16)", filter: "blur(140px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-20 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.14)", filter: "blur(150px)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-10 text-center">
          <span className="section-label">
            <span className="live-dot" />
            {t("demo.kicker")}
          </span>
          <h2 className="mt-5 text-display-sm md:text-display max-w-3xl mx-auto text-balance text-[#ededed]">
            {t("demo.headingPrefix")}{" "}
            <span className="gradient-text-green">{t("demo.headingHighlight")}</span>
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
            {t("demo.subtitle")}
          </p>
        </div>

        {/* Demo viewport */}
        <div
          ref={containerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative card-neon card-neon-green overflow-hidden rounded-2xl"
        >
          {/* Top progress segments — one bar per scene, the active
              one fills over SCENE_DURATION_MS, others stay 100% if
              already viewed and 0% if upcoming. */}
          <div className="relative z-10 flex gap-1 px-5 pt-4">
            {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
              <div
                key={i}
                className="flex-1 overflow-hidden rounded-full bg-white/[0.06]"
                style={{ height: 3 }}
              >
                <motion.div
                  className="h-full bg-[#4ade80]"
                  initial={false}
                  animate={{
                    width:
                      i < active ? "100%" : i === active ? (paused ? "50%" : "100%") : "0%",
                  }}
                  transition={{
                    duration: i === active && !paused ? SCENE_DURATION_MS / 1000 : 0.25,
                    ease: "linear",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Scene viewport — fixed-ish height to avoid layout jumps */}
          <div className="relative px-5 sm:px-8 py-8 sm:py-12 min-h-[420px] sm:min-h-[460px]">
            <AnimatePresence mode="wait">
              {active === 0 && <Scene1 t={t} />}
              {active === 1 && <Scene2 t={t} />}
              {active === 2 && <Scene3 t={t} />}
              {active === 3 && <Scene4 t={t} />}
              {active === 4 && <Scene5 t={t} />}
            </AnimatePresence>
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/[0.05] bg-black/20 px-5 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setActive((i) => (i - 1 + TOTAL_SCENES) % TOTAL_SCENES)
                }
                aria-label={t("demo.prev")}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? t("demo.play") : t("demo.pause")}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => setActive((i) => (i + 1) % TOTAL_SCENES)}
                aria-label={t("demo.next")}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-2 text-[10px] uppercase tracking-widest text-slate-500">
                {active + 1} / {TOTAL_SCENES}
              </span>
            </div>

            {/* Dot navigation */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`${t("demo.gotoScene")} ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-6 bg-[#4ade80]" : "w-1.5 bg-white/[0.15]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Below-fold CTA so visitors who watch the cycle can act */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={loc("/register")}
            className="btn-primary inline-flex items-center gap-2"
          >
            {t("demo.ctaPrimary")}
          </Link>
          <Link
            href={loc("/how-it-works")}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-[#a3a9b8] transition-colors hover:border-[#4ade80]/40 hover:text-[#ededed]"
          >
            {t("demo.ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
 * Scene 1 — Pitch slide ("What is BetsPlug")
 * Shows: brand mark, one-line value-prop, three live KPIs.
 * Goal: visitor knows in 4 seconds what BetsPlug is about.
 * ──────────────────────────────────────────────────────────── */
function Scene1({ t }: { t: (k: any, vars?: any) => string }) {
  const stats = [
    { label: t("demo.s1.stat1Label"), value: "30+", color: "#4ade80" },
    { label: t("demo.s1.stat2Label"), value: "60%+", color: "#4ade80" },
    { label: t("demo.s1.stat3Label"), value: "1.5K+", color: "#4ade80" },
  ];
  return (
    <motion.div
      key="s1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]"
    >
      <div>
        <SceneHeading
          eyebrow={t("demo.s1.eyebrow")}
          title={t("demo.s1.title")}
          body={t("demo.s1.body")}
          icon={<Sparkles className="h-4 w-4" strokeWidth={2.4} />}
        />
      </div>
      <div className="relative">
        {/* Big brand-style number stack */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-[#4ade80]/30 bg-[#0d1321]/80 p-6 backdrop-blur-md shadow-[0_0_48px_rgba(74,222,128,0.18)]"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#86efac]">
              <span className="live-dot" />
              {t("demo.s1.liveBadge")}
            </span>
            <span className="text-[10px] text-slate-500">
              {t("demo.s1.updatedDaily")}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.12 }}
                className="text-center"
              >
                <div
                  className="text-3xl sm:text-4xl font-extrabold tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-5 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-300"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80] shrink-0" />
            <span>{t("demo.s1.tagline")}</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Scene 2 — The dashboard you get
 * Shows: a miniature dashboard mock with sidebar + match-row
 * stack animating in. Goal: visitor sees concrete UI before
 * they sign up.
 * ──────────────────────────────────────────────────────────── */
function Scene2({ t }: { t: (k: any, vars?: any) => string }) {
  const navItems = [
    { icon: LayoutDashboard, label: t("demo.s2.navOverview"), active: true },
    { icon: Target, label: t("demo.s2.navPredictions") },
    { icon: ClipboardList, label: t("demo.s2.navTrackRecord") },
    { icon: Trophy, label: t("demo.s2.navPotd") },
  ];
  const matches = [
    { league: "Premier League", home: "Arsenal", away: "Liverpool", conf: 78, pick: "1" },
    { league: "La Liga", home: "Real Madrid", away: "Sevilla", conf: 82, pick: "1" },
    { league: "Serie A", home: "Inter", away: "Juventus", conf: 71, pick: "X" },
  ];
  return (
    <motion.div
      key="s2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]"
    >
      <div>
        <SceneHeading
          eyebrow={t("demo.s2.eyebrow")}
          title={t("demo.s2.title")}
          body={t("demo.s2.body")}
          icon={<LayoutDashboard className="h-4 w-4" strokeWidth={2.4} />}
        />
      </div>
      {/* Mini dashboard mock */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-white/10 bg-[#0d1321]/70 p-3 backdrop-blur-md overflow-hidden"
      >
        <div className="grid gap-2 grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr]">
          {/* Sidebar */}
          <div className="space-y-1 border-r border-white/[0.04] pr-2">
            <div className="px-2 pb-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">
              {t("demo.s2.menuLabel")}
            </div>
            {navItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 ${
                  item.active
                    ? "bg-[#4ade80]/[0.12] text-[#86efac]"
                    : "text-slate-400"
                }`}
              >
                <item.icon className="h-3 w-3 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-semibold truncate">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
          {/* Main content — match rows */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[10px] font-bold text-[#86efac]">
                {t("demo.s2.feedTitle")}
              </span>
              <span className="text-[8px] uppercase tracking-widest text-slate-500">
                {t("demo.s2.confLabel")}
              </span>
            </div>
            {matches.map((m, i) => (
              <motion.div
                key={m.home}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.15 }}
                className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-widest text-slate-500">
                    {m.league}
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-[#4ade80]">
                    {m.conf}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-[#ededed]">
                  <span className="truncate font-semibold">{m.home}</span>
                  <span className="mx-2 inline-flex h-4 w-4 items-center justify-center rounded bg-[#4ade80]/[0.15] text-[8px] font-bold text-[#4ade80]">
                    {m.pick}
                  </span>
                  <span className="truncate text-right text-slate-400">{m.away}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Scene 3 — Free Pick of the Day
 * Shows: one big "today's free pick" card with confidence,
 * model output, and a "no card needed" reassurance.
 * ──────────────────────────────────────────────────────────── */
function Scene3({ t }: { t: (k: any, vars?: any) => string }) {
  return (
    <motion.div
      key="s3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]"
    >
      <div>
        <SceneHeading
          eyebrow={t("demo.s3.eyebrow")}
          title={t("demo.s3.title")}
          body={t("demo.s3.body")}
          icon={<Trophy className="h-4 w-4" strokeWidth={2.4} />}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative rounded-2xl border border-[#4ade80]/30 bg-[#0d1321]/85 p-6 backdrop-blur-md shadow-[0_0_56px_rgba(74,222,128,0.22)]"
      >
        {/* Free badge top-right */}
        <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[#4ade80]/40 bg-[#4ade80]/[0.12] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#86efac]">
          <Sparkles className="h-2.5 w-2.5" />
          {t("demo.s3.freeBadge")}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#4ade80]">
          {t("demo.s3.kicker")}
        </div>
        <div className="mt-2 text-base font-bold text-[#ededed]">
          Premier League
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-extrabold text-[#ededed]">
            Real Madrid
          </span>
          <span className="text-xs text-slate-500">21:00</span>
          <span className="text-lg font-extrabold text-[#ededed]">
            Barcelona
          </span>
        </div>
        {/* Confidence meter */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span className="font-semibold text-slate-400">
              {t("demo.s3.confLabel")}
            </span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-bold tabular-nums text-[#4ade80]"
            >
              78%
            </motion.span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/[0.04]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "78%" }}
              transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #4ade80, #22c55e)",
                boxShadow: "0 0 16px rgba(74, 222, 128, 0.55)",
              }}
            />
          </div>
        </div>
        {/* Pick row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-5 flex items-center justify-between rounded-lg border border-[#4ade80]/30 bg-[#4ade80]/[0.08] px-3 py-2.5"
        >
          <span className="text-[10px] uppercase tracking-widest text-[#86efac]">
            {t("demo.s3.modelPick")}
          </span>
          <span className="text-sm font-bold text-[#4ade80]">
            Real Madrid · {t("demo.s3.toWin")}
          </span>
        </motion.div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-slate-500">
          <CheckCircle2 className="h-3 w-3 text-[#4ade80]" />
          {t("demo.s3.noCardNote")}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Scene 4 — Tier system
 * Shows: 4 tier cards stacking with their accuracy thresholds,
 * highlighting "Free → Silver → Gold → Platinum".
 * ──────────────────────────────────────────────────────────── */
function Scene4({ t }: { t: (k: any, vars?: any) => string }) {
  const tiers = [
    { name: "Free", accuracy: "45%+", color: "#a3a9b8", glow: "rgba(163,169,184,0.2)" },
    { name: "Silver", accuracy: "60%+", color: "#cbd5e1", glow: "rgba(203,213,225,0.3)" },
    { name: "Gold", accuracy: "70%+", color: "#fbbf24", glow: "rgba(251,191,36,0.45)" },
    { name: "Platinum", accuracy: "80%+", color: "#67e8f9", glow: "rgba(103,232,249,0.45)" },
  ];
  return (
    <motion.div
      key="s4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]"
    >
      <div>
        <SceneHeading
          eyebrow={t("demo.s4.eyebrow")}
          title={t("demo.s4.title")}
          body={t("demo.s4.body")}
          icon={<Shield className="h-4 w-4" strokeWidth={2.4} />}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1321]/60 p-4 backdrop-blur-md"
            style={{ boxShadow: `0 0 24px ${tier.glow}` }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: `linear-gradient(90deg, ${tier.color}, ${tier.color}66)` }}
            />
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tier.color }}>
              {tier.name}
            </div>
            <div className="mt-2 text-2xl font-extrabold tabular-nums text-[#ededed]">
              {tier.accuracy}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {t("demo.s4.accuracyLabel")}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Scene 5 — Public track record
 * Shows: counter animating to 70.7% accuracy + correct/total +
 * "publicly verified" reassurance.
 * ──────────────────────────────────────────────────────────── */
function Scene5({ t }: { t: (k: any, vars?: any) => string }) {
  const [pct, setPct] = useState(0);
  const [correct, setCorrect] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const targetPct = 70.7;
    const targetCorrect = 597;
    const dur = 1400;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setPct(Math.round(eased * targetPct * 10) / 10);
      setCorrect(Math.round(eased * targetCorrect));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <motion.div
      key="s5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]"
    >
      <div>
        <SceneHeading
          eyebrow={t("demo.s5.eyebrow")}
          title={t("demo.s5.title")}
          body={t("demo.s5.body")}
          icon={<Eye className="h-4 w-4" strokeWidth={2.4} />}
        />
      </div>
      <div className="rounded-xl border border-[#4ade80]/30 bg-[#0d1321]/80 p-6 backdrop-blur-md shadow-[0_0_48px_rgba(74,222,128,0.18)]">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#86efac]">
            <span className="live-dot" />
            {t("demo.s5.liveBadge")}
          </span>
          <span className="text-[10px] text-slate-500">
            {t("demo.s5.modelLabel")}
          </span>
        </div>
        <div className="mt-6 flex items-end gap-3">
          <span className="text-6xl font-extrabold tabular-nums text-[#4ade80]">
            {pct.toFixed(1)}
          </span>
          <span className="pb-2 text-2xl font-bold text-[#4ade80]">%</span>
        </div>
        <div className="text-xs uppercase tracking-widest text-slate-500">
          {t("demo.s5.accuracyLabel")}
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-white/[0.06] pt-4">
          <span className="text-xs text-slate-400">{t("demo.s5.correctLabel")}</span>
          <span className="text-base font-bold tabular-nums text-[#ededed]">
            {correct} / 845
          </span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <CheckCircle2 className="h-3 w-3 text-[#4ade80]" />
          {t("demo.s5.verifiedNote")}
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Shared scene-heading component — keeps the left-column layout
 * consistent across scenes 1-5.
 * ──────────────────────────────────────────────────────────── */
function SceneHeading({
  eyebrow,
  title,
  body,
  icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-3 inline-flex items-center gap-2">
        <HexBadge variant="green" size="sm">
          {icon}
        </HexBadge>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#86efac]">
          {eyebrow}
        </span>
      </div>
      <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ededed] text-balance">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
        {body}
      </p>
    </>
  );
}

export default HowItWorksDemo;
