"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Database,
  Trophy,
  Star,
  BarChart3,
  Download,
  Lock,
  Eye,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { getLocaleValue } from "@/lib/sanity-data";

interface HowItWorksContentProps {
  howItWorksPage?: any;
}

/**
 * How It Works — simplified 3-step explainer for BetsPlug.
 * Step 1: Pulse analyses every match
 * Step 2: Get our best pick daily
 * Step 3: Track everything transparently
 */
export function HowItWorksContent({ howItWorksPage }: HowItWorksContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");

  const defaultStats = [
    { value: t("hiw.heroStat1Value"), label: t("hiw.heroStat1Label") },
    { value: t("hiw.heroStat2Value"), label: t("hiw.heroStat2Label") },
    { value: t("hiw.heroStat3Value"), label: t("hiw.heroStat3Label") },
    { value: t("hiw.heroStat4Value"), label: t("hiw.heroStat4Label") },
  ];

  const heroStats = howItWorksPage?.stats?.length
    ? howItWorksPage.stats.map((s: any, i: number) => ({
        value: s.value ?? defaultStats[i]?.value ?? "",
        label: getLocaleValue(s.label, locale) || defaultStats[i]?.label || "",
      }))
    : defaultStats;

  const defaultFaqs = [
    { q: t("hiw.faq1Q"), a: t("hiw.faq1A") },
    { q: t("hiw.faq2Q"), a: t("hiw.faq2A") },
    { q: t("hiw.faq3Q"), a: t("hiw.faq3A") },
    { q: t("hiw.faq4Q"), a: t("hiw.faq4A") },
    { q: t("hiw.faq5Q"), a: t("hiw.faq5A") },
    { q: t("hiw.faq6Q"), a: t("hiw.faq6A") },
  ];

  const faqs = howItWorksPage?.faqs?.length
    ? howItWorksPage.faqs.map((f: any) => ({
        q: getLocaleValue(f.question, locale) || "",
        a: getLocaleValue(f.answer, locale) || "",
      }))
    : defaultFaqs;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafb] text-slate-900">
      {/* Shared site navigation */}
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-40 pb-16 md:pt-48 md:pb-20">
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
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-600"
          >
            <Sparkles className="h-3 w-3" />
            {t("hiw.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-balance break-words text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
          >
            {t("hiw.heroTitleA")}
            <br />
            <span className="gradient-text">{t("hiw.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-500 sm:text-lg"
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
            {heroStats.map((s: { value: string; label: string }) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
              >
                <div className="text-2xl font-extrabold tracking-tight text-green-500 sm:text-3xl">
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
              className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-6 py-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 transition-all hover:bg-white hover:ring-green-500/40"
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
            <span className="text-slate-600">{t("hiw.breadcrumbHow")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 1 — Pulse analyses every match
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        badge={t("hiw.step1Badge")}
        title={t("hiw.step1Title")}
        lead={t("hiw.step1Lead")}
        paragraphs={[t("hiw.step1P1")]}
        side={
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">
                  BetsPlug Pulse
                </span>
              </div>
              <StagePoint
                icon={Database}
                title={t("hiw.step1Point1Title")}
                desc={t("hiw.step1Point1Desc")}
              />
              <StagePoint
                icon={RefreshCw}
                title={t("hiw.step1Point2Title")}
                desc={t("hiw.step1Point2Desc")}
              />
              <StagePoint
                icon={Globe}
                title={t("hiw.step1Point3Title")}
                desc={t("hiw.step1Point3Desc")}
              />
            </div>
          </div>
        }
        stageNumber={1}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 2 — Get our best pick daily
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        reverse
        badge={t("hiw.step2Badge")}
        title={t("hiw.step2Title")}
        lead={t("hiw.step2Lead")}
        paragraphs={[t("hiw.step2P1")]}
        side={
          <div className="space-y-3">
            <StagePoint
              icon={Star}
              title={t("hiw.step2Point1Title")}
              desc={t("hiw.step2Point1Desc")}
              card
            />
            <StagePoint
              icon={BarChart3}
              title={t("hiw.step2Point2Title")}
              desc={t("hiw.step2Point2Desc")}
              card
            />
            <StagePoint
              icon={Lock}
              title={t("hiw.step2Point3Title")}
              desc={t("hiw.step2Point3Desc")}
              card
            />
          </div>
        }
        stageNumber={2}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 3 — Track everything transparently
         ═══════════════════════════════════════════════════════════════════ */}
      <StageSection
        badge={t("hiw.step3Badge")}
        title={t("hiw.step3Title")}
        lead={t("hiw.step3Lead")}
        paragraphs={[t("hiw.step3P1")]}
        side={
          <div className="space-y-3">
            <StagePoint
              icon={CheckCircle2}
              title={t("hiw.step3Point1Title")}
              desc={t("hiw.step3Point1Desc")}
              card
            />
            <StagePoint
              icon={Download}
              title={t("hiw.step3Point2Title")}
              desc={t("hiw.step3Point2Desc")}
              card
            />
            <StagePoint
              icon={Eye}
              title={t("hiw.step3Point3Title")}
              desc={t("hiw.step3Point3Desc")}
              card
            />
          </div>
        }
        stageNumber={3}
      />

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
            {/* ── Under the Hood: engine explanation ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="mb-16 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{t("hiw.engineTitle")}</h3>
                  <p className="text-sm text-slate-500">{t("hiw.engineSubtitle")}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: t("hiw.engine1Name"), desc: t("hiw.engine1Desc"), color: "blue" },
                  { name: t("hiw.engine2Name"), desc: t("hiw.engine2Desc"), color: "emerald" },
                  { name: t("hiw.engine3Name"), desc: t("hiw.engine3Desc"), color: "amber" },
                  { name: t("hiw.engine4Name"), desc: t("hiw.engine4Desc"), color: "purple" },
                ].map((m) => (
                  <div key={m.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className={`text-sm font-bold text-${m.color}-400 mb-1`}>{m.name}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500 leading-relaxed">{t("hiw.engineDisclaimer")}</p>
            </motion.div>

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
            {faqs.map((f: { q: string; a: string }) => (
              <motion.details
                key={f.q}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4 }}
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
