"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  PartyPopper,
  ArrowRight,
  LogIn,
  ShieldCheck,
  Mail,
  Users,
  TrendingUp,
  Target,
  CheckCircle2,
  Flame,
  Quote,
  MailCheck,
  Wallet,
  Eye,
  Rocket,
  Clock,
  LayoutDashboard,
  LineChart,
  History,
  Radio,
  MessageCircle,
  Settings,
  Command,
  ChevronRight,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";
import { getLocaleValue } from "@/lib/sanity-data";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { HexBadge, type HexVariant } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { trackTikTok } from "@/lib/tiktok-pixel";

interface WelcomeContentProps {
  welcomePage?: any;
}

export function WelcomeContent({ welcomePage }: WelcomeContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const { user } = useAuth();

  const [burst, setBurst] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setBurst(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    trackTikTok("CompleteRegistration", {
      content_name: "Free Access signup",
      content_type: "registration",
    });
  }, []);

  const displayName =
    (user?.name && user.name.trim()) ||
    (user?.email && user.email.split("@")[0]) ||
    "there";

  const statusTitle = `Your account is ready${
    user ? `, ${displayName}` : ""
  }!`;
  const statusBody =
    "Here's what to do next: check today's AI football predictions, pick a plan that fits your betting style, and start winning smarter.";

  const nextStepVariants: HexVariant[] = ["green", "purple", "blue"];
  const nextSteps = [
    {
      icon: LogIn,
      title: t("welcome.next1Title"),
      body: t("welcome.next1Body"),
    },
    {
      icon: Target,
      title: t("welcome.next2Title"),
      body: t("welcome.next2Body"),
    },
    {
      icon: TrendingUp,
      title: t("welcome.next3Title"),
      body: t("welcome.next3Body"),
    },
  ];

  const iconMap: Record<string, typeof Users> = { Users, TrendingUp, Flame };
  const defaultStats = [
    { icon: Users, value: "12,400+", label: t("welcome.statMembers"), variant: "green" as HexVariant },
    { icon: TrendingUp, value: "+14.6%", label: t("welcome.statRoi"), variant: "purple" as HexVariant },
    { icon: Flame, value: "380+", label: t("welcome.statPicks"), variant: "blue" as HexVariant },
  ];

  const stats = welcomePage?.stats?.length
    ? welcomePage.stats.map((s: any, i: number) => ({
        icon: iconMap[s.icon] ?? defaultStats[i]?.icon ?? Users,
        value: s.value ?? defaultStats[i]?.value ?? "",
        label: getLocaleValue(s.label, locale) || defaultStats[i]?.label || "",
        variant: defaultStats[i]?.variant ?? ("green" as HexVariant),
      }))
    : defaultStats;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">

      {/* Confetti burst */}
      {burst && (
        <div
          className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.4;
            const duration = 1.6 + Math.random() * 0.9;
            const size = 6 + Math.round(Math.random() * 6);
            const colors = ["#4ade80", "#22c55e", "#a855f7", "#60a5fa", "#ffffff"];
            const color = colors[i % colors.length];
            return (
              <span
                key={i}
                className="absolute block rounded-sm"
                style={{
                  left: `${left}%`,
                  top: "55%",
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}`,
                  animation: `welcome-burst ${duration}s ease-out ${delay}s forwards`,
                }}
              />
            );
          })}
          <style>{`
            @keyframes welcome-burst {
              0%   { transform: translateY(0) rotate(0deg) scale(0.8); opacity: 0; }
              10%  { opacity: 1; }
              100% { transform: translateY(-70vh) rotate(720deg) scale(1); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
          <HeroMediaBg
            src={PAGE_IMAGES.welcome.hero}
            alt={PAGE_IMAGES.welcome.alt}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-20 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
            style={{ background: "hsl(var(--accent-green) / 0.14)", filter: "blur(140px)" }}
          />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="section-label mb-5"
            >
              <PartyPopper className="h-3 w-3" />
              {t("welcome.badge")}
            </motion.span>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 flex justify-center"
            >
              <HexBadge variant="green" size="xl">
                <Sparkles className="h-10 w-10" strokeWidth={2} />
              </HexBadge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-5xl lg:text-6xl"
            >
              {t("welcome.title")}{" "}
              <span className="gradient-text-green">
                {t("welcome.titleHighlight")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
            >
              {t("welcome.subtitle")}
            </motion.p>

            {/* Status card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mx-auto mt-10 max-w-2xl"
            >
              <div className="card-neon card-neon-green p-6 text-left">
                <div className="relative flex items-start gap-4">
                  <HexBadge variant="green" size="md">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                  </HexBadge>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-heading text-base text-[#ededed] sm:text-lg">
                        {statusTitle}
                      </h2>
                      <Pill tone="win" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Pill>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">
                      {statusBody}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                href={loc("/predictions")}
                className="btn-primary inline-flex items-center gap-2"
              >
                See today&apos;s predictions
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={loc("/checkout")}
                className="btn-glass inline-flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Pick your subscription
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-6 inline-flex items-center gap-2 text-xs text-[#6b7280]"
            >
              <Mail className="h-3.5 w-3.5 text-[#4ade80]" />
              {t("welcome.emailHint")}
            </motion.p>
          </div>
        </section>

        {/* ── Quickstart timeline ── */}
        <QuickstartSection />

        {/* ── Dashboard tour ── */}
        <DashboardTourSection />

        {/* ── Stats strip ── */}
        <section className="relative py-20 md:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full"
            style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(140px)" }}
          />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {stats.map(
                (
                  s: {
                    icon: typeof Users;
                    value: string;
                    label: string;
                    variant: HexVariant;
                  },
                  i: number,
                ) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.5, delay: i * 0.08 }}
                      className={`card-neon card-neon-${s.variant} p-6`}
                    >
                      <div className="relative flex items-center gap-4">
                        <HexBadge variant={s.variant} size="md">
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </HexBadge>
                        <div>
                          <div className="text-stat text-2xl text-[#ededed]">
                            {s.value}
                          </div>
                          <div className="text-xs text-[#a3a9b8]">{s.label}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        {/* ── Next steps ── */}
        <section className="relative py-20 md:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/3 h-[400px] w-[500px] rounded-full"
            style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(140px)" }}
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <span className="section-label">
                <Sparkles className="h-3 w-3" />
                {t("welcome.nextTitle")}
              </span>
              <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                Your first{" "}
                <span className="gradient-text-green">three steps.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {nextSteps.map((step, i) => {
                const Icon = step.icon;
                const variant = nextStepVariants[i % nextStepVariants.length];
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className={`card-neon card-neon-${variant} p-6 sm:p-7`}
                  >
                    <div className="relative flex flex-col">
                      <div className="flex items-center gap-3">
                        <HexBadge variant={variant} size="md">
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </HexBadge>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                          Step {i + 1}
                        </span>
                      </div>
                      <h3 className="text-heading mt-5 text-lg text-[#ededed]">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">
                        {step.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Testimonial ── */}
        <section className="relative py-16 md:py-20">
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <motion.figure
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="card-neon p-8 text-center sm:p-10"
            >
              <div className="relative">
                <Quote className="mx-auto mb-4 h-8 w-8 text-[#4ade80]/70" aria-hidden />
                <blockquote className="text-lg font-medium italic leading-relaxed text-[#c4cad6] sm:text-xl">
                  {t("welcome.quote")}
                </blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-[#a3a9b8]">
                  {t("welcome.quoteAuthor")}
                </figcaption>
              </div>
            </motion.figure>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative py-20 md:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[500px] rounded-full"
            style={{ background: "hsl(var(--accent-green) / 0.2)", filter: "blur(140px)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-1/4 bottom-0 h-[400px] w-[500px] rounded-full"
            style={{ background: "hsl(var(--accent-purple) / 0.15)", filter: "blur(140px)" }}
          />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="card-neon card-neon-green halo-green p-6 sm:p-10 md:p-16">
              <div className="relative text-center">
                <span className="section-label mb-4">
                  <Rocket className="h-3 w-3" /> Ready
                </span>
                <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                  Start exploring{" "}
                  <span className="gradient-text-green">predictions.</span>
                </h2>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href={loc("/predictions")}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Rocket className="h-4 w-4" />
                    See predictions
                  </Link>
                  <Link
                    href={loc("/checkout")}
                    className="btn-glass inline-flex items-center gap-2"
                  >
                    Pick a plan
                  </Link>
                </div>
                <p className="mt-8 inline-flex items-center justify-center gap-2 text-xs text-[#a3a9b8]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#4ade80]" />
                  {t("welcome.footerNote")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}

/* ────────────────────────────────────────────────────
 * Quickstart timeline
 * ──────────────────────────────────────────────────── */
function QuickstartSection() {
  const { t } = useTranslations();

  const stepVariants: HexVariant[] = ["green", "purple", "blue", "green", "purple"];
  const steps = [
    {
      icon: MailCheck,
      title: t("welcome.qs1Title"),
      body: t("welcome.qs1Body"),
      duration: t("welcome.qs1Duration"),
    },
    {
      icon: LogIn,
      title: t("welcome.qs2Title"),
      body: t("welcome.qs2Body"),
      duration: t("welcome.qs2Duration"),
    },
    {
      icon: Wallet,
      title: t("welcome.qs3Title"),
      body: t("welcome.qs3Body"),
      duration: t("welcome.qs3Duration"),
    },
    {
      icon: Eye,
      title: t("welcome.qs4Title"),
      body: t("welcome.qs4Body"),
      duration: t("welcome.qs4Duration"),
    },
    {
      icon: Rocket,
      title: t("welcome.qs5Title"),
      body: t("welcome.qs5Body"),
      duration: t("welcome.qs5Duration"),
    },
  ];

  return (
    <section className="relative py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
        style={{ background: "hsl(var(--accent-blue) / 0.1)", filter: "blur(140px)" }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="section-label">
            <Rocket className="h-3 w-3" />
            {t("welcome.quickstartEyebrow")}
          </span>
          <h2 className="text-heading mx-auto mt-4 max-w-3xl text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("welcome.quickstartTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#a3a9b8]">
            {t("welcome.quickstartSubtitle")}
          </p>
          <div className="mt-5 inline-flex">
            <Pill tone="default" className="gap-1.5 text-xs">
              <Clock className="h-3 w-3 text-[#4ade80]" />
              {t("welcome.quickstartDuration")}
            </Pill>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const variant = stepVariants[i % stepVariants.length];
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="glass-panel-lifted p-5"
              >
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2">
                    <HexBadge variant={variant} size="sm">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </HexBadge>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="text-heading text-sm text-[#ededed]">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#a3a9b8]">
                    {step.body}
                  </p>
                  <Pill tone="default" className="gap-1 text-[10px]">
                    <Clock className="h-2.5 w-2.5 text-[#4ade80]" />
                    {step.duration}
                  </Pill>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────
 * Dashboard tour
 * ──────────────────────────────────────────────────── */
function DashboardTourSection() {
  const { t } = useTranslations();

  const tourVariants: HexVariant[] = ["green", "purple", "blue", "green", "purple", "blue"];
  const tourItems = [
    { icon: LayoutDashboard, title: t("welcome.tour1Title"), body: t("welcome.tour1Body"), where: t("welcome.tour1Where") },
    { icon: LineChart, title: t("welcome.tour2Title"), body: t("welcome.tour2Body"), where: t("welcome.tour2Where") },
    { icon: History, title: t("welcome.tour3Title"), body: t("welcome.tour3Body"), where: t("welcome.tour3Where") },
    { icon: Radio, title: t("welcome.tour4Title"), body: t("welcome.tour4Body"), where: t("welcome.tour4Where") },
    { icon: MessageCircle, title: t("welcome.tour5Title"), body: t("welcome.tour5Body"), where: t("welcome.tour5Where") },
    { icon: Settings, title: t("welcome.tour6Title"), body: t("welcome.tour6Body"), where: t("welcome.tour6Where") },
  ];

  return (
    <section className="relative py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[500px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(140px)" }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="section-label">
            <LayoutDashboard className="h-3 w-3" />
            {t("welcome.tourEyebrow")}
          </span>
          <h2 className="text-heading mx-auto mt-4 max-w-3xl text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("welcome.tourTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#a3a9b8]">
            {t("welcome.tourSubtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tourItems.map((item, i) => {
            const Icon = item.icon;
            const variant = tourVariants[i % tourVariants.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className={`card-neon card-neon-${variant} p-6`}
              >
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <HexBadge variant={variant} size="md">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </HexBadge>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-heading text-base text-[#ededed]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">
                    {item.body}
                  </p>
                  <div className="mt-4">
                    <Pill tone="default" className="gap-1 text-[10px]">
                      <ChevronRight className="h-3 w-3" />
                      {item.where}
                    </Pill>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pro-tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-neon card-neon-green mt-6 p-6"
        >
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <HexBadge variant="green" size="md">
              <Command className="h-5 w-5" strokeWidth={2} />
            </HexBadge>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4ade80]">
                  {t("welcome.tourProTipTitle")}
                </span>
                <Pill tone="default" className="text-[10px]">
                  ⌘ K
                </Pill>
              </div>
              <p className="text-sm leading-relaxed text-[#c4cad6]">
                {t("welcome.tourProTipBody")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default WelcomeContent;
