"use client";

/**
 * RecognizeThis, visual empathy section with a fake-tipster chat mockup
 * next to the real BetsPlug prediction card. The contrast is the point.
 *
 * Why this design: visitors recognise the patterns ("yes, I've been in
 * that group") before we ever say the word 'BetsPlug'. A flat grid of
 * NOCTURNE cards felt corporate; a phone-chat mockup is visceral.
 *
 * Tone rules (per product feedback):
 *   - Never accuse competitors of scamming, describe the patterns.
 *   - Mock copy in the chat is deliberately exaggerated but not libellous.
 *   - Right side keeps it professional: real data structure, real numbers.
 */

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Flame,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock3,
  Target,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Crown,
} from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { POTD_STATS } from "@/data/potd-stats";

export function RecognizeThis() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Ambient glows: red+purple (pain), then green fading in (relief) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-20 h-[500px] w-[500px] rounded-full"
        style={{ background: "hsl(0 72% 55% / 0.12)", filter: "blur(160px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-40 h-[480px] w-[480px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.14)", filter: "blur(150px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -bottom-20 h-[340px] w-[600px] -translate-x-1/2 rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.14)", filter: "blur(150px)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <span className="section-label mx-auto">
            <Sparkles className="h-3 w-3" />
            {t("recognize.badge")}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("recognize.titleLine1")}{" "}
            <span className="gradient-text-purple">{t("recognize.titleHighlight")}</span>
            {t("recognize.titleLine3")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {t("recognize.lede")}
          </p>
        </motion.div>

        {/* Side-by-side comparison: chat mockup vs BetsPlug card */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* LEFT, fake tipster chat mockup */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <TipsterChatMockup />
            {/* Corner label */}
            <div className="absolute -top-3 left-4 z-10 flex items-center gap-1.5 rounded-full bg-red-500/25 px-3 py-1 ring-1 ring-red-400/50 backdrop-blur">
              <AlertTriangle className="h-3 w-3 text-red-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-200">
                {t("recognize.redFlagPatterns")}
              </span>
            </div>
          </motion.div>

          {/* RIGHT, BetsPlug alternative card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <BetsPlugCard />
            <div className="absolute -top-3 left-4 z-10 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 ring-1 ring-emerald-400/40 backdrop-blur">
              <CheckCircle2 className="h-3 w-3 text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                {t("recognize.whatBetsplugShows")}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Compact comparison rows below */}
        <div className="mt-14 grid gap-3 sm:grid-cols-2">
          <ComparisonRow
            icon={AlertTriangle}
            pain={t("recognize.painTipster")}
            answer={t("recognize.answerTipster")}
          />
          <ComparisonRow
            icon={Trash2}
            pain={t("recognize.painLosses")}
            answer={t("recognize.answerLosses")}
          />
          <ComparisonRow
            icon={Clock3}
            pain={t("recognize.painTiming")}
            answer={t("recognize.answerTiming")}
          />
          <ComparisonRow
            icon={Target}
            pain={t("recognize.painPrice")}
            answer={t("recognize.answerPrice")}
          />
        </div>

        {/* Bridge to solution */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <p className="text-center text-sm text-[#a3a9b8] sm:text-left">
            {t("recognize.bridge")}
          </p>
          <Link
            href={loc("/how-it-works")}
            className="btn-primary inline-flex items-center gap-2"
          >
            {t("recognize.bridgeCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   TipsterChatMockup, fake Telegram-style group chat
   ───────────────────────────────────────────────────────────── */

function TipsterChatMockup() {
  const { t } = useTranslations();
  const flagCopy: Record<"urgent" | "deleted" | "cherry", string> = {
    urgent: t("recognize.chat.flagUrgent"),
    cherry: t("recognize.chat.flagCherry"),
    deleted: t("recognize.chat.flagDeleted"),
  };

  const messages: {
    body: React.ReactNode;
    time: string;
    flag?: "urgent" | "deleted" | "cherry";
  }[] = [
    {
      body: (
        <>
          <div className="flex items-center gap-1 text-sm font-bold text-red-200">
            <Flame className="h-3.5 w-3.5 text-red-300" />
            {t("recognize.chat.surebetAlert")}
          </div>
          <p className="mt-1 text-base font-black text-white">
            {t("recognize.chat.betNow")}
          </p>
          <p className="mt-0.5 text-xs text-white/70">
            {t("recognize.chat.trustMe")}
          </p>
        </>
      ),
      time: t("recognize.chat.beforeKickoff"),
      flag: "urgent",
    },
    {
      body: (
        <>
          <p className="text-sm font-bold text-white">
            {t("recognize.chat.guaranteedProfit")}
          </p>
          <p className="mt-0.5 text-xs text-white/70">
            {t("recognize.chat.screenshotWinrate")}
          </p>
        </>
      ),
      time: t("recognize.chat.yesterday"),
      flag: "cherry",
    },
    {
      body: (
        <>
          <p className="text-sm italic text-white/40 line-through">
            {t("recognize.chat.messageDeleted")}
          </p>
          <p className="mt-0.5 text-[10px] text-white/50">
            {t("recognize.chat.lastNightLost")}
          </p>
        </>
      ),
      time: t("recognize.chat.twoDaysAgo"),
      flag: "deleted",
    },
    {
      body: (
        <>
          <p className="text-sm font-bold text-white">
            {t("recognize.chat.vipPremium")}
          </p>
          <p className="mt-0.5 text-xs text-white/70">
            {t("recognize.chat.sharedSheet")}
          </p>
        </>
      ),
      time: t("recognize.chat.mon"),
    },
  ];

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#14161c] to-[#0b0d13] shadow-2xl">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/30 text-lg ring-1 ring-red-400/30">
          🔥
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">
            VIP Football Tips 🔥🔥🔥
          </p>
          <p className="truncate text-[11px] text-white/50">
            {t("recognize.chat.memberStats")}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t("recognize.chat.online")}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 p-5">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.3 + i * 0.15 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-xs font-bold text-white/80">
              A
            </div>
            <div
              className={`flex-1 rounded-2xl rounded-tl-md px-4 py-3 ring-1 ${
                m.flag === "urgent"
                  ? "bg-red-500/15 ring-red-400/30"
                  : m.flag === "cherry"
                  ? "bg-amber-500/10 ring-amber-400/25"
                  : m.flag === "deleted"
                  ? "bg-white/[0.02] ring-white/10"
                  : "bg-white/[0.04] ring-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Admin
                </span>
                <span className="text-[10px] text-white/40">{m.time}</span>
              </div>
              <div className="mt-1.5">{m.body}</div>
              {m.flag && (
                <div className="mt-3 flex items-center gap-1.5 rounded-md bg-red-500/25 px-2 py-1 ring-1 ring-red-400/40">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-red-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-100">
                    {flagCopy[m.flag]}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chat footer: warning strip */}
      <div className="border-t border-red-500/20 bg-red-500/5 px-5 py-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-red-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {t("recognize.chat.footer")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BetsPlugCard, professional alternative mirror
   ───────────────────────────────────────────────────────────── */

function BetsPlugCard() {
  const { t, locale } = useTranslations();
  const rows: { label: string; value: string; tone: "home" | "draw" | "away" }[] = [
    { label: t("recognize.card.home"), value: "56%", tone: "home" },
    { label: t("recognize.card.draw"), value: "23%", tone: "draw" },
    { label: t("recognize.card.away"), value: "21%", tone: "away" },
  ];

  const models: { name: string; pick: string; confPct: number }[] = [
    { name: "Elo", pick: t("recognize.card.home"), confPct: 58 },
    { name: "Poisson", pick: t("recognize.card.home"), confPct: 54 },
    { name: "XGBoost", pick: t("recognize.card.home"), confPct: 61 },
    { name: "Ensemble", pick: t("recognize.card.home"), confPct: 65 },
  ];

  return (
    <div className="card-neon card-neon-green relative h-full overflow-hidden rounded-3xl">
      <div className="relative flex h-full flex-col p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <HexBadge variant="green" size="md">
            <ShieldCheck className="h-5 w-5" />
          </HexBadge>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4ade80]">
              {t("recognize.card.goldTierPick")}
            </p>
            <p className="truncate text-base font-bold text-[#ededed]">
              Leeds vs Wolves
            </p>
            <p className="text-[11px] text-[#6b7280]">
              Premier League · {t("recognize.card.kickoffTime")}
            </p>
          </div>
          <Pill tone="active" className="!text-[9px]">
            {t("recognize.card.preMatchLocked")}
          </Pill>
        </div>

        {/* Hero pick */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
              {t("recognize.card.ourPick")}
            </p>
            <p className="text-stat mt-1 text-3xl leading-none text-[#ededed]">
              {t("recognize.card.home")}
            </p>
            <p className="mt-1 text-[11px] text-[#a3a9b8]">Leeds</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4ade80]">
              {t("recognize.card.confidence")}
            </p>
            <p className="text-stat mt-1 text-3xl leading-none text-[#4ade80]">
              65%
            </p>
            <p className="mt-1 text-[11px] text-[#a3a9b8]">
              {t("recognize.card.thresholdGold")}
            </p>
          </div>
        </div>

        {/* Probability breakdown */}
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            {t("recognize.card.winProbBreakdown")}
          </p>
          <div className="mt-3 space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-14 text-[11px] font-semibold text-[#a3a9b8]">
                  {r.label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${
                      r.tone === "home"
                        ? "bg-gradient-to-r from-emerald-500 to-green-400"
                        : r.tone === "draw"
                        ? "bg-gradient-to-r from-slate-500 to-slate-400"
                        : "bg-gradient-to-r from-purple-500 to-purple-400"
                    }`}
                    style={{ width: r.value }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-bold tabular-nums text-[#ededed]">
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Model consensus */}
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              {t("recognize.card.modelConsensus")}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
              <CheckCircle2 className="h-3 w-3" />
              4 / 4 {t("recognize.card.agree")}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {models.map((m) => (
              <div key={m.name} className="flex items-center gap-2.5">
                <span className="w-20 text-[11px] font-semibold text-[#a3a9b8]">
                  {m.name}
                </span>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                </span>
                <span className="w-12 text-[11px] font-semibold text-[#ededed]">
                  {m.pick}
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-green-400"
                    style={{ width: `${m.confPct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[10px] tabular-nums text-[#a3a9b8]">
                  {m.confPct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Signals */}
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            {t("recognize.card.keySignals")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {[
              t("recognize.card.signal1"),
              t("recognize.card.signal2"),
              t("recognize.card.signal3"),
              t("recognize.card.signal4"),
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-[#a3a9b8]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Track-record tag */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-gradient-to-r from-emerald-500/[0.08] to-transparent p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              {t("recognize.card.historicalGold")}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#a3a9b8]">
              {t("recognize.card.historicalBody", {
                accuracy:
                  locale === "nl"
                    ? POTD_STATS.accuracyNL
                    : POTD_STATS.accuracy,
                totalPicks: POTD_STATS.totalPicks,
              })}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#6b7280]">
              {t("recognize.card.timing")}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#ededed]">
              {t("recognize.card.preMatch")}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#6b7280]">
              {t("recognize.card.tier")}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#4ade80]">
              <Crown className="h-3 w-3" />
              Gold
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#6b7280]">
              {t("recognize.card.result")}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#ededed]">
              {t("recognize.card.autoGraded")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ComparisonRow, compact pain → answer row
   ───────────────────────────────────────────────────────────── */

function ComparisonRow({
  icon: Icon,
  pain,
  answer,
}: {
  icon: typeof AlertTriangle;
  pain: string;
  answer: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-300 ring-1 ring-red-400/20">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 truncate text-sm italic text-[#a3a9b8]">
        {pain}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#6b7280]" />
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/25">
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-sm font-semibold text-[#ededed]">
        {answer}
      </div>
    </motion.div>
  );
}
