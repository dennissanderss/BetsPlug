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
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";
import { getLocaleValue } from "@/lib/sanity-data";

/**
 * WelcomeContent — post-registration / email-verification welcome.
 *
 * This page is now the first thing a visitor sees AFTER they
 * verify their email / create an account. It is NOT the
 * post-payment page anymore — that lives at `/thank-you`.
 *
 * The goals for the welcome page:
 *   1. Greet them by name ("Your account is ready, Alex!")
 *   2. Walk them through the three next steps: browse
 *      predictions → pick a subscription → start winning
 *   3. Drop a quickstart timeline + dashboard tour so they know
 *      where everything lives before they commit to a plan
 *   4. Provide one clear primary CTA: "Browse predictions"
 *
 * The flow mirrors the rest of the BetsPlug marketing pages
 * (dark ambient background, green accent gradient, motion
 * reveals, SiteNav + BetsPlugFooter) so the brand feels
 * consistent from landing → register → welcome.
 */
interface WelcomeContentProps {
  welcomePage?: any;
}

export function WelcomeContent({ welcomePage }: WelcomeContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const { user } = useAuth();

  // Tiny confetti-style burst on mount — not a full library, just a
  // handful of CSS particles that fade and drift upward for ~2s.
  const [burst, setBurst] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setBurst(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  // Pick the best display name we can find. `AuthUser` carries
  // `name` (set by the login flow to the username half of the
  // email). Fall back to the email prefix, then "there".
  const displayName =
    (user?.name && user.name.trim()) ||
    (user?.email && user.email.split("@")[0]) ||
    "there";

  const statusTitle = `Your account is ready${
    user ? `, ${displayName}` : ""
  }!`;
  const statusBody =
    "Here's what to do next: browse today's predictions, pick the subscription that fits you, and start winning smarter with the rest of the crew.";

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
    { icon: Users, value: "12,400+", label: t("welcome.statMembers") },
    { icon: TrendingUp, value: "+14.6%", label: t("welcome.statRoi") },
    { icon: Flame, value: "380+", label: t("welcome.statPicks") },
  ];

  const stats = welcomePage?.stats?.length
    ? welcomePage.stats.map((s: any, i: number) => ({
        icon: iconMap[s.icon] ?? defaultStats[i]?.icon ?? Users,
        value: s.value ?? defaultStats[i]?.value ?? "",
        label: getLocaleValue(s.label, locale) || defaultStats[i]?.label || "",
      }))
    : defaultStats;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-slate-900">
      {/* ── Ambient background — matches the rest of the site ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.04] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.03] blur-[160px]" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-green-500/[0.03] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <SiteNav />

      {/* ── Confetti burst ── */}
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
            const colors = [
              "#4ade80",
              "#22c55e",
              "#a7f3d0",
              "#facc15",
              "#ffffff",
            ];
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

      {/* ── Hero ── */}
      <main className="relative z-10 pt-44 pb-24 sm:pt-52">
        <section className="mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-4 py-2 backdrop-blur-sm"
          >
            <PartyPopper className="h-4 w-4 text-green-500" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-600">
              {t("welcome.badge")}
            </span>
          </motion.div>

          {/* Big emotional title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-4xl text-balance break-words text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
          >
            {t("welcome.title")}{" "}
            <span className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 bg-clip-text text-transparent">
              {t("welcome.titleHighlight")}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-slate-500 sm:text-lg"
          >
            {t("welcome.subtitle")}
          </motion.p>

          {/* Status card — "account is ready" (post-registration) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-10 max-w-2xl"
          >
            <div className="relative overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-[#0f1420] to-transparent p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green-500/[0.06] blur-[60px]" />
              <div className="relative flex items-start gap-4 text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-500/30 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                      {statusTitle}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {statusBody}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTAs — welcome is now post-registration, so instead of
              pushing people to /login (they already are logged in)
              we push them to predictions (discovery) with a
              secondary link to the checkout to pick a plan. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href={loc("/predictions")}
              className="btn-gradient group inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 sm:w-auto sm:text-base"
            >
              Browse today&apos;s predictions
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={loc("/checkout")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:w-auto"
            >
              <Sparkles className="h-4 w-4 text-green-500" />
              Pick your subscription
            </Link>
          </motion.div>

          {/* Email hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500"
          >
            <Mail className="h-3.5 w-3.5 text-green-500/70" />
            {t("welcome.emailHint")}
          </motion.p>
        </section>

        {/* ── Quickstart timeline ── */}
        <QuickstartSection />

        {/* ── Dashboard tour ── */}
        <DashboardTourSection />

        {/* ── Stats strip ── */}
        <section className="mx-auto mt-24 max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((s: { icon: typeof Users; value: string; label: string }, i: number) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-green-500/20 hover:shadow-md"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-50">
                    <s.icon className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                      {s.value}
                    </div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Next steps timeline ── */}
        <section className="mx-auto mt-24 max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-green-500" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("welcome.nextTitle")}
              </span>
            </div>
          </motion.div>

          <div className="relative grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Connector line (desktop) */}
            <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent md:block" />

            {nextSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-green-500/20 hover:shadow-md"
              >
                {/* Step number */}
                <div className="absolute -top-3 left-6 flex h-6 items-center justify-center rounded-full border border-green-500/30 bg-background px-2.5 font-mono text-[10px] font-bold text-green-600">
                  STEP {i + 1}
                </div>

                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-50">
                  <step.icon className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Testimonial ── */}
        <section className="mx-auto mt-24 max-w-3xl px-6">
          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10"
          >
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-green-500/[0.04] blur-[100px]" />
            <Quote
              className="mx-auto mb-4 h-8 w-8 text-green-500/70"
              aria-hidden
            />
            <blockquote className="relative text-lg font-medium italic leading-relaxed text-slate-600 sm:text-xl">
              {t("welcome.quote")}
            </blockquote>
            <figcaption className="relative mt-5 text-sm font-semibold text-slate-500">
              {t("welcome.quoteAuthor")}
            </figcaption>
          </motion.figure>
        </section>

        {/* ── Bottom CTA + support note ── */}
        <section className="mx-auto mt-24 max-w-3xl px-6 text-center">
          <Link
            href={loc("/predictions")}
            className="btn-gradient group inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50"
          >
            <Rocket className="h-4 w-4" />
            Start exploring predictions
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500/70" />
            {t("welcome.footerNote")}
          </p>
        </section>
      </main>

      <BetsPlugFooter />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Quickstart timeline
 *
 * A visual "roadmap" that sits directly under the hero and walks
 * new members through their first 10 minutes on BetsPlug. The
 * desktop version uses an SVG winding path with numbered pin
 * markers above each step card (echoing the classic infographic
 * "road" metaphor). The mobile version collapses into a clean
 * vertical timeline with a dashed green connector.
 * ────────────────────────────────────────────────────────────── */
function QuickstartSection() {
  const { t } = useTranslations();

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
    <section className="relative mx-auto mt-28 max-w-6xl px-6 sm:mt-32">
      {/* Eyebrow + title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mb-14 text-center"
      >
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5">
          <Rocket className="h-3.5 w-3.5 text-green-500" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">
            {t("welcome.quickstartEyebrow")}
          </span>
        </div>
        <h2 className="mx-auto max-w-3xl text-balance break-words text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          {t("welcome.quickstartTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-sm leading-relaxed text-slate-500 sm:text-base">
          {t("welcome.quickstartSubtitle")}
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-green-500" />
          {t("welcome.quickstartDuration")}
        </div>
      </motion.div>

      {/* ── Desktop: winding road with pins ── */}
      <div className="relative hidden lg:block">
        {/* SVG winding path — sits behind the cards and connects
            each step. The path is purely decorative and uses a
            dashed white stroke to evoke a road. */}
        <svg
          className="pointer-events-none absolute inset-x-0 top-[92px] h-[140px] w-full"
          viewBox="0 0 1200 140"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="qs-road-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#4ade80" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Road base */}
          <path
            d="M 60 70 Q 180 10, 300 70 T 540 70 T 780 70 T 1020 70 T 1140 70"
            fill="none"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Center dashed line */}
          <path
            d="M 60 70 Q 180 10, 300 70 T 540 70 T 780 70 T 1020 70 T 1140 70"
            fill="none"
            stroke="url(#qs-road-grad)"
            strokeWidth="2"
            strokeDasharray="10 10"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative grid grid-cols-5 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* Pin marker */}
              <div className="relative mb-10 flex flex-col items-center">
                <div className="relative flex h-16 w-12 items-end justify-center">
                  {/* Pin body */}
                  <div className="absolute inset-x-0 top-0 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/40 ring-2 ring-green-300/30">
                    <span className="text-sm font-black text-white">
                      {i + 1}
                    </span>
                  </div>
                  {/* Pin tail */}
                  <div className="h-4 w-4 rotate-45 bg-gradient-to-br from-green-500 to-emerald-600 shadow-md shadow-green-500/40" />
                </div>
                {/* Ground dot on the "road" */}
                <div className="mt-1 h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
              </div>

              {/* Step card */}
              <div className="group relative w-full flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all hover:border-green-500/25 hover:shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/20 bg-green-50">
                    <step.icon className="h-4 w-4 text-green-500" />
                  </div>
                  <h3 className="mb-2 text-sm font-bold leading-tight text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {step.body}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                    <Clock className="h-3 w-3 text-green-500/80" />
                    {step.duration}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Mobile / tablet: vertical timeline ── */}
      <div className="relative lg:hidden">
        {/* Vertical dashed connector */}
        <div
          className="pointer-events-none absolute bottom-10 left-[27px] top-10 w-px border-l-2 border-dashed border-green-500/20 sm:left-[35px]"
          aria-hidden
        />

        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="relative flex gap-5 sm:gap-6"
            >
              {/* Pin */}
              <div className="relative z-10 flex shrink-0 flex-col items-center">
                <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/40 ring-2 ring-green-300/30 sm:h-[70px] sm:w-[70px]">
                  <div className="flex flex-col items-center">
                    <step.icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                    <span className="text-[9px] font-black tracking-wider text-white sm:text-[10px]">
                      STEP {i + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card */}
              <div className="group relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-green-500/25 hover:shadow-md">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold leading-tight text-slate-900">
                      {step.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                      <Clock className="h-2.5 w-2.5" />
                      {step.duration}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {step.body}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Dashboard tour
 *
 * A visual "lay of the land" grid that shows newcomers where to
 * find the 6 most important areas of the dashboard. Each card
 * mimics the dashboard sidebar: icon tile on the left, title +
 * short description, and a "where to find it" breadcrumb pill
 * at the bottom. A mock browser chrome frames the whole grid so
 * it looks like a preview of the actual app. A pro-tip banner
 * at the bottom highlights the ⌘K command palette shortcut.
 * ────────────────────────────────────────────────────────────── */
function DashboardTourSection() {
  const { t } = useTranslations();

  const tourItems = [
    {
      icon: LayoutDashboard,
      title: t("welcome.tour1Title"),
      body: t("welcome.tour1Body"),
      where: t("welcome.tour1Where"),
      accent: "from-green-400 to-emerald-600",
    },
    {
      icon: LineChart,
      title: t("welcome.tour2Title"),
      body: t("welcome.tour2Body"),
      where: t("welcome.tour2Where"),
      accent: "from-emerald-400 to-teal-600",
    },
    {
      icon: History,
      title: t("welcome.tour3Title"),
      body: t("welcome.tour3Body"),
      where: t("welcome.tour3Where"),
      accent: "from-lime-400 to-green-600",
    },
    {
      icon: Radio,
      title: t("welcome.tour4Title"),
      body: t("welcome.tour4Body"),
      where: t("welcome.tour4Where"),
      accent: "from-teal-400 to-emerald-600",
    },
    {
      icon: MessageCircle,
      title: t("welcome.tour5Title"),
      body: t("welcome.tour5Body"),
      where: t("welcome.tour5Where"),
      accent: "from-green-400 to-lime-600",
    },
    {
      icon: Settings,
      title: t("welcome.tour6Title"),
      body: t("welcome.tour6Body"),
      where: t("welcome.tour6Where"),
      accent: "from-emerald-400 to-green-600",
    },
  ];

  return (
    <section className="relative mx-auto mt-28 max-w-6xl px-6 sm:mt-32">
      {/* Eyebrow + title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5">
          <LayoutDashboard className="h-3.5 w-3.5 text-green-500" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">
            {t("welcome.tourEyebrow")}
          </span>
        </div>
        <h2 className="mx-auto max-w-3xl text-balance break-words text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          {t("welcome.tourTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-sm leading-relaxed text-slate-500 sm:text-base">
          {t("welcome.tourSubtitle")}
        </p>
      </motion.div>

      {/* ── Mock browser chrome wrapper ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[360px] w-[360px] rounded-full bg-green-500/[0.04] blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-[360px] w-[360px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />

        {/* Browser chrome top bar */}
        <div className="relative flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="inline-flex max-w-full items-center gap-2 truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500 sm:max-w-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              <span className="truncate">app.betsplug.com/dashboard</span>
            </div>
          </div>
          <div className="hidden h-5 w-12 sm:block" />
        </div>

        {/* Grid of tour items */}
        <div className="relative grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-2 lg:grid-cols-3">
          {tourItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4 }}
              className="group relative overflow-hidden bg-white p-6 transition-all hover:bg-slate-50"
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative">
                {/* Header: icon tile + step number */}
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} shadow-lg shadow-green-500/20 ring-1 ring-green-300/20`}
                  >
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-700">
                    0{i + 1}
                  </span>
                </div>

                {/* Title + body */}
                <h3 className="mb-2 text-base font-bold leading-tight text-slate-900">
                  {item.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-500">
                  {item.body}
                </p>

                {/* "Where to find it" breadcrumb */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-50 px-3 py-1 font-mono text-[10px] font-semibold text-green-600 transition-all group-hover:border-green-500/40 group-hover:bg-green-100">
                  <ChevronRight className="h-3 w-3" />
                  {item.where}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Pro-tip banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative mt-6 flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-[#0f1420] to-transparent p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-green-500/[0.06] blur-[80px]" />
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-green-500/30 bg-green-50">
          <Command className="h-5 w-5 text-green-500" />
        </div>
        <div className="relative flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-600">
              {t("welcome.tourProTipTitle")}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
              ⌘ K
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            {t("welcome.tourProTipBody")}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

export default WelcomeContent;
