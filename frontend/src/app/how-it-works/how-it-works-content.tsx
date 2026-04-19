"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Database,
  Trophy,
  Star,
  BarChart3,
  Download,
  Eye,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
  HelpCircle,
  ShieldCheck,
  XCircle,
  Brain,
  Gauge,
  Filter as FilterIcon,
  Crown,
  ArrowDown,
  Target,
} from "lucide-react";
import { TierEmblem } from "@/components/noct/tier-emblem";
import { TIER_ORDER, TIER_THEME, type TierKey } from "@/components/noct/tier-theme";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { getLocaleValue } from "@/lib/sanity-data";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { usePotdNumbers } from "@/hooks/use-potd-numbers";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { TierLadder } from "@/components/ui/tier-ladder";

interface HowItWorksContentProps {
  howItWorksPage?: any;
}

type Accent = "green" | "purple" | "blue";

/**
 * How It Works, NOCTURNE rebuild.
 */
export function HowItWorksContent({ howItWorksPage }: HowItWorksContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");
  const potd = usePotdNumbers();

  const defaultFaqs = [
    { q: t("hiw.faq1Q"), a: t("hiw.faq1A", potd) },
    { q: t("hiw.faq2Q"), a: t("hiw.faq2A", potd) },
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
        <HeroMediaBg />
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

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
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

      {/* ───────────── TIER LADDER ───────────── */}
      <TierLadder />

      {/* ───────────── TIER FLOW ───────────── */}
      <TierFlowSection />

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
        lead={t("hiw.step2Lead", potd)}
        paragraphs={[t("hiw.step2P1", potd)]}
        stageNumber={2}
        accent="purple"
        side={
          <div className="space-y-4">
            <StagePoint
              icon={Star}
              title={t("hiw.step2Point1Title")}
              desc={t("hiw.step2Point1Desc", potd)}
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
            {/* 3rd point ("Strategy Lab") removed, the backtested-strategy
                filter never shipped and the copy promised a feature that
                isn't on the roadmap. Two concrete features is cleaner
                than padding with vapourware. */}
          </div>
        }
      />

      {/* ───────────── BET OF THE DAY ───────────── */}
      <BotdSection />

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

      {/* ───────────── INTEGRITY LAYER (NEW) ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 h-[460px] w-[460px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(160px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 bottom-20 h-[460px] w-[460px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.08)", filter: "blur(160px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-3xl text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" />
              {t("hiw.integrityBadge")}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("hiw.integrityTitleA")}{" "}
              <span className="gradient-text-green">{t("hiw.integrityTitleB")}</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#a3a9b8]">
              {t("hiw.integritySubtitle")}
            </p>
          </motion.div>

          <div className="space-y-5">
            {[
              {
                badTitle: t("hiw.integrityBad1Title"),
                badDesc: t("hiw.integrityBad1Desc"),
                goodTitle: t("hiw.integrityGood1Title"),
                goodDesc: t("hiw.integrityGood1Desc"),
              },
              {
                badTitle: t("hiw.integrityBad2Title"),
                badDesc: t("hiw.integrityBad2Desc"),
                goodTitle: t("hiw.integrityGood2Title"),
                goodDesc: t("hiw.integrityGood2Desc"),
              },
              {
                badTitle: t("hiw.integrityBad3Title"),
                badDesc: t("hiw.integrityBad3Desc"),
                goodTitle: t("hiw.integrityGood3Title"),
                goodDesc: t("hiw.integrityGood3Desc"),
              },
            ].map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch"
              >
                {/* Bad side */}
                <div
                  className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400/80">
                      {t("hiw.integrityBadBadge")}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#ededed] sm:text-lg">
                    {row.badTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">
                    {row.badDesc}
                  </p>
                </div>

                {/* Arrow / divider */}
                <div className="hidden items-center justify-center md:flex">
                  <ChevronRight className="h-6 w-6 text-[#4ade80]/60" />
                </div>

                {/* Good side */}
                <div className="card-neon card-neon-green rounded-2xl">
                  <div className="relative p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <HexBadge variant="green" size="sm">
                        <ShieldCheck className="h-4 w-4" />
                      </HexBadge>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                        {t("hiw.integrityGoodBadge")}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#ededed] sm:text-lg">
                      {row.goodTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">
                      {row.goodDesc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── ENGINE + FAQ ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
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
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("hiw.faqTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">{t("hiw.faqSubtitle")}</p>
          </motion.div>

          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* ───────────── FINAL CTA ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
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

            <div className="relative p-6 sm:p-10 md:p-16">
              <span className="section-label mb-6 inline-flex items-center gap-2">
                <Trophy className="h-3 w-3" />
                {t("hiw.ctaBadge")}
              </span>
              <h2 className="text-display text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
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
   Stage section, alternating 2-col layout
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
    <section className="relative overflow-hidden py-20 md:py-28">
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
            <h2 className={`text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl`}>
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
   Stage point, icon + title + desc row (optionally carded)
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

/** Reusable FAQ accordion matching the homepage SeoSection style. */
function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={f.q}
            className={`overflow-hidden transition-all duration-200 ${
              isOpen ? "card-neon card-neon-green" : "glass-panel-lifted"
            }`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span
                  className={`text-base font-semibold transition-colors sm:text-lg ${
                    isOpen ? "text-[#ededed]" : "text-[#a3a9b8]"
                  }`}
                >
                  {f.q}
                </span>
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                    isOpen
                      ? "rotate-180 bg-[#4ade80]/15 text-[#4ade80]"
                      : "bg-white/[0.05] text-[#6b7280]"
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="border-t px-6 pb-6 pt-4 text-sm leading-relaxed text-[#a3a9b8] sm:text-base"
                      style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
                    >
                      {f.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tier flow, explains how a prediction lands in a tier
   ───────────────────────────────────────────────────────────── */

function TierFlowSection() {
  const { t } = useTranslations();
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-20 h-[460px] w-[460px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(160px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-20 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(160px)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <span className="section-label mb-4 inline-flex items-center gap-2">
            <Gauge className="h-3 w-3" />
            {t("hiw.flowBadge")}
          </span>
          <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("hiw.flowTitleA")}{" "}
            <span className="gradient-text-green">{t("hiw.flowTitleB")}</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#a3a9b8]">
            {t("hiw.flowSubtitle")}
          </p>
        </motion.div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto_1.2fr]">
          {/* Left: vertical step flow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            <FlowStep
              icon={Globe}
              label={t("hiw.flowStep1Label")}
              title={t("hiw.flowStep1Title")}
              desc={t("hiw.flowStep1Desc")}
            />
            <FlowArrow />
            <FlowStep
              icon={Brain}
              label={t("hiw.flowStep2Label")}
              title={t("hiw.flowStep2Title")}
              desc={t("hiw.flowStep2Desc")}
            />
            <FlowArrow />
            <FlowStep
              icon={Gauge}
              label={t("hiw.flowStep3Label")}
              title={t("hiw.flowStep3Title")}
              desc={t("hiw.flowStep3Desc")}
            />
            <FlowArrow />
            <FlowStep
              icon={FilterIcon}
              label={t("hiw.flowStep4Label")}
              title={t("hiw.flowStep4Title")}
              desc={t("hiw.flowStep4Desc")}
              highlight
            />
          </motion.div>

          {/* Middle: big arrow (desktop only) */}
          <div className="hidden lg:flex items-center justify-center self-stretch">
            <ChevronRight className="h-10 w-10 text-[#4ade80]/50" />
          </div>

          {/* Right: tier threshold bars */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="card-neon card-neon-green halo-green rounded-3xl"
          >
            <div className="relative p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                  {t("hiw.flowBarsLabel")}
                </span>
              </div>
              <div className="space-y-3">
                {[...TIER_ORDER].reverse().map((tierKey) => (
                  <TierBar key={tierKey} tierKey={tierKey} />
                ))}
                <div className="glass-panel flex items-center gap-3 rounded-xl p-3 opacity-60">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#6b7280]">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#a3a9b8]">
                        {t("hiw.flowBarNoneTitle")}
                      </span>
                      <span className="text-[10px] tabular-nums text-[#6b7280]">
                        &lt; 55%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#6b7280]">
                      {t("hiw.flowBarNoneDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[#a3a9b8]">
                {t("hiw.flowBarsFooter")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FlowStep({
  icon: Icon,
  label,
  title,
  desc,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "glass-panel rounded-2xl p-4 transition-colors " +
        (highlight ? "ring-1 ring-[#4ade80]/30 bg-[#4ade80]/[0.04]" : "")
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[#4ade80]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
            {label}
          </span>
          <h4 className="mt-0.5 text-sm font-semibold text-[#ededed]">{title}</h4>
          <p className="mt-1 text-[12px] leading-relaxed text-[#a3a9b8]">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5" aria-hidden>
      <ArrowDown className="h-4 w-4 text-[#4ade80]/50" />
    </div>
  );
}

function TierBar({ tierKey }: { tierKey: TierKey }) {
  const { t } = useTranslations();
  const theme = TIER_THEME[tierKey];
  const confPct = Math.round(parseFloat(theme.confFloor.replace(",", ".")) * 100);
  // Width of the bar: platinum widest (premium feel), bronze narrowest
  const widthMap: Record<TierKey, string> = {
    platinum: "95%",
    gold: "82%",
    silver: "70%",
    bronze: "55%",
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-3"
      style={{
        borderColor: theme.ringHex,
        background: `linear-gradient(90deg, ${theme.bgTintHex}, rgba(15,20,32,0.4))`,
      }}
    >
      <div className="relative flex items-center gap-3">
        <TierEmblem tier={tierKey} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-widest ${theme.textClass}`}
            >
              {theme.name}
            </span>
            <span className="text-[10px] tabular-nums text-[#a3a9b8]">
              ≥ {confPct}%
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-[#a3a9b8]">
            {(t as (k: string) => string)(
              `hiw.flowBar${tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}Desc`,
            )}
          </p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{
                width: widthMap[tierKey],
                background: `linear-gradient(90deg, ${theme.colorHex}, ${theme.colorHex}aa)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Bet of the Day, dedicated story + selection funnel
   ───────────────────────────────────────────────────────────── */

function BotdSection() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const potd = usePotdNumbers();
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-20 h-[520px] w-[620px] -translate-x-1/2 rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(160px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(160px)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <span className="section-label mb-4 inline-flex items-center gap-2">
            <Crown className="h-3 w-3" />
            {t("hiw.botdBadge")}
          </span>
          <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("hiw.botdTitleA")}{" "}
            <span className="gradient-text-green">{t("hiw.botdTitleB")}</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#a3a9b8]">
            {t("hiw.botdSubtitle")}
          </p>
        </motion.div>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: story + stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-[#ededed] sm:text-xl">
              {t("hiw.botdStoryTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
              {t("hiw.botdStoryP1")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
              {t("hiw.botdStoryP2")}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                  {t("hiw.botdStatAccuracyLabel")}
                </p>
                <p className="text-stat mt-1 text-3xl leading-none text-[#ededed]">
                  {potd.potdAccuracy}%
                </p>
                <p className="mt-2 text-[11px] text-[#a3a9b8]">
                  {t("hiw.botdStatAccuracyDesc", potd)}
                </p>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a855f7]">
                  {t("hiw.botdStatPicksLabel")}
                </p>
                <p className="text-stat mt-1 text-3xl leading-none text-[#ededed]">
                  {potd.potdPicks}
                </p>
                <p className="mt-2 text-[11px] text-[#a3a9b8]">
                  {t("hiw.botdStatPicksDesc")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href={loc("/bet-of-the-day")} className="btn-primary inline-flex">
                {t("hiw.botdCtaPrimary")}
              </Link>
              <Link href={loc("/track-record")} className="btn-glass inline-flex">
                {t("hiw.botdCtaSecondary")}
              </Link>
            </div>
          </motion.div>

          {/* Right: selection funnel card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="card-neon card-neon-green halo-green rounded-3xl"
          >
            <div className="relative p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                  {t("hiw.botdFunnelLabel")}
                </span>
                <HexBadge variant="green" size="sm">
                  <Crown className="h-4 w-4" />
                </HexBadge>
              </div>

              <div className="space-y-3">
                <FunnelStep
                  rank="01"
                  icon={Database}
                  title={t("hiw.botdFunnel1Title")}
                  desc={t("hiw.botdFunnel1Desc")}
                  tag={t("hiw.botdFunnel1Tag")}
                />
                <FlowArrow />
                <FunnelStep
                  rank="02"
                  icon={FilterIcon}
                  title={t("hiw.botdFunnel2Title")}
                  desc={t("hiw.botdFunnel2Desc")}
                  tag={t("hiw.botdFunnel2Tag")}
                />
                <FlowArrow />
                <FunnelStep
                  rank="03"
                  icon={Target}
                  title={t("hiw.botdFunnel3Title")}
                  desc={t("hiw.botdFunnel3Desc")}
                  tag={t("hiw.botdFunnel3Tag")}
                />
                <FlowArrow />
                <FunnelStep
                  rank="04"
                  icon={Crown}
                  title={t("hiw.botdFunnel4Title")}
                  desc={t("hiw.botdFunnel4Desc")}
                  tag={t("hiw.botdFunnel4Tag")}
                  highlight
                />
              </div>

              <p className="mt-5 border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-[#a3a9b8]">
                {t("hiw.botdFunnelFooter")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FunnelStep({
  rank,
  icon: Icon,
  title,
  desc,
  tag,
  highlight = false,
}: {
  rank: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tag: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "glass-panel rounded-xl p-3.5 transition-colors " +
        (highlight ? "ring-1 ring-[#4ade80]/40 bg-[#4ade80]/[0.06]" : "")
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#4ade80]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono tabular-nums text-[#6b7280]">
                {rank}
              </span>
              <span className="text-xs font-semibold text-[#ededed] truncate">
                {title}
              </span>
            </div>
            <Pill
              tone={highlight ? "active" : "default"}
              className="!text-[9px] whitespace-nowrap"
            >
              {tag}
            </Pill>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#a3a9b8]">{desc}</p>
        </div>
      </div>
    </div>
  );
}
