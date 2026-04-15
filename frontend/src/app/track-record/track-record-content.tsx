"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
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
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/* ── Live API data hook ─────────────────────────────────── */
interface LiveStats {
  totalPredictions: number | null;
  accuracy: number | null;
  brierScore: number | null;
  botdTotal: number | null;
  botdAccuracy: number | null;
}

function useLiveTrackRecordStats(): LiveStats {
  const [stats, setStats] = useState<LiveStats>({
    totalPredictions: null,
    accuracy: null,
    brierScore: null,
    botdTotal: null,
    botdAccuracy: null,
  });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    // Fetch both endpoints in parallel
    Promise.allSettled([
      fetch(`${API}/trackrecord/summary`).then((r) => r.json()),
      fetch(`${API}/bet-of-the-day/track-record`).then((r) => r.json()),
    ]).then(([summaryResult, botdResult]) => {
      const next: LiveStats = { ...stats };
      if (summaryResult.status === "fulfilled" && summaryResult.value) {
        const s = summaryResult.value;
        next.totalPredictions = s.total_predictions ?? null;
        next.accuracy = s.accuracy ?? null;
        next.brierScore = s.brier_score ?? s.avg_brier_score ?? null;
      }
      if (botdResult.status === "fulfilled" && botdResult.value) {
        const b = botdResult.value;
        next.botdTotal = b.total ?? b.total_picks ?? null;
        next.botdAccuracy = b.accuracy ?? b.win_rate ?? null;
      }
      setStats(next);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return stats;
}

/**
 * Track Record page — dedicated deep-dive on how BetsPlug's results
 * are produced, audited, and used in practice. Shares the sitewide
 * dark/green design language with motion-driven reveals.
 */
export function TrackRecordContent({ faqSlot, trackRecordPage }: { faqSlot?: React.ReactNode; trackRecordPage?: any }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");
  const live = useLiveTrackRecordStats();

  // Build KPIs: prefer live API data, fall back to i18n static values
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
    {
      icon: TrendingUp,
      value:
        live.botdAccuracy != null
          ? `${(live.botdAccuracy * 100).toFixed(1)}%`
          : t("tr.kpi2Value"),
      label:
        live.botdAccuracy != null
          ? `Pick of the Day accuracy (${live.botdTotal ?? "..."} picks)`
          : t("tr.kpi2Label"),
      note: t("tr.kpi2Note"),
    },
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
    {
      icon: Database,
      title: t("tr.pipe1Title"),
      desc: t("tr.pipe1Desc"),
    },
    {
      icon: Filter,
      title: t("tr.pipe2Title"),
      desc: t("tr.pipe2Desc"),
    },
    {
      icon: Sliders,
      title: t("tr.pipe3Title"),
      desc: t("tr.pipe3Desc"),
    },
    {
      icon: Layers,
      title: t("tr.pipe4Title"),
      desc: t("tr.pipe4Desc"),
    },
    {
      icon: Target,
      title: t("tr.pipe5Title"),
      desc: t("tr.pipe5Desc"),
    },
    {
      icon: CheckCircle2,
      title: t("tr.pipe6Title"),
      desc: t("tr.pipe6Desc"),
    },
  ];

  const methodology = [
    {
      icon: Activity,
      title: t("tr.method1Title"),
      desc: t("tr.method1Desc"),
    },
    {
      icon: LineChart,
      title: t("tr.method2Title"),
      desc: t("tr.method2Desc"),
    },
    {
      icon: Lock,
      title: t("tr.method3Title"),
      desc: t("tr.method3Desc"),
    },
    {
      icon: Eye,
      title: t("tr.method4Title"),
      desc: t("tr.method4Desc"),
    },
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
    <div className="min-h-screen overflow-x-hidden bg-background text-slate-900">
      {/* Shared site navigation */}
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-40 pb-16 md:pt-48 md:pb-20">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-green-500/[0.04] blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(74,222,128,0.4) 0 1px, transparent 1px 22px)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-600"
          >
            <ShieldCheck className="h-3 w-3" />
            {t("tr.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-balance break-words text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
          >
            {t("tr.heroTitleA")}
            <br />
            <span className="gradient-text">{t("tr.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            {t("tr.heroSubtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href={`${home}#track-record`}
              className="btn-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/20"
            >
              {t("tr.heroCtaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={home}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-green-500/40"
            >
              {t("tr.heroCtaSecondary")}
            </Link>
          </motion.div>

          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            aria-label="Breadcrumb"
            className="mt-10 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            <Link href={home} className="transition-colors hover:text-green-600">
              {t("tr.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">{t("tr.breadcrumbTrack")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HEADLINE KPIs
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-slate-200 bg-gradient-to-b from-white to-slate-50 py-20">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-600">
              {t("tr.kpisBadge")}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {t("tr.kpisTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              {t("tr.kpisSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-[140px] w-[140px] rounded-full bg-green-50 blur-[70px] transition-all group-hover:bg-green-100" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {k.value}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {k.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {k.note}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          DATA PIPELINE — how data is processed
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-600">
              {t("tr.pipeBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {t("tr.pipeTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              {t("tr.pipeSubtitle")}
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting vertical line on md+ */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-green-500/20 to-transparent md:block"
            />

            <div className="grid gap-5 md:grid-cols-2">
              {pipeline.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
                  >
                    <div className="pointer-events-none absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-green-50 blur-[90px] transition-all group-hover:bg-green-100" />
                    <div className="relative">
                      <div className="mb-5 flex items-center gap-3">
                        <span className="font-mono text-xs font-bold uppercase tracking-widest text-green-600">
                          Step {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-r from-green-500/30 to-transparent" />
                      </div>
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 shadow-sm ring-1 ring-green-500/30">
                        <Icon className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="mb-3 text-xl font-extrabold tracking-tight text-slate-900">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          METHODOLOGY PRINCIPLES
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-slate-200 bg-gradient-to-b from-white to-slate-50 py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-600">
              {t("tr.methodBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {t("tr.methodTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              {t("tr.methodSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {methodology.map((m) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-green-50 blur-[80px] transition-all group-hover:bg-green-100" />
                  <div className="relative flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 shadow-sm ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-extrabold tracking-tight text-slate-900">
                        {m.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          USE CASES
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-600">
              {t("tr.casesBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {t("tr.casesTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              {t("tr.casesSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {cases.map((c) => (
              <motion.article
                key={c.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-green-50 blur-[100px] transition-all group-hover:bg-green-100" />

                <div className="relative flex flex-1 flex-col">
                  {/* Persona header */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 shadow-sm ring-1 ring-green-500/30">
                      <span className="text-xl font-extrabold text-green-600">
                        {c.initial}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-green-600">
                        {c.role}
                      </p>
                      <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                        {c.name}
                      </h3>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="relative mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <Quote className="absolute -top-2 left-4 h-4 w-4 rotate-180 text-green-500/60" />
                    <p className="text-sm leading-relaxed text-slate-600">
                      “{c.quote}”
                    </p>
                  </div>

                  {/* Metrics grid */}
                  <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {c.metrics.map((m) => (
                      <div key={m.label} className="text-center">
                        <div className="text-base font-extrabold tracking-tight text-green-600 sm:text-lg">
                          {m.value}
                        </div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider leading-tight text-slate-500">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Outcome */}
                  <div className="mt-auto flex items-start gap-2 border-t border-slate-200 pt-5">
                    <Trophy className="h-4 w-4 shrink-0 translate-y-0.5 text-green-600" />
                    <p className="text-xs leading-relaxed text-slate-500">
                      {c.outcome}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {faqSlot}

      {/* ═══════════════════════════════════════════════════════════════════
          TRANSPARENCY CTA BANNER
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pb-24 pt-4">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden stripe-lime p-10 md:p-16"
          >
            <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute left-0 bottom-0 h-4 w-4 border-l-2 border-b-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 bottom-0 h-4 w-4 border-r-2 border-b-2 border-[#050505]" />

            <div className="relative">
              <span className="mb-6 inline-flex items-center gap-2 bg-[#050505] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                <Sparkles className="h-3 w-3" />
                {t("tr.transBadge")}
              </span>
              <h2 className="text-display text-3xl text-[#050505] sm:text-4xl lg:text-5xl">
                {t("tr.transTitle")}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#050505]/80">
                {t("tr.transSubtitle")}
              </p>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href={`${home}#pricing`}
                  className="inline-flex items-center gap-2 bg-[#050505] px-8 py-4 text-xs font-black uppercase tracking-widest text-[#4ade80] transition-colors hover:bg-[#1a1a1a]"
                >
                  {String(t("tr.transCta2")).toUpperCase()} →
                </Link>
                <Link
                  href={`${home}#track-record`}
                  className="inline-flex items-center gap-2 border-b-2 border-[#050505] pb-1 text-xs font-black uppercase tracking-widest text-[#050505] transition-colors hover:border-white hover:text-white"
                >
                  {String(t("tr.transCta1")).toUpperCase()} →
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
