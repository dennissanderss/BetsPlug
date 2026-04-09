"use client";

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

/**
 * Track Record page — dedicated deep-dive on how BetsPlug's results
 * are produced, audited, and used in practice. Shares the sitewide
 * dark/green design language with motion-driven reveals.
 */
export function TrackRecordContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");

  const kpis = [
    {
      icon: Percent,
      value: t("tr.kpi1Value"),
      label: t("tr.kpi1Label"),
      note: t("tr.kpi1Note"),
    },
    {
      icon: TrendingUp,
      value: t("tr.kpi2Value"),
      label: t("tr.kpi2Label"),
      note: t("tr.kpi2Note"),
    },
    {
      icon: Hash,
      value: t("tr.kpi3Value"),
      label: t("tr.kpi3Label"),
      note: t("tr.kpi3Note"),
    },
    {
      icon: Gauge,
      value: t("tr.kpi4Value"),
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
    <div className="min-h-screen overflow-x-hidden bg-[#080b14] text-white">
      {/* Shared site navigation */}
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-green-500/[0.08] blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(74,222,128,0.8) 0 1px, transparent 1px 22px)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400"
          >
            <ShieldCheck className="h-3 w-3" />
            {t("tr.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-balance break-words text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {t("tr.heroTitleA")}
            <br />
            <span className="gradient-text">{t("tr.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
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
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm font-bold text-white ring-1 ring-white/[0.1] transition-all hover:bg-white/[0.08] hover:ring-green-500/40"
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
            <Link href={home} className="transition-colors hover:text-green-400">
              {t("tr.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">{t("tr.breadcrumbTrack")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HEADLINE KPIs
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent py-20">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("tr.kpisBadge")}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t("tr.kpisTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("tr.kpisSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-[140px] w-[140px] rounded-full bg-green-500/[0.06] blur-[70px] transition-all group-hover:bg-green-500/[0.14]" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight text-white">
                      {k.value}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-300">
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
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("tr.pipeBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("tr.pipeTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
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
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                  >
                    <div className="pointer-events-none absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-green-500/[0.06] blur-[90px] transition-all group-hover:bg-green-500/[0.14]" />
                    <div className="relative">
                      <div className="mb-5 flex items-center gap-3">
                        <span className="font-mono text-xs font-bold uppercase tracking-widest text-green-400">
                          Step {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-r from-green-500/30 to-transparent" />
                      </div>
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.2)] ring-1 ring-green-500/30">
                        <Icon className="h-5 w-5 text-green-400" />
                      </div>
                      <h3 className="mb-3 text-xl font-extrabold tracking-tight text-white">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-400">
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
      <section className="relative border-y border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("tr.methodBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("tr.methodTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
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
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-green-500/[0.06] blur-[80px] transition-all group-hover:bg-green-500/[0.12]" />
                  <div className="relative flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.2)] ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-extrabold tracking-tight text-white">
                        {m.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-400">
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
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("tr.casesBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("tr.casesTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
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
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-8 transition-all hover:border-green-500/30"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-green-500/[0.06] blur-[100px] transition-all group-hover:bg-green-500/[0.14]" />

                <div className="relative flex flex-1 flex-col">
                  {/* Persona header */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/25 to-emerald-500/10 shadow-[0_0_30px_rgba(74,222,128,0.25)] ring-1 ring-green-500/30">
                      <span className="text-xl font-extrabold text-green-400">
                        {c.initial}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-green-400">
                        {c.role}
                      </p>
                      <h3 className="text-lg font-extrabold tracking-tight text-white">
                        {c.name}
                      </h3>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="relative mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <Quote className="absolute -top-2 left-4 h-4 w-4 rotate-180 text-green-400/60" />
                    <p className="text-sm leading-relaxed text-slate-300">
                      “{c.quote}”
                    </p>
                  </div>

                  {/* Metrics grid */}
                  <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    {c.metrics.map((m) => (
                      <div key={m.label} className="text-center">
                        <div className="text-base font-extrabold tracking-tight text-green-400 sm:text-lg">
                          {m.value}
                        </div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider leading-tight text-slate-500">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Outcome */}
                  <div className="mt-auto flex items-start gap-2 border-t border-white/[0.06] pt-5">
                    <Trophy className="h-4 w-4 shrink-0 translate-y-0.5 text-green-400" />
                    <p className="text-xs leading-relaxed text-slate-400">
                      {c.outcome}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

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
            className="relative overflow-hidden rounded-3xl border border-green-500/30 bg-gradient-to-br from-[#0d2319] via-[#0a1a13] to-[#050f09] p-10 text-center shadow-2xl shadow-green-500/[0.15] sm:p-14"
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full bg-green-500/[0.18] blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-[360px] w-[360px] rounded-full bg-emerald-500/[0.14] blur-[120px]" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-500/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-300">
                <Sparkles className="h-3 w-3" />
                {t("tr.transBadge")}
              </div>
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("tr.transTitle")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {t("tr.transSubtitle")}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`${home}#track-record`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-7 py-3.5 text-sm font-extrabold tracking-tight text-white ring-1 ring-white/[0.14] transition-all hover:bg-white/[0.1] hover:ring-green-500/40"
                >
                  {t("tr.transCta1")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`${home}#pricing`}
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 sm:text-base"
                >
                  {t("tr.transCta2")}
                  <ArrowRight className="h-4 w-4" />
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
