"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
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
  HelpCircle,
  Activity,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { getLocaleValue } from "@/lib/sanity-data";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { useBotdTrackRecord } from "@/hooks/use-botd-track-record";

interface HowItWorksContentProps {
  howItWorksPage?: any;
}

type Accent = "green" | "purple" | "blue";

const HERO_STAT_VARIANTS: Accent[] = ["green", "purple", "blue", "green"];

/**
 * How It Works — NOCTURNE rebuild.
 */
export function HowItWorksContent({ howItWorksPage }: HowItWorksContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");
  const botd = useBotdTrackRecord();

  // Stats 1 (BOTD accuracy) and 2 (picks tracked) come from the live
  // Pick-of-the-Day track record when loaded; fall back to the i18n
  // defaults on first paint / network error. Stats 3 and 4 are static.
  const defaultStats = [
    {
      value:
        botd?.accuracy_pct != null
          ? `${botd.accuracy_pct}%`
          : t("hiw.heroStat1Value"),
      label: t("hiw.heroStat1Label"),
    },
    {
      value:
        botd?.total_picks != null
          ? botd.total_picks.toLocaleString(locale)
          : t("hiw.heroStat2Value"),
      label: t("hiw.heroStat2Label"),
    },
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
    <div className="min-h-screen overflow-x-hidden">
      <SiteNav />

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.14)", filter: "blur(160px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-40 h-[460px] w-[460px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.12)", filter: "blur(160px)" }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label mb-6 inline-flex items-center gap-2"
          >
            <Sparkles className="h-3 w-3" />
            {t("hiw.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-display text-balance break-words text-4xl text-[#ededed] sm:text-5xl md:text-6xl"
          >
            {t("hiw.heroTitleA")}{" "}
            <span className="gradient-text-green">{t("hiw.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            {t("hiw.heroSubtitle")}
          </motion.p>

          {/* Hero KPI strip */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {heroStats.map((s: { value: string; label: string }, i: number) => {
              const variant = HERO_STAT_VARIANTS[i % HERO_STAT_VARIANTS.length];
              return (
                <div
                  key={s.label}
                  className={`card-neon card-neon-${variant} rounded-2xl`}
                >
                  <div className="relative flex flex-col items-center p-5 text-center">
                    <HexBadge variant={variant} size="sm" className="mb-3">
                      <Activity className="h-4 w-4" />
                    </HexBadge>
                    <div className="text-stat text-2xl text-[#ededed] sm:text-3xl">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider leading-tight text-[#a3a9b8]">
                      {s.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href={`${home}#pricing`} className="btn-primary">
              {t("hiw.heroCtaSecondary")}
            </Link>
            <Link href={loc("/track-record")} className="btn-glass">
              {t("hiw.heroCtaPrimary")}
            </Link>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            aria-label="Breadcrumb"
            className="mt-10 flex items-center justify-center gap-2 text-xs text-[#a3a9b8]"
          >
            <Link href={home} className="transition-colors hover:text-[#4ade80]">
              {t("hiw.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#ededed]">{t("hiw.breadcrumbHow")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ───────────── STEP 1 ───────────── */}
      <StageSection
        badge={t("hiw.step1Badge")}
        title={t("hiw.step1Title")}
        lead={t("hiw.step1Lead")}
        paragraphs={[t("hiw.step1P1")]}
        stageNumber={1}
        accent="green"
        side={
          <div className="card-neon card-neon-green rounded-3xl halo-green">
            <div className="relative p-8">
              <div className="mb-5 flex items-center gap-2">
                <span className="live-dot" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                  BetsPlug Pulse
                </span>
              </div>
              <div className="space-y-4">
                <StagePoint
                  icon={Database}
                  title={t("hiw.step1Point1Title")}
                  desc={t("hiw.step1Point1Desc")}
                  variant="green"
                />
                <StagePoint
                  icon={RefreshCw}
                  title={t("hiw.step1Point2Title")}
                  desc={t("hiw.step1Point2Desc")}
                  variant="green"
                />
                <StagePoint
                  icon={Globe}
                  title={t("hiw.step1Point3Title")}
                  desc={t("hiw.step1Point3Desc")}
                  variant="green"
                />
              </div>
            </div>
          </div>
        }
      />

      {/* ───────────── STEP 2 ───────────── */}
      <StageSection
        reverse
        badge={t("hiw.step2Badge")}
        title={t("hiw.step2Title")}
        lead={t("hiw.step2Lead")}
        paragraphs={[t("hiw.step2P1")]}
        stageNumber={2}
        accent="purple"
        side={
          <div className="space-y-4">
            <StagePoint
              icon={Star}
              title={t("hiw.step2Point1Title")}
              desc={t("hiw.step2Point1Desc")}
              variant="purple"
              card
            />
            <StagePoint
              icon={BarChart3}
              title={t("hiw.step2Point2Title")}
              desc={t("hiw.step2Point2Desc")}
              variant="purple"
              card
            />
            <StagePoint
              icon={Lock}
              title={t("hiw.step2Point3Title")}
              desc={t("hiw.step2Point3Desc")}
              variant="purple"
              card
            />
          </div>
        }
      />

      {/* ───────────── STEP 3 ───────────── */}
      <StageSection
        badge={t("hiw.step3Badge")}
        title={t("hiw.step3Title")}
        lead={t("hiw.step3Lead")}
        paragraphs={[t("hiw.step3P1")]}
        stageNumber={3}
        accent="blue"
        side={
          <div className="space-y-4">
            <StagePoint
              icon={CheckCircle2}
              title={t("hiw.step3Point1Title")}
              desc={t("hiw.step3Point1Desc")}
              variant="blue"
              card
            />
            <StagePoint
              icon={Download}
              title={t("hiw.step3Point2Title")}
              desc={t("hiw.step3Point2Desc")}
              variant="blue"
              card
            />
            <StagePoint
              icon={Eye}
              title={t("hiw.step3Point3Title")}
              desc={t("hiw.step3Point3Desc")}
              variant="blue"
              card
            />
          </div>
        }
      />

      {/* ───────────── ENGINE + FAQ ───────────── */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-40 h-[500px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-blue) / 0.1)", filter: "blur(160px)" }}
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          {/* Engine explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="card-neon card-neon-blue mb-16 rounded-3xl"
          >
            <div className="relative p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <HexBadge variant="blue" size="md">
                  <Database className="h-5 w-5" />
                </HexBadge>
                <div>
                  <h3 className="text-xl font-semibold text-[#ededed]">
                    {t("hiw.engineTitle")}
                  </h3>
                  <p className="text-sm text-[#a3a9b8]">{t("hiw.engineSubtitle")}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: t("hiw.engine1Name"), desc: t("hiw.engine1Desc"), variant: "blue" as Accent },
                  { name: t("hiw.engine2Name"), desc: t("hiw.engine2Desc"), variant: "green" as Accent },
                  { name: t("hiw.engine3Name"), desc: t("hiw.engine3Desc"), variant: "purple" as Accent },
                  { name: t("hiw.engine4Name"), desc: t("hiw.engine4Desc"), variant: "blue" as Accent },
                ].map((m) => (
                  <div key={m.name} className="glass-panel rounded-xl p-4">
                    <Pill
                      tone={m.variant === "green" ? "active" : m.variant === "purple" ? "purple" : "info"}
                      className="!text-[10px] mb-2"
                    >
                      {m.name}
                    </Pill>
                    <p className="text-xs text-[#a3a9b8] leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[#a3a9b8] leading-relaxed">
                {t("hiw.engineDisclaimer")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <HelpCircle className="h-3 w-3" />
              {t("hiw.faqBadge")}
            </span>
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("hiw.faqTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">{t("hiw.faqSubtitle")}</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((f: { q: string; a: string }) => (
              <motion.details
                key={f.q}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4 }}
                className="card-neon group rounded-2xl"
              >
                <div className="relative">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left list-none">
                    <span className="text-base font-semibold text-[#ededed] sm:text-lg">
                      {f.q}
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[#4ade80] transition-transform duration-300 group-open:rotate-90" />
                  </summary>
                  <div className="border-t border-white/[0.06] px-6 py-5 text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
                    {f.a}
                  </div>
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FINAL CTA ───────────── */}
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
                <Trophy className="h-3 w-3" />
                {t("hiw.ctaBadge")}
              </span>
              <h2 className="text-display text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t("hiw.ctaTitle")}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                {t("hiw.ctaSubtitle")}
              </p>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link href={`${home}#pricing`} className="btn-primary">
                  {t("hiw.ctaPrimary")}
                </Link>
                <Link href={loc("/track-record")} className="btn-glass">
                  {t("hiw.ctaSecondary")}
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
   Stage section — alternating 2-col layout
   ───────────────────────────────────────────────────────────── */

function StageSection({
  badge,
  title,
  lead,
  paragraphs,
  side,
  reverse = false,
  stageNumber,
  accent,
}: {
  badge: string;
  title: string;
  lead: string;
  paragraphs: string[];
  side: React.ReactNode;
  reverse?: boolean;
  stageNumber: number;
  accent: Accent;
}) {
  const gradientClass =
    accent === "purple" ? "gradient-text-purple" : accent === "blue" ? "gradient-text-cyan" : "gradient-text-green";

  return (
    <section className="relative py-20 md:py-28">
      <div
        aria-hidden
        className={`pointer-events-none absolute ${reverse ? "-right-40" : "-left-40"} top-20 h-[460px] w-[460px] rounded-full`}
        style={{
          background: `hsl(var(--accent-${accent}) / 0.12)`,
          filter: "blur(160px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
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
              <Pill tone={accent === "green" ? "active" : accent === "purple" ? "purple" : "info"}>
                {String(stageNumber).padStart(2, "0")}
              </Pill>
              <span
                className="h-px flex-1"
                style={{
                  background: `linear-gradient(to right, hsl(var(--accent-${accent}) / 0.4), transparent)`,
                }}
              />
            </div>
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
            <h2 className={`text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl`}>
              <span className={gradientClass}>{title}</span>
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-[#ededed] sm:text-lg">
              {lead}
            </p>
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="mt-4 text-sm leading-relaxed text-[#a3a9b8] sm:text-base"
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
   Stage point — icon + title + desc row (optionally carded)
   ───────────────────────────────────────────────────────────── */

function StagePoint({
  icon: Icon,
  title,
  desc,
  card = false,
  variant = "green",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  card?: boolean;
  variant?: Accent;
}) {
  const body = (
    <div className="flex gap-4">
      <HexBadge variant={variant} size="sm">
        <Icon className="h-4 w-4" />
      </HexBadge>
      <div>
        <h4 className="text-sm font-semibold text-[#ededed]">{title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">{desc}</p>
      </div>
    </div>
  );

  if (card) {
    return (
      <div className={`card-neon card-neon-${variant} rounded-2xl`}>
        <div className="relative p-5">{body}</div>
      </div>
    );
  }

  return <div className="glass-panel rounded-2xl p-4">{body}</div>;
}
