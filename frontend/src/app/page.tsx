"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  ChevronRight,
  Star,
  Trophy,
  Target,
  Activity,
  ArrowRight,
  CheckCircle2,
  Users,
  Brain,
  LineChart,
  Sparkles,
} from "lucide-react";
import { GetStartedButton } from "@/components/ui/get-started-button";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { TestimonialsSection } from "@/components/ui/testimonials-section";

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#080b14]/80 backdrop-blur-xl transition-all duration-300">
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 ${
            isScrolled ? "py-1 md:py-0.5" : "py-3 md:py-1"
          }`}
        >
          <Link href="/" className="flex items-center">
            <img
              src="/logo.webp"
              alt="Betsplug"
              className={`w-auto drop-shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all duration-300 ${
                isScrolled
                  ? "h-8 sm:h-10 md:h-12 lg:h-14"
                  : "h-10 sm:h-14 md:h-16 lg:h-20"
              }`}
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="#predictions" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              Predictions
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              How It Works
            </Link>
            <Link href="#track-record" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              Track Record
            </Link>
            <Link href="/subscriptions" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.2] hover:text-white sm:inline-block"
            >
              Login
            </Link>
            <Link
              href="/subscriptions"
              className="btn-gradient rounded-full px-5 py-2.5 text-sm font-bold shadow-lg shadow-green-500/20"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-green-500/[0.08] blur-[140px]" />
          <div className="absolute right-10 top-40 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
          <div className="absolute left-10 top-80 h-[300px] w-[300px] rounded-full bg-lime-500/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            {/* Left: Copy */}
            <div>
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 backdrop-blur-sm">
                <span className="live-dot" />
                <span className="text-xs font-semibold uppercase tracking-wider text-green-300">
                  Be ahead of the bookmakers
                </span>
              </div>

              <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Best AI-driven
                <br />
                <span className="gradient-text">sports predictions</span>
                <br />
                for your edge.
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-400">
                Betsplug unites data, Elo ratings, Poisson models and machine learning
                into one platform. Live probabilities, deep insights, proven track record —
                built for serious sports analysts.
              </p>

              {/* Users trust bar */}
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <div className="flex items-center -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-10 w-10 rounded-full border-2 border-[#080b14] object-cover"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white">
                    <AnimatedNumber target={1500} suffix="+" />
                  </p>
                  <p className="text-xs text-slate-500">Active Users</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/predictions">
                  <GetStartedButton>View Predictions</GetStartedButton>
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-green-500/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10">
                    <ArrowRight className="h-3.5 w-3.5 -rotate-45" />
                  </span>
                  How it works
                </Link>
              </div>
            </div>

            {/* Right: Floating stats card */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-md">
                {/* Glow halo */}
                <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-green-500/30 via-emerald-500/10 to-transparent blur-3xl" />

                {/* Main phone-like card */}
                <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 backdrop-blur-xl shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Live Pick
                      </p>
                      <p className="mt-1 text-xl font-extrabold text-white">Arsenal vs Chelsea</p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-[10px] font-bold uppercase text-green-400">
                      <Sparkles className="h-3 w-3" /> Hot
                    </span>
                  </div>

                  <div className="mb-4 rounded-2xl border border-white/5 bg-black/30 p-4">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="text-sm text-slate-400">Home win</span>
                      <span className="text-2xl font-extrabold text-green-400">52%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full w-[52%] rounded-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]" />
                    </div>
                    <div className="mt-3 flex gap-2 text-xs text-slate-500">
                      <span>Draw 24%</span>
                      <span>·</span>
                      <span>Away 24%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Confidence", value: "78%" },
                      { label: "Elo Δ", value: "+24" },
                      { label: "Edge", value: "+6.2%" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-white/5 bg-black/20 p-3 text-center"
                      >
                        <p className="text-[10px] font-medium uppercase text-slate-500">{s.label}</p>
                        <p className="mt-1 text-sm font-bold text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/predictions"
                    className="btn-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
                  >
                    Join Now <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Floating mini-card */}
                <div className="absolute -left-10 -top-6 rotate-[-6deg] rounded-2xl border border-white/10 bg-[#0d1220]/90 p-3 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Win Rate</p>
                      <p className="text-sm font-extrabold text-white">75.4%</p>
                    </div>
                  </div>
                </div>

                {/* Floating bottom card */}
                <div className="absolute -right-6 -bottom-4 rotate-[5deg] rounded-2xl border border-white/10 bg-[#0d1220]/90 p-3 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                      <Trophy className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Today</p>
                      <p className="text-sm font-extrabold text-white">12 Wins</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TRUSTED PARTNER SECTION — 3 cards with middle highlighted
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 grid gap-8 md:grid-cols-2 md:items-end">
            <div>
              <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Your <span className="gradient-text">trusted</span> partner
                <br />
                in sports analytics.
              </h2>
            </div>
            <p className="text-base leading-relaxed text-slate-400">
              Betsplug unites and secures a growing ecosystem of data sources, AI models,
              and proven strategies. One platform for data-driven sports analysts who refuse
              to guess.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="glass-card-hover relative overflow-hidden p-8">
              <p className="mb-8 text-5xl font-extrabold text-white/10">01.</p>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Service for Any Level of Expertise.</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                From beginner to pro-analyst — our dashboards, tutorials, and transparent stats
                make it easy to understand every prediction.
              </p>
            </div>

            {/* Card 2 — HIGHLIGHTED */}
            <div className="card-highlight relative overflow-hidden p-8">
              <p className="mb-8 text-5xl font-extrabold text-black/15">02.</p>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black/15">
                <Brain className="h-6 w-6 text-black" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-black">Industry best practices.</h3>
              <p className="mb-6 text-sm leading-relaxed text-black/80">
                Four AI models (Elo, Poisson, Logistic, Ensemble) combine to deliver predictions
                you can trust. Proven methods, transparent results.
              </p>
              <Link
                href="#track-record"
                className="inline-flex items-center gap-1 text-sm font-bold text-black hover:gap-2 transition-all"
              >
                Learn More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="glass-card-hover relative overflow-hidden p-8">
              <p className="mb-8 text-5xl font-extrabold text-white/10">03.</p>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Protected by transparency.</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                Every prediction is logged, tracked, and publicly verified. No hidden results,
                no cherry-picking — just data you can audit yourself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS / CHART SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="track-record" className="relative py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-green-500/[0.05] blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            {/* Left: chart visualization */}
            <div className="relative">
              <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl">
                {/* Top stat */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-400">
                      Track Record
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-white">75.4%</p>
                    <p className="text-xs text-slate-500">Overall accuracy</p>
                  </div>
                  <span className="rounded-full bg-green-500/15 px-3 py-1 text-[11px] font-bold text-green-400">
                    ▲ +5.45%
                  </span>
                </div>

                {/* Mock line chart */}
                <div className="relative h-48">
                  <svg viewBox="0 0 400 180" className="h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 140 L 40 120 L 80 130 L 120 90 L 160 100 L 200 70 L 240 80 L 280 50 L 320 60 L 360 30 L 400 40 L 400 180 L 0 180 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M 0 140 L 40 120 L 80 130 L 120 90 L 160 100 L 200 70 L 240 80 L 280 50 L 320 60 L 360 30 L 400 40"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: "drop-shadow(0 0 8px rgba(74, 222, 128, 0.6))" }}
                    />
                    {/* Dots */}
                    {[
                      [160, 100],
                      [280, 50],
                      [360, 30],
                    ].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="5" fill="#4ade80" />
                    ))}
                  </svg>
                </div>

                {/* Bottom metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                  {[
                    { label: "Predictions", value: "1,284" },
                    { label: "Models", value: "4" },
                    { label: "Leagues", value: "15+" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-extrabold text-white">{s.value}</p>
                      <p className="text-[10px] uppercase text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating mini card */}
              <div className="absolute -right-4 -top-4 rotate-3 rounded-2xl border border-white/10 bg-[#0d1220]/95 p-4 backdrop-blur-xl shadow-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  This week
                </p>
                <p className="mt-1 text-xl font-extrabold text-green-400">+12.4%</p>
                <p className="text-[10px] text-slate-500">ROI</p>
              </div>
            </div>

            {/* Right: copy */}
            <div>
              <span className="mb-4 inline-block rounded-full bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
                Proven Results
              </span>
              <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Trusted <span className="gradient-text">platform</span>
                <br />
                anytime &amp; anywhere.
              </h2>

              <div className="mt-6 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-green-400 text-green-400" />
                ))}
                <span className="ml-2 text-sm text-slate-400">4.9 / 5 from 1,200+ analysts</span>
              </div>

              <p className="mt-6 text-base leading-relaxed text-slate-400">
                This is a unified platform that secures a{" "}
                <span className="font-semibold text-white">growing ecosystem</span> of sports data,
                AI predictions, and strategy backtesting tools. All predictions are logged and
                publicly tracked — full transparency, always.
              </p>

              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Whether you follow football, basketball, or tennis, Betsplug unites data and
                machine learning into insights you can actually use.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/predictions">
                  <GetStartedButton>Learn More</GetStartedButton>
                </Link>
                <Link
                  href="#faq"
                  className="text-sm font-semibold text-slate-400 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Ask question?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES GRID
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="predictions" className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <span className="mb-4 inline-block rounded-full bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
              Features
            </span>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
              Everything you need to <span className="gradient-text">win smart.</span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Real-Time Predictions",
                desc: "Live probability updates as match conditions change. Never miss a value opportunity.",
              },
              {
                icon: Brain,
                title: "4 AI Models Combined",
                desc: "Elo, Poisson, Logistic Regression, and our proprietary Ensemble model for maximum accuracy.",
              },
              {
                icon: LineChart,
                title: "Strategy Backtesting",
                desc: "Test your betting strategies against historical data. Know your edge before you place a bet.",
              },
              {
                icon: Shield,
                title: "Verified Data Sources",
                desc: "We only use official APIs and verified data providers. No scraped or unreliable data.",
              },
              {
                icon: Star,
                title: "Bet of the Day",
                desc: "Our algorithm picks the single highest-value prediction each day. Premium members get it first.",
              },
              {
                icon: Users,
                title: "Growing Community",
                desc: "Join a community of data-driven sports analysts who share insights and strategies.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card-hover group p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 transition-all group-hover:bg-green-500/20">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TESTIMONIALS
         ═══════════════════════════════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] via-emerald-500/[0.04] to-transparent p-10 backdrop-blur-xl md:p-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-green-500/20 blur-[100px]" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px]" />

            <div className="relative text-center">
              <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
                Ready to win?
              </span>
              <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Start making <span className="gradient-text">smarter picks</span>
                <br />
                today.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-slate-400">
                Join thousands of sports analysts who use Betsplug&apos;s AI-driven predictions.
                Free trial — no credit card required.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/subscriptions">
                  <GetStartedButton>Start Free Trial</GetStartedButton>
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-semibold text-slate-400 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Learn more →
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                {["3-Day Money-Back", "Cancel Anytime", "Instant Access"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════════════════════════════ */}
      <BetsPlugFooter />
    </div>
  );
}
