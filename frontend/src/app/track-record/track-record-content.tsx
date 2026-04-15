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
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

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

const KPI_VARIANTS = ["green", "purple", "blue", "green"] as const;
const PIPELINE_VARIANTS = ["green", "purple", "blue", "green", "purple", "blue"] as const;

type Accent = "green" | "purple" | "blue";

/**
 * Track Record — NOCTURNE rebuild.
 */
export function TrackRecordContent({ faqSlot, trackRecordPage }: { faqSlot?: React.ReactNode; trackRecordPage?: any }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");
  const live = useLiveTrackRecordStats();

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

      {/* ───────────── KPIs ───────────── */}
      <section className="relative py-20 md:py-28">
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
              {t("tr.kpisBadge")}
            </span>
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("tr.kpisTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">
              {t("tr.kpisSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              const variant = KPI_VARIANTS[i % KPI_VARIANTS.length] as Accent;
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
                    <HexBadge variant={variant} size="md" className="mb-4">
                      <Icon className="h-5 w-5" />
                    </HexBadge>
                    <div className="text-stat text-4xl text-[#ededed]">{k.value}</div>
                    <p className="mt-2 text-sm font-semibold text-[#ededed]">{k.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">{k.note}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── PIPELINE ───────────── */}
      <section className="relative py-20 md:py-28">
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
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
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
      <section className="relative py-20 md:py-28">
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
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
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
      <section className="relative py-20 md:py-28">
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
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
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

                  <div className="glass-panel mb-6 grid grid-cols-3 gap-2 rounded-2xl p-4">
                    {c.metrics.map((m) => (
                      <div key={m.label} className="text-center">
                        <div className="text-stat text-base text-[#4ade80] sm:text-lg">
                          {m.value}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-wider leading-tight text-[#a3a9b8]">
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
      <section className="relative py-20 md:py-28">
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

            <div className="relative p-10 md:p-16">
              <span className="section-label mb-6 inline-flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {t("tr.transBadge")}
              </span>
              <h2 className="text-display text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
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
