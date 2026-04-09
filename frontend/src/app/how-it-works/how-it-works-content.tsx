"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Database,
  Filter,
  Sliders,
  Layers,
  Target,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Zap,
  Eye,
  Lock,
  Gauge,
  Activity,
  Users,
  Trophy,
  TrendingUp,
  GitBranch,
  CircleCheck,
  LineChart as LineChartIcon,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * How It Works — dedicated deep-dive on the BetsPlug prediction
 * engine. Designed to eliminate every reasonable objection a
 * serious analyst might have. Uses the sitewide dark/green design
 * language, motion reveals, and stays readable as a long scroll.
 */
export function HowItWorksContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");

  const heroStats = [
    { value: "3", label: t("hiw.heroStatDataSources") },
    { value: "6", label: t("hiw.heroStatLeagues") },
    { value: "3", label: t("hiw.heroStatModels") },
    { value: "6h", label: t("hiw.heroStatUpdates") },
  ];

  const overview = [
    { icon: Database, title: t("hiw.s1Badge") },
    { icon: Filter, title: t("hiw.s2Badge") },
    { icon: Sliders, title: t("hiw.s3Badge") },
    { icon: Layers, title: t("hiw.s4Badge") },
    { icon: Target, title: t("hiw.s5Badge") },
    { icon: CheckCircle2, title: t("hiw.s6Badge") },
    { icon: RefreshCw, title: t("hiw.s7Badge") },
  ];

  const featureFamilies = [
    {
      icon: TrendingUp,
      title: t("hiw.s3Family1Title"),
      desc: t("hiw.s3Family1Desc"),
    },
    {
      icon: Activity,
      title: t("hiw.s3Family2Title"),
      desc: t("hiw.s3Family2Desc"),
    },
    {
      icon: GitBranch,
      title: t("hiw.s3Family3Title"),
      desc: t("hiw.s3Family3Desc"),
    },
    {
      icon: LineChartIcon,
      title: t("hiw.s3Family4Title"),
      desc: t("hiw.s3Family4Desc"),
    },
    {
      icon: Users,
      title: t("hiw.s3Family5Title"),
      desc: t("hiw.s3Family5Desc"),
    },
    {
      icon: ShieldCheck,
      title: t("hiw.s3Family6Title"),
      desc: t("hiw.s3Family6Desc"),
    },
  ];

  const models = [
    {
      name: t("hiw.s4Model1Name"),
      desc: t("hiw.s4Model1Desc"),
    },
    {
      name: t("hiw.s4Model2Name"),
      desc: t("hiw.s4Model2Desc"),
    },
    {
      name: t("hiw.s4Model3Name"),
      desc: t("hiw.s4Model3Desc"),
    },
  ];

  const proofs = [
    { icon: Lock, title: t("hiw.proof1Title"), desc: t("hiw.proof1Desc") },
    { icon: Layers, title: t("hiw.proof2Title"), desc: t("hiw.proof2Desc") },
    { icon: Target, title: t("hiw.proof3Title"), desc: t("hiw.proof3Desc") },
    { icon: Eye, title: t("hiw.proof4Title"), desc: t("hiw.proof4Desc") },
    { icon: RefreshCw, title: t("hiw.proof5Title"), desc: t("hiw.proof5Desc") },
    { icon: Zap, title: t("hiw.proof6Title"), desc: t("hiw.proof6Desc") },
  ];

  const faqs = [
    { q: t("hiw.faq1Q"), a: t("hiw.faq1A") },
    { q: t("hiw.faq2Q"), a: t("hiw.faq2A") },
    { q: t("hiw.faq3Q"), a: t("hiw.faq3A") },
    { q: t("hiw.faq4Q"), a: t("hiw.faq4A") },
    { q: t("hiw.faq5Q"), a: t("hiw.faq5A") },
    { q: t("hiw.faq6Q"), a: t("hiw.faq6A") },
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

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400"
          >
            <Sparkles className="h-3 w-3" />
            {t("hiw.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-balance break-words text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {t("hiw.heroTitleA")}
            <br />
            <span className="gradient-text">{t("hiw.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            {t("hiw.heroSubtitle")}
          </motion.p>

          {/* Hero KPI strip */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 backdrop-blur-sm"
              >
                <div className="text-2xl font-extrabold tracking-tight text-green-400 sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider leading-tight text-slate-500">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href={`${home}#pricing`}
              className="btn-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/20"
            >
              {t("hiw.heroCtaSecondary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={loc("/track-record")}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm font-bold text-white ring-1 ring-white/[0.1] transition-all hover:bg-white/[0.08] hover:ring-green-500/40"
            >
              {t("hiw.heroCtaPrimary")}
            </Link>
          </motion.div>

          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            aria-label="Breadcrumb"
            className="mt-10 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            <Link href={home} className="transition-colors hover:text-green-400">
              {t("hiw.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">{t("hiw.breadcrumbHow")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          OVERVIEW — 7-stage strip
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent py-16 md:py-20">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-10 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("hiw.overviewBadge")}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t("hiw.overviewTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("hiw.overviewSubtitle")}
            </p>
          </motion.div>

          <motion.ol
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"
          >
            {overview.map((o, i) => {
              const Icon = o.icon;
              return (
                <li
                  key={o.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/15 ring-1 ring-green-500/30">
                    <Icon className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-xs font-bold leading-tight text-white">
                    {o.title.split("·")[1]?.trim() ?? o.title}
                  </div>
                </li>
              );
            })}
          </motion.ol>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STAGE 1 — Data acquisition
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        badge={t("hiw.s1Badge")}
        title={t("hiw.s1Title")}
        lead={t("hiw.s1Lead")}
        paragraphs={[t("hiw.s1P1"), t("hiw.s1P2")]}
        side={
          <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-[#0d1624] via-[#0a1220] to-[#060912] p-8 shadow-2xl shadow-green-500/[0.08]">
            <div className="pointer-events-none absolute -left-20 -top-20 h-[250px] w-[250px] rounded-full bg-green-500/[0.12] blur-[100px]" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(74,222,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                  Live ingestion
                </span>
              </div>
              <StagePoint
                icon={Database}
                title={t("hiw.s1Point1Title")}
                desc={t("hiw.s1Point1Desc")}
              />
              <StagePoint
                icon={RefreshCw}
                title={t("hiw.s1Point2Title")}
                desc={t("hiw.s1Point2Desc")}
              />
              <StagePoint
                icon={Lock}
                title={t("hiw.s1Point3Title")}
                desc={t("hiw.s1Point3Desc")}
              />
            </div>
          </div>
        }
        stageNumber={1}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STAGE 2 — Cleaning
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        reverse
        badge={t("hiw.s2Badge")}
        title={t("hiw.s2Title")}
        lead={t("hiw.s2Lead")}
        paragraphs={[t("hiw.s2P1"), t("hiw.s2P2")]}
        side={
          <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-[#0d1624] via-[#0a1220] to-[#060912] p-8 shadow-2xl shadow-green-500/[0.08]">
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-[250px] w-[250px] rounded-full bg-emerald-500/[0.10] blur-[100px]" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-2">
                <Filter className="h-4 w-4 text-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                  {t("hiw.s2BulletsTitle")}
                </span>
              </div>
              <ul className="space-y-3">
                {[
                  t("hiw.s2Bullet1"),
                  t("hiw.s2Bullet2"),
                  t("hiw.s2Bullet3"),
                  t("hiw.s2Bullet4"),
                  t("hiw.s2Bullet5"),
                ].map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <CircleCheck className="h-4 w-4 shrink-0 translate-y-0.5 text-green-400" />
                    <span className="text-sm leading-snug text-slate-300">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
        stageNumber={2}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STAGE 3 — Feature engineering
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        badge={t("hiw.s3Badge")}
        title={t("hiw.s3Title")}
        lead={t("hiw.s3Lead")}
        paragraphs={[t("hiw.s3P1"), t("hiw.s3P2")]}
        side={
          <div className="grid grid-cols-2 gap-3">
            {featureFamilies.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full bg-green-500/[0.06] blur-[60px] transition-all group-hover:bg-green-500/[0.14]" />
                  <div className="relative">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/15 ring-1 ring-green-500/30">
                      <Icon className="h-4 w-4 text-green-400" />
                    </div>
                    <h4 className="text-xs font-bold text-white">{f.title}</h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        }
        stageNumber={3}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STAGE 4 — Model ensemble
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        reverse
        badge={t("hiw.s4Badge")}
        title={t("hiw.s4Title")}
        lead={t("hiw.s4Lead")}
        paragraphs={[t("hiw.s4P1")]}
        side={
          <div className="space-y-3">
            {models.map((m, i) => (
              <div
                key={m.name}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-[140px] w-[140px] rounded-full bg-green-500/[0.06] blur-[70px] transition-all group-hover:bg-green-500/[0.14]" />
                <div className="relative flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
                    <span className="font-mono text-xs font-bold text-green-400">
                      M{i + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-bold text-white">
                      {m.name}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {m.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/[0.12] to-emerald-500/[0.06] p-5">
              <div className="pointer-events-none absolute -right-10 -top-10 h-[200px] w-[200px] rounded-full bg-green-500/[0.14] blur-[80px]" />
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-green-300" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-300">
                    {t("hiw.s4BlendTitle")}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  {t("hiw.s4BlendDesc")}
                </p>
              </div>
            </div>
          </div>
        }
        stageNumber={4}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STAGE 5 — Value detection
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        badge={t("hiw.s5Badge")}
        title={t("hiw.s5Title")}
        lead={t("hiw.s5Lead")}
        paragraphs={[t("hiw.s5P1"), t("hiw.s5P2")]}
        side={
          <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-[#0d1624] via-[#0a1220] to-[#060912] p-8 shadow-2xl shadow-green-500/[0.08]">
            <div className="pointer-events-none absolute -left-20 -top-20 h-[250px] w-[250px] rounded-full bg-green-500/[0.12] blur-[100px]" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                  {t("hiw.s5FormulaTitle")}
                </span>
              </div>
              <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 font-mono">
                <div className="text-sm text-slate-200">
                  {t("hiw.s5FormulaLine1")}
                </div>
                <div className="text-sm text-slate-400">
                  {t("hiw.s5FormulaLine2")}
                </div>
                <div className="text-sm text-slate-400">
                  {t("hiw.s5FormulaLine3")}
                </div>
                <div className="mt-3 border-t border-green-500/20 pt-3 text-base font-bold text-green-400">
                  {t("hiw.s5FormulaLine4")}
                </div>
              </div>
              <p className="mt-5 text-xs italic leading-relaxed text-slate-500">
                {t("hiw.s5FormulaFoot")}
              </p>
            </div>
          </div>
        }
        stageNumber={5}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STAGE 6 — Publishing
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        reverse
        badge={t("hiw.s6Badge")}
        title={t("hiw.s6Title")}
        lead={t("hiw.s6Lead")}
        paragraphs={[t("hiw.s6P1"), t("hiw.s6P2")]}
        side={
          <div className="space-y-3">
            <StagePoint
              icon={Zap}
              title={t("hiw.s6Point1Title")}
              desc={t("hiw.s6Point1Desc")}
              card
            />
            <StagePoint
              icon={CheckCircle2}
              title={t("hiw.s6Point2Title")}
              desc={t("hiw.s6Point2Desc")}
              card
            />
            <StagePoint
              icon={Lock}
              title={t("hiw.s6Point3Title")}
              desc={t("hiw.s6Point3Desc")}
              card
            />
          </div>
        }
        stageNumber={6}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STAGE 7 — Continuous retraining
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        badge={t("hiw.s7Badge")}
        title={t("hiw.s7Title")}
        lead={t("hiw.s7Lead")}
        paragraphs={[t("hiw.s7P1"), t("hiw.s7P2")]}
        side={
          <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-[#0d1624] via-[#0a1220] to-[#060912] p-8 shadow-2xl shadow-green-500/[0.08]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[250px] w-[250px] rounded-full bg-green-500/[0.12] blur-[100px]" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                  Quality gates
                </span>
              </div>
              <ul className="space-y-3">
                {[
                  t("hiw.s7Bullet1"),
                  t("hiw.s7Bullet2"),
                  t("hiw.s7Bullet3"),
                  t("hiw.s7Bullet4"),
                ].map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <CircleCheck className="h-4 w-4 shrink-0 translate-y-0.5 text-green-400" />
                    <span className="text-sm leading-snug text-slate-300">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
        stageNumber={7}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          PROOF / TRUST BUILDER
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
              {t("hiw.proofBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("hiw.proofTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("hiw.proofSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {proofs.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-green-500/[0.06] blur-[80px] transition-all group-hover:bg-green-500/[0.12]" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.2)] ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-extrabold tracking-tight text-white">
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {p.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24">
        <div className="relative mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("hiw.faqBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("hiw.faqTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("hiw.faqSubtitle")}
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <motion.details
                key={f.q}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-green-500/30 hover:bg-green-500/[0.03] open:border-green-500/30 open:bg-green-500/[0.04]"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left list-none">
                  <span className="text-base font-bold text-white sm:text-lg">
                    {f.q}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-green-400 transition-transform duration-300 group-open:rotate-90" />
                </summary>
                <div className="border-t border-white/[0.06] px-6 py-5 text-sm leading-relaxed text-slate-400 sm:text-base">
                  {f.a}
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA
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
            <div className="pointer-events-none absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full bg-green-500/[0.18] blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-[360px] w-[360px] rounded-full bg-emerald-500/[0.14] blur-[120px]" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-500/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-300">
                <Trophy className="h-3 w-3" />
                {t("hiw.ctaBadge")}
              </div>
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("hiw.ctaTitle")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {t("hiw.ctaSubtitle")}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`${home}#pricing`}
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 sm:text-base"
                >
                  {t("hiw.ctaPrimary")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={loc("/track-record")}
                  className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-7 py-3.5 text-sm font-extrabold tracking-tight text-white ring-1 ring-white/[0.14] transition-all hover:bg-white/[0.1] hover:ring-green-500/40"
                >
                  {t("hiw.ctaSecondary")}
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

/* ─────────────────────────────────────────────────────────────
   Reusable stage section
   ───────────────────────────────────────────────────────────── */

function StageSection({
  badge,
  title,
  lead,
  paragraphs,
  side,
  reverse = false,
  stageNumber,
}: {
  badge: string;
  title: string;
  lead: string;
  paragraphs: string[];
  side: React.ReactNode;
  reverse?: boolean;
  stageNumber: number;
}) {
  return (
    <section className="relative py-20 md:py-24">
      <div className="relative mx-auto max-w-6xl px-6">
        <div
          className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${
            reverse ? "lg:[&>*:first-child]:order-2" : ""
          }`}
        >
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-green-400">
                {String(stageNumber).padStart(2, "0")}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-green-500/40 to-transparent" />
            </div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {badge}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {title}
            </h2>
            <p className="mt-5 text-base font-semibold leading-relaxed text-slate-300 sm:text-lg">
              {lead}
            </p>
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base"
              >
                {p}
              </p>
            ))}
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7 }}
          >
            {side}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Reusable small stage point (icon + title + desc row)
   ───────────────────────────────────────────────────────────── */

function StagePoint({
  icon: Icon,
  title,
  desc,
  card = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  card?: boolean;
}) {
  return (
    <div
      className={
        card
          ? "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
          : "flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
      }
    >
      {card && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-[140px] w-[140px] rounded-full bg-green-500/[0.06] blur-[70px] transition-all group-hover:bg-green-500/[0.14]" />
      )}
      <div className={card ? "relative flex gap-4" : "contents"}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
          <Icon className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">{title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export default HowItWorksContent;
