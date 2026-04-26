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
  Activity,
  Brain,
  Cpu,
  Network,
  CheckCircle2,
  Eye,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
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
 * Scene 1 — Match data ingestion
 * Shows: a Premier League fixture card materializing with five
 * data signals (xG, Form, Elo, H2H, Lineups) sliding in around it.
 * ──────────────────────────────────────────────────────────── */
function Scene1({ t }: { t: (k: any, vars?: any) => string }) {
  const signals = [
    { label: "xG", x: -180, y: -30 },
    { label: "Form", x: 200, y: -20 },
    { label: "Elo", x: -200, y: 60 },
    { label: "H2H", x: 180, y: 80 },
    { label: t("demo.s1.lineups"), x: -10, y: -110 },
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
          icon={<Activity className="h-4 w-4" strokeWidth={2.4} />}
        />
      </div>
      <div className="relative h-[260px]">
        {/* Central match card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[#0d1321]/80 px-5 py-4 backdrop-blur-md shadow-[0_0_48px_rgba(74,222,128,0.18)]"
          style={{ minWidth: 220 }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#4ade80]">
            Premier League
          </div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-[#ededed]">Arsenal</span>
            <span className="text-[10px] text-slate-500">20:00</span>
            <span className="text-sm font-semibold text-[#ededed]">Liverpool</span>
          </div>
        </motion.div>
        {/* Floating signal pills */}
        {signals.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: 1, x: s.x, y: s.y, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.3 + i * 0.12,
              type: "spring",
              stiffness: 110,
              damping: 14,
            }}
            className="absolute left-1/2 top-1/2 inline-flex items-center gap-1.5 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10 px-3 py-1 text-xs font-semibold text-[#86efac] backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
            {s.label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Scene 2 — Ensemble AI processes
 * Shows: 4 model nodes (Elo, Poisson, Logistic, XGBoost) feeding
 * into a central "Ensemble" node, with pulsing connection lines.
 * ──────────────────────────────────────────────────────────── */
function Scene2({ t }: { t: (k: any, vars?: any) => string }) {
  const models = ["Elo", "Poisson", "Logistic", "XGBoost"];
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
          icon={<Brain className="h-4 w-4" strokeWidth={2.4} />}
        />
      </div>
      <div className="relative h-[260px]">
        {/* SVG with connection lines */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 260"
          preserveAspectRatio="none"
        >
          {[
            { x: 60, y: 50 },
            { x: 60, y: 210 },
            { x: 340, y: 50 },
            { x: 340, y: 210 },
          ].map((src, i) => (
            <motion.line
              key={i}
              x1={src.x}
              y1={src.y}
              x2={200}
              y2={130}
              stroke="#4ade80"
              strokeWidth={1.5}
              strokeDasharray="3 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.7, 0.4, 0.7] }}
              transition={{
                pathLength: { duration: 0.6, delay: 0.2 + i * 0.1 },
                opacity: { duration: 2, delay: 0.8 + i * 0.1, repeat: Infinity },
              }}
            />
          ))}
        </svg>

        {/* Four model nodes */}
        {models.map((m, i) => {
          const positions = [
            { left: "8%", top: "10%" },
            { left: "8%", bottom: "10%" },
            { right: "8%", top: "10%" },
            { right: "8%", bottom: "10%" },
          ];
          return (
            <motion.div
              key={m}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              className="absolute inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1321]/80 px-3 py-2 text-xs font-semibold text-[#ededed] backdrop-blur-sm"
              style={positions[i]}
            >
              <Cpu className="h-3.5 w-3.5 text-[#4ade80]" />
              {m}
            </motion.div>
          );
        })}

        {/* Central ensemble node — bigger, pulsing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-[#4ade80] blur-2xl"
            />
            <div className="relative inline-flex items-center gap-2 rounded-full border border-[#4ade80]/40 bg-[#0d1321] px-4 py-2.5 text-sm font-bold text-[#4ade80] shadow-[0_0_32px_rgba(74,222,128,0.4)]">
              <Network className="h-4 w-4" />
              {t("demo.s2.ensemble")}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Scene 3 — Probability output
 * Shows: three horizontal bars filling to Home/Draw/Away %.
 * ──────────────────────────────────────────────────────────── */
function Scene3({ t }: { t: (k: any, vars?: any) => string }) {
  const probs = [
    { label: t("demo.s3.home"), pct: 58, color: "#4ade80" },
    { label: t("demo.s3.draw"), pct: 24, color: "#a3a9b8" },
    { label: t("demo.s3.away"), pct: 18, color: "#a3a9b8" },
  ];
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
          icon={<TrendingUp className="h-4 w-4" strokeWidth={2.4} />}
        />
      </div>
      <div className="rounded-xl border border-white/10 bg-[#0d1321]/60 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Arsenal vs Liverpool
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[#4ade80]">
            {t("demo.s3.modelOutput")}
          </span>
        </div>
        <div className="space-y-3">
          {probs.map((p, i) => (
            <div key={p.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#ededed]">{p.label}</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="font-bold tabular-nums"
                  style={{ color: p.color }}
                >
                  {p.pct}%
                </motion.span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.15, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${p.color}, ${p.color}cc)`,
                    boxShadow: i === 0 ? `0 0 16px ${p.color}80` : undefined,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-5 flex items-center justify-between rounded-lg border border-[#4ade80]/20 bg-[#4ade80]/[0.06] px-3 py-2"
        >
          <span className="text-[11px] uppercase tracking-widest text-[#86efac]">
            {t("demo.s3.edge")}
          </span>
          <span className="text-sm font-bold text-[#4ade80] tabular-nums">+8.2%</span>
        </motion.div>
      </div>
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
