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
} from "lucide-react";

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

// ─── Today's picks preview (mock for landing) ──────────────────────────────

const todaysPicks = [
  {
    league: "Premier League",
    home: "Arsenal",
    away: "Chelsea",
    homeProb: 52,
    drawProb: 24,
    awayProb: 24,
    confidence: 78,
    time: "15:00",
    hot: true,
  },
  {
    league: "La Liga",
    home: "Barcelona",
    away: "Real Madrid",
    homeProb: 41,
    drawProb: 27,
    awayProb: 32,
    confidence: 82,
    time: "21:00",
    hot: true,
  },
  {
    league: "Bundesliga",
    home: "Bayern Munich",
    away: "Dortmund",
    homeProb: 58,
    drawProb: 22,
    awayProb: 20,
    confidence: 85,
    time: "18:30",
    hot: false,
  },
  {
    league: "Serie A",
    home: "Inter Milan",
    away: "AC Milan",
    homeProb: 45,
    drawProb: 28,
    awayProb: 27,
    confidence: 71,
    time: "20:45",
    hot: false,
  },
];

function PickCard({
  pick,
}: {
  pick: (typeof todaysPicks)[0];
}) {
  const best =
    pick.homeProb >= pick.awayProb && pick.homeProb >= pick.drawProb
      ? "home"
      : pick.drawProb >= pick.awayProb
      ? "draw"
      : "away";

  return (
    <div className="glass-card-hover group relative overflow-hidden p-5">
      {pick.hot && (
        <div className="absolute right-3 top-3">
          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <Zap className="h-3 w-3" /> Hot
          </span>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {pick.league}
        </span>
        <span className="text-[10px] text-slate-600">{pick.time}</span>
      </div>

      <p className="mb-4 text-lg font-bold text-white">
        {pick.home} <span className="text-slate-500 font-normal">vs</span> {pick.away}
      </p>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06] gap-0.5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pick.homeProb}%`,
              background: "#3b82f6",
              opacity: best === "home" ? 1 : 0.3,
            }}
          />
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pick.drawProb}%`,
              background: "#f59e0b",
              opacity: best === "draw" ? 1 : 0.3,
            }}
          />
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pick.awayProb}%`,
              background: "#ef4444",
              opacity: best === "away" ? 1 : 0.3,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className={best === "home" ? "font-bold text-blue-400" : "text-slate-500"}>
            {pick.homeProb}%
          </span>
          <span className={best === "draw" ? "font-bold text-amber-400" : "text-slate-500"}>
            {pick.drawProb}%
          </span>
          <span className={best === "away" ? "font-bold text-red-400" : "text-slate-500"}>
            {pick.awayProb}%
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Confidence</span>
        <span
          className={`text-sm font-extrabold ${
            pick.confidence >= 80
              ? "text-emerald-400"
              : pick.confidence >= 60
              ? "text-amber-400"
              : "text-red-400"
          }`}
        >
          {pick.confidence}%
        </span>
      </div>
    </div>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1">
          <Link href="/" className="flex items-center">
            <img src="/logo.webp" alt="Betsplug" className="h-[72px] w-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
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
              className="rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.2] hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/subscriptions"
              className="btn-gradient rounded-lg px-5 py-2 text-sm font-semibold text-white"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-[120px]" />
          <div className="absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.05] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-blue-300">
                Live predictions updated every 60 seconds
              </span>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Data-Driven
              <br />
              <span className="gradient-text">Sports Predictions</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
              Our AI analyses thousands of data points per match — team form, head-to-head records,
              Elo ratings, and Poisson models — to calculate win probabilities with{" "}
              <span className="font-semibold text-white">proven accuracy</span>.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/predictions"
                className="btn-gradient flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25"
              >
                View Today&apos;s Predictions
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-8 py-4 text-base font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-white/[0.2] hover:bg-white/[0.06]"
              >
                See How It Works
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: Shield, label: "Verified Data" },
                { icon: Brain, label: "4 AI Models" },
                { icon: Target, label: "75%+ Accuracy" },
                { icon: LineChart, label: "Live Tracking" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon className="h-4 w-4 text-blue-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Today's Predictions Preview ── */}
      <section id="predictions" className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Today&apos;s Picks
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Today&apos;s Top Predictions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Our ensemble model has analysed today&apos;s fixtures. Here are the highest-confidence picks.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {todaysPicks.map((pick) => (
              <PickCard key={`${pick.home}-${pick.away}`} pick={pick} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/predictions"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              View all predictions
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
              Our Process
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              How Our AI Makes Predictions
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                step: "01",
                icon: BarChart3,
                title: "Data Collection",
                desc: "We ingest real-time data from official APIs — fixtures, results, standings, team stats, and historical records.",
                color: "blue",
              },
              {
                step: "02",
                icon: Brain,
                title: "AI Analysis",
                desc: "Four ML models (Elo, Poisson, Logistic, Ensemble) process 24+ features per match for accurate probabilities.",
                color: "purple",
              },
              {
                step: "03",
                icon: Target,
                title: "Probability Output",
                desc: "Each match gets home/draw/away win percentages with a confidence score. Higher confidence = stronger signal.",
                color: "emerald",
              },
              {
                step: "04",
                icon: Trophy,
                title: "Track & Improve",
                desc: "Every prediction is evaluated post-match. Our models continuously learn and improve from results.",
                color: "amber",
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="glass-card-hover relative p-6">
                <span className="absolute right-4 top-4 text-5xl font-black text-white/[0.03]">
                  {step}
                </span>
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                    color === "blue"
                      ? "bg-blue-500/10"
                      : color === "purple"
                      ? "bg-purple-500/10"
                      : color === "emerald"
                      ? "bg-emerald-500/10"
                      : "bg-amber-500/10"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      color === "blue"
                        ? "text-blue-400"
                        : color === "purple"
                        ? "text-purple-400"
                        : color === "emerald"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Track Record Stats ── */}
      <section id="track-record" className="relative py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 bottom-0 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Proven Results
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Our Track Record Speaks
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Every prediction is logged, evaluated, and publicly tracked. Full transparency — no hidden results.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: 1200, suffix: "+", label: "Predictions Made", icon: Activity },
              { value: 75, suffix: "%", label: "Overall Accuracy", icon: Target },
              { value: 4, suffix: "", label: "AI Models Active", icon: Brain },
              { value: 15, suffix: "+", label: "Leagues Covered", icon: Trophy },
            ].map(({ value, suffix, label, icon: Icon }) => (
              <div key={label} className="glass-card p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                  <Icon className="h-7 w-7 text-blue-400" />
                </div>
                <p className="text-4xl font-extrabold gradient-text">
                  <AnimatedNumber target={value} suffix={suffix} />
                </p>
                <p className="mt-2 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="glass-card relative overflow-hidden p-12">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/[0.08] to-emerald-500/[0.04]" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to Make Smarter Decisions?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                Join thousands of sports analysts who use our data-driven predictions.
                Start with a free trial — no credit card required.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/subscriptions"
                  className="btn-gradient flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25"
                >
                  View Plans & Pricing
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                {["3-Day Money-Back Guarantee", "Cancel Anytime", "Instant Access"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Why Choose Betsplug?</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <div key={title} className="glass-card-hover p-6">
                <Icon className="mb-3 h-6 w-6 text-blue-400" />
                <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <img src="/logo.webp" alt="Betsplug" className="h-10 w-auto drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
            </div>

            <div className="flex items-center gap-8">
              <Link href="/about" className="text-sm text-slate-500 hover:text-slate-300">About</Link>
              <Link href="/subscriptions" className="text-sm text-slate-500 hover:text-slate-300">Pricing</Link>
              <Link href="/predictions" className="text-sm text-slate-500 hover:text-slate-300">Predictions</Link>
              <Link href="/trackrecord" className="text-sm text-slate-500 hover:text-slate-300">Track Record</Link>
            </div>

            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} Betsplug. All rights reserved.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-amber-400">Disclaimer:</span> Betsplug is a data analytics
              platform. We calculate probabilities using statistical models. This is{" "}
              <span className="font-semibold text-slate-300">not gambling advice</span>. All outputs are simulated
              and hypothetical. Always make your own informed decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
