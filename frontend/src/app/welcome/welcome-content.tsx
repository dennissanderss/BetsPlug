"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Sparkles,
  PartyPopper,
  ArrowRight,
  Home,
  LogIn,
  ShieldCheck,
  Mail,
  Users,
  TrendingUp,
  Target,
  CheckCircle2,
  Trophy,
  Flame,
  Quote,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * WelcomeContent — post-checkout thank-you / welcome page.
 *
 * This is the first thing a visitor sees the moment after they
 * finish checkout. The goal is unapologetically emotional:
 *   1. Validate the decision ("you made the right choice")
 *   2. Make them feel like they just joined an exclusive club
 *   3. Remove any remaining doubts about what happens next
 *   4. Drive one clear action: log into the dashboard
 *
 * The flow mirrors the rest of the BetsPlug marketing pages
 * (dark ambient background, green accent gradient, motion
 * reveals, SiteNav + BetsPlugFooter) so the brand feels
 * consistent from landing → checkout → welcome.
 *
 * Query params:
 *   plan     — which plan was purchased (bronze/silver/gold/platinum)
 *   billing  — monthly | yearly
 *   trial    — "1" if the user is on the free trial, "0" otherwise
 */
export function WelcomeContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const params = useSearchParams();

  const isTrial = (params?.get("trial") ?? "0") === "1";
  const planId = (params?.get("plan") ?? "gold").toLowerCase();

  // Tiny confetti-style burst on mount — not a full library, just a
  // handful of CSS particles that fade and drift upward for ~2s.
  const [burst, setBurst] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBurst(false), 2400);
    return () => clearTimeout(t);
  }, []);

  const planLabel = useMemo(() => {
    const map: Record<string, string> = {
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold",
      platinum: "Platinum",
    };
    return map[planId] ?? "Gold";
  }, [planId]);

  const statusTitle = isTrial
    ? t("welcome.trialTitle")
    : t("welcome.paidTitle");
  const statusBody = isTrial
    ? t("welcome.trialBody")
    : t("welcome.paidBody");

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

  const stats = [
    {
      icon: Users,
      value: "12,400+",
      label: t("welcome.statMembers"),
    },
    {
      icon: TrendingUp,
      value: "+14.6%",
      label: t("welcome.statRoi"),
    },
    {
      icon: Flame,
      value: "380+",
      label: t("welcome.statPicks"),
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#060912] text-white">
      {/* ── Ambient background — matches the rest of the site ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.08] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-[160px]" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-green-500/[0.05] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.6) 1px, transparent 1px)",
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
      <main className="relative z-10 pt-36 pb-24 sm:pt-44">
        <section className="mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-4 py-2 backdrop-blur-sm"
          >
            <PartyPopper className="h-4 w-4 text-green-400" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">
              {t("welcome.badge")}
            </span>
          </motion.div>

          {/* Big emotional title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-4xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {t("welcome.title")}{" "}
            <span className="bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
              {t("welcome.titleHighlight")}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            {t("welcome.subtitle")}
          </motion.p>

          {/* Status card — trial vs paid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-10 max-w-2xl"
          >
            <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.1] via-green-500/[0.04] to-transparent p-6 backdrop-blur-sm">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green-500/[0.12] blur-[60px]" />
              <div className="relative flex items-start gap-4 text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-500/30 bg-green-500/[0.1]">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-white sm:text-lg">
                      {statusTitle}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/[0.1] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-300">
                      <Trophy className="h-3 w-3" />
                      {planLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
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
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href={loc("/login")}
              className="btn-gradient group inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 sm:w-auto sm:text-base"
            >
              {t("welcome.ctaPrimary")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={loc("/")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 py-4 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-white/[0.25] hover:bg-white/[0.06] hover:text-white sm:w-auto"
            >
              <Home className="h-4 w-4" />
              {t("welcome.ctaSecondary")}
            </Link>
          </motion.div>

          {/* Email hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500"
          >
            <Mail className="h-3.5 w-3.5 text-green-400/70" />
            {t("welcome.emailHint")}
          </motion.p>
        </section>

        {/* ── Stats strip ── */}
        <section className="mx-auto mt-24 max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-green-500/20 hover:bg-white/[0.04]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/[0.08]">
                    <s.icon className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold tracking-tight text-white">
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
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-green-400" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-green-500/20 hover:bg-white/[0.04]"
              >
                {/* Step number */}
                <div className="absolute -top-3 left-6 flex h-6 items-center justify-center rounded-full border border-green-500/30 bg-[#060912] px-2.5 font-mono text-[10px] font-bold text-green-300">
                  STEP {i + 1}
                </div>

                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/[0.08]">
                  <step.icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="mb-2 text-base font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
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
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-8 text-center backdrop-blur-sm sm:p-10"
          >
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-green-500/[0.08] blur-[100px]" />
            <Quote
              className="mx-auto mb-4 h-8 w-8 text-green-400/70"
              aria-hidden
            />
            <blockquote className="relative text-lg font-medium italic leading-relaxed text-slate-200 sm:text-xl">
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
            href={loc("/dashboard")}
            className="btn-gradient group inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50"
          >
            <LogIn className="h-4 w-4" />
            {t("welcome.ctaPrimary")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400/70" />
            {t("welcome.footerNote")}
          </p>
        </section>
      </main>

      <BetsPlugFooter />
    </div>
  );
}

export default WelcomeContent;
