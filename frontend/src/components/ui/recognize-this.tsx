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
  const { locale } = useTranslations();
  const loc = useLocalizedHref();
  const isNl = locale === "nl";

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
            {isNl ? "Herken je dit?" : "Sound familiar?"}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {isNl ? (
              <>
                Je hebt het{" "}
                <span className="gradient-text-purple">al eerder geprobeerd</span>
                . En het werd niet beter.
              </>
            ) : (
              <>
                You've{" "}
                <span className="gradient-text-purple">been here before</span>
                . And it didn't get better.
              </>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {isNl
              ? "Zie je dit wel eens voorbij komen? Groepen met 'gegarandeerde' winrates, tips die pas binnenkomen als je er niks meer mee kan, en screenshots waar alle verliezen op mysterieuze wijze ontbreken."
              : "Seen any of this? Groups with 'guaranteed' hit rates, tips that drop when there's nothing left to do, and screenshots where every loss has mysteriously vanished."}
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
            <TipsterChatMockup isNl={isNl} />
            {/* Corner label */}
            <div className="absolute -top-3 left-4 z-10 flex items-center gap-1.5 rounded-full bg-red-500/25 px-3 py-1 ring-1 ring-red-400/50 backdrop-blur">
              <AlertTriangle className="h-3 w-3 text-red-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-200">
                {isNl ? "Red flag patronen" : "Red flag patterns"}
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
            <BetsPlugCard isNl={isNl} />
            <div className="absolute -top-3 left-4 z-10 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 ring-1 ring-emerald-400/40 backdrop-blur">
              <CheckCircle2 className="h-3 w-3 text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                {isNl ? "Wat BetsPlug toont" : "What BetsPlug shows"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Compact comparison rows below */}
        <div className="mt-14 grid gap-3 sm:grid-cols-2">
          <ComparisonRow
            icon={AlertTriangle}
            pain={isNl ? "'Bet on Madrid, trust me'" : "'Bet on Madrid, trust me'"}
            answer={isNl ? "Win% + betrouwbaarheid + 4 AI-modellen" : "Win% + confidence + 4 AI models"}
          />
          <ComparisonRow
            icon={Trash2}
            pain={isNl ? "Verliezen stil verdwenen" : "Losses quietly removed"}
            answer={isNl ? "Elke winst én verlies blijft openbaar staan" : "Every win and loss stays public forever"}
          />
          <ComparisonRow
            icon={Clock3}
            pain={isNl ? "Tip 5 min voor aftrap" : "Tip 5 min before kickoff"}
            answer={isNl ? "Uren van tevoren gepubliceerd" : "Published hours in advance"}
          />
          <ComparisonRow
            icon={Target}
            pain={isNl ? "€100/maand voor een Excel" : "€100/month for a spreadsheet"}
            answer={isNl ? "3 picks per dag gratis. €0,01 trial." : "3 picks per day free. €0.01 trial."}
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
            {isNl
              ? "Daarom bouwden we BetsPlug precies het omgekeerde."
              : "That's why we built BetsPlug as the opposite."}
          </p>
          <Link
            href={loc("/how-it-works")}
            className="btn-primary inline-flex items-center gap-2"
          >
            {isNl ? "Hoe we het anders doen" : "How we do it differently"}
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

function TipsterChatMockup({ isNl }: { isNl: boolean }) {
  const flagCopy: Record<"urgent" | "deleted" | "cherry", string> = isNl
    ? {
        urgent: "Red flag: te laat om te acteren",
        cherry: "Red flag: geen verliezen zichtbaar",
        deleted: "Red flag: verlies stilletjes gewist",
      }
    : {
        urgent: "Red flag: too late to act",
        cherry: "Red flag: no losses shown",
        deleted: "Red flag: loss quietly removed",
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
            {isNl ? "🔥🔥 SUREBET ALERT 🔥🔥" : "🔥🔥 SUREBET ALERT 🔥🔥"}
          </div>
          <p className="mt-1 text-base font-black text-white">
            {isNl ? "BET MADRID WIN NOW" : "BET MADRID WIN NOW"}
          </p>
          <p className="mt-0.5 text-xs text-white/70">
            {isNl ? "trust me 💯" : "trust me 💯"}
          </p>
        </>
      ),
      time: isNl ? "5 min voor aftrap" : "5 min before kickoff",
      flag: "urgent",
    },
    {
      body: (
        <>
          <p className="text-sm font-bold text-white">
            {isNl ? "💰 GUARANTEED PROFIT TONIGHT 💰" : "💰 GUARANTEED PROFIT TONIGHT 💰"}
          </p>
          <p className="mt-0.5 text-xs text-white/70">
            {isNl ? "Screenshot: 95% winrate deze maand 📊" : "Screenshot: 95% winrate this month 📊"}
          </p>
        </>
      ),
      time: isNl ? "gisteren" : "yesterday",
      flag: "cherry",
    },
    {
      body: (
        <>
          <p className="text-sm italic text-white/40 line-through">
            {isNl ? "[bericht verwijderd]" : "[message deleted]"}
          </p>
          <p className="mt-0.5 text-[10px] text-white/50">
            {isNl ? "(gisteravond, verloren)" : "(last night, lost)"}
          </p>
        </>
      ),
      time: isNl ? "eergisteren" : "2 days ago",
      flag: "deleted",
    },
    {
      body: (
        <>
          <p className="text-sm font-bold text-white">
            {isNl ? "VIP Premium €100/maand" : "VIP Premium €100/month"}
          </p>
          <p className="mt-0.5 text-xs text-white/70">
            {isNl ? "→ toegang tot gedeelde sheet" : "→ access to shared sheet"}
          </p>
        </>
      ),
      time: isNl ? "ma" : "Mon",
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
            {isNl ? "3.247 leden · 92% winrate" : "3,247 members · 92% hit rate"}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {isNl ? "Online" : "Online"}
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
            {isNl
              ? "Geen cijfers. Geen uitleg. Geen trackrecord."
              : "No stats. No reasoning. No track record."}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BetsPlugCard, professional alternative mirror
   ───────────────────────────────────────────────────────────── */

function BetsPlugCard({ isNl }: { isNl: boolean }) {
  const rows: { label: string; value: string; tone: "home" | "draw" | "away" }[] = [
    { label: isNl ? "Thuis" : "Home", value: "56%", tone: "home" },
    { label: isNl ? "Gelijk" : "Draw", value: "23%", tone: "draw" },
    { label: isNl ? "Uit" : "Away", value: "21%", tone: "away" },
  ];

  const models: { name: string; pick: string; confPct: number }[] = [
    { name: "Elo", pick: isNl ? "Thuis" : "Home", confPct: 58 },
    { name: "Poisson", pick: isNl ? "Thuis" : "Home", confPct: 54 },
    { name: "XGBoost", pick: isNl ? "Thuis" : "Home", confPct: 61 },
    { name: "Ensemble", pick: isNl ? "Thuis" : "Home", confPct: 65 },
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
              {isNl ? "Gold-tier pick" : "Gold-tier pick"}
            </p>
            <p className="truncate text-base font-bold text-[#ededed]">
              Leeds vs Wolves
            </p>
            <p className="text-[11px] text-[#6b7280]">
              Premier League · {isNl ? "za 16:00" : "Sat 16:00"}
            </p>
          </div>
          <Pill tone="active" className="!text-[9px]">
            {isNl ? "Pre-match locked" : "Pre-match locked"}
          </Pill>
        </div>

        {/* Hero pick */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
              {isNl ? "Onze pick" : "Our pick"}
            </p>
            <p className="text-stat mt-1 text-3xl leading-none text-[#ededed]">
              {isNl ? "Thuis" : "Home"}
            </p>
            <p className="mt-1 text-[11px] text-[#a3a9b8]">Leeds</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4ade80]">
              {isNl ? "Vertrouwen" : "Confidence"}
            </p>
            <p className="text-stat mt-1 text-3xl leading-none text-[#4ade80]">
              65%
            </p>
            <p className="mt-1 text-[11px] text-[#a3a9b8]">
              {isNl ? "≥ 70% drempel · Gold" : "≥ 70% threshold · Gold"}
            </p>
          </div>
        </div>

        {/* Probability breakdown */}
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            {isNl ? "Winkansen per uitkomst" : "Win probability breakdown"}
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
              {isNl ? "Model-consensus" : "Model consensus"}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
              <CheckCircle2 className="h-3 w-3" />
              4 / 4 {isNl ? "eens" : "agree"}
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
            {isNl ? "Belangrijkste signalen" : "Key signals"}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {(isNl
              ? ["Elo +14 thuis", "Vorm 3W-1L", "H2H 2-1-0", "xG 1,8 vs 1,2"]
              : ["Elo +14 home", "Form 3W-1L", "H2H 2-1-0", "xG 1.8 vs 1.2"]
            ).map((chip) => (
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
              {isNl ? "Historisch · Gold-tier" : "Historical · Gold tier"}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#a3a9b8]">
              {isNl
                ? `${POTD_STATS.accuracyNL}% raak over ${POTD_STATS.totalPicks} beoordeelde Gold-picks. Openbaar, niets verwijderd.`
                : `${POTD_STATS.accuracy}% hit rate across ${POTD_STATS.totalPicks} graded Gold picks. Public, nothing deleted.`}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#6b7280]">
              {isNl ? "Timing" : "Timing"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#ededed]">
              {isNl ? "Pre-match" : "Pre-match"}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#6b7280]">
              {isNl ? "Tier" : "Tier"}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#4ade80]">
              <Crown className="h-3 w-3" />
              Gold
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#6b7280]">
              {isNl ? "Resultaat" : "Result"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#ededed]">
              {isNl ? "Automatisch" : "Auto-graded"}
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
