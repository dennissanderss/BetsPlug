"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Eye,
  FlaskConical,
  BarChart3,
  Database,
  Filter,
  Cpu,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Layers,
  Target,
  Activity,
  Info,
  Star,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";

// ─── Trust Pillar Data ────────────────────────────────────────────────────────

const trustPillars = [
  {
    icon: ShieldCheck,
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.25)",
    title: "Verified Data Sources",
    description:
      "We aggregate data from official league APIs, established sports data providers, and historical databases. Every data point is cross-referenced and validated before entering our models.",
  },
  {
    icon: Eye,
    color: "#10b981",
    glowColor: "rgba(16,185,129,0.25)",
    title: "Transparent Models",
    description:
      "Our forecasting engine uses well-documented statistical methods (Elo ratings, Poisson regression, logistic regression) — not black-box algorithms. You can see exactly which factors drive each prediction.",
  },
  {
    icon: FlaskConical,
    color: "#a855f7",
    glowColor: "rgba(168,85,247,0.25)",
    title: "Backtested on 1000+ Matches",
    description:
      "Every strategy is rigorously backtested using walk-forward validation on historical data. No data leakage, no cherry-picking — just honest performance metrics.",
  },
  {
    icon: BarChart3,
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.25)",
    title: "Live Track Record",
    description:
      "We don't hide our results. Our public track record shows every prediction, every outcome, updated in real-time. The good AND the bad.",
  },
];

// ─── Pipeline Steps ───────────────────────────────────────────────────────────

const pipelineSteps = [
  {
    number: "01",
    icon: Database,
    color: "#3b82f6",
    title: "Data Collection",
    description:
      "Match data, team statistics, player information, historical results, and standings are collected from multiple sources including official league feeds, established sports data aggregators (API-Football, TheSportsDB, Football-Data.org), and historical archives.",
    tags: ["Official APIs", "Historical Archives", "Real-time Feeds"],
  },
  {
    number: "02",
    icon: Filter,
    color: "#10b981",
    title: "Data Validation",
    description:
      "Every incoming data point passes through validation checks: duplicate detection, completeness scoring, cross-source verification, and anomaly detection. Unreliable data is flagged and excluded.",
    tags: ["Deduplication", "Completeness Scoring", "Anomaly Detection"],
  },
  {
    number: "03",
    icon: Layers,
    color: "#a855f7",
    title: "Feature Engineering",
    description:
      "Raw data is transformed into 24+ analytical features per match: team form (last 5/10 matches), home/away performance splits, head-to-head records, goal averages, league position context, injury impact scores, and Elo rating differentials.",
    tags: ["24+ Features", "Form Analysis", "Elo Differentials"],
  },
  {
    number: "04",
    icon: Cpu,
    color: "#f59e0b",
    title: "Model Prediction",
    description:
      "Four independent models analyze each match: Elo Rating System, Poisson Score Model, Logistic Regression, and a weighted Ensemble combining all three. Each model produces calibrated probability outputs.",
    tags: ["Elo Model", "Poisson Model", "Ensemble"],
  },
  {
    number: "05",
    icon: ClipboardCheck,
    color: "#ef4444",
    title: "Evaluation & Tracking",
    description:
      "Every prediction is stored immutably with its full feature snapshot. After the match, results are automatically evaluated using Brier Score, Log Loss, and calibration metrics. Nothing is deleted or modified.",
    tags: ["Brier Score", "Log Loss", "Immutable Records"],
  },
];

// ─── Model Data ───────────────────────────────────────────────────────────────

const models = [
  {
    icon: TrendingUp,
    color: "#3b82f6",
    borderColor: "rgba(59,130,246,0.3)",
    title: "Elo Rating Model",
    badge: "Classic",
    badgeColor: "#3b82f6",
    description:
      "Originally developed for chess rankings, adapted for team sports. Each team maintains a dynamic rating that updates after every match. Win probability is derived from the rating difference between opponents.",
    details: [
      "Accounts for home advantage and margin of victory",
      "Continuous rating updates after every match result",
      "Self-correcting: strong upsets produce large rating swings",
    ],
    usedBy: "Used by: FIFA, FiveThirtyEight, international federations",
  },
  {
    icon: Activity,
    color: "#10b981",
    borderColor: "rgba(16,185,129,0.3)",
    title: "Poisson Regression",
    badge: "Statistical",
    badgeColor: "#10b981",
    description:
      "A statistical model that predicts the number of goals/points each team will score based on their attack strength and the opponent's defense weakness. Produces a full score probability matrix.",
    details: [
      "Derives 1X2 probabilities from score probability matrix",
      "Models attacking and defensive strength independently",
      "Handles over/under and correct score markets",
    ],
    usedBy: "Foundation: Dixon-Coles method (1997), widely used in academic sports analytics",
  },
  {
    icon: Target,
    color: "#a855f7",
    borderColor: "rgba(168,85,247,0.3)",
    title: "Logistic Regression",
    badge: "ML Model",
    badgeColor: "#a855f7",
    description:
      "A supervised machine learning model trained on 24+ match features including form, standings, head-to-head history, and goal statistics. Outputs calibrated probabilities for each outcome.",
    details: [
      "Features are standardized to prevent scale bias",
      "Retrained monthly on rolling historical data",
      "Probability calibration applied via Platt scaling",
    ],
    usedBy: "Features: form streaks, xG, standings delta, H2H win rate, injury scores",
  },
  {
    icon: Layers,
    color: "#f59e0b",
    borderColor: "rgba(245,158,11,0.3)",
    title: "Ensemble Model",
    badge: "Best Performer",
    badgeColor: "#f59e0b",
    description:
      "Combines predictions from all three models using optimized weights. The ensemble consistently outperforms individual models because different models capture different aspects of match dynamics.",
    details: [
      "Weights optimized via cross-validation on holdout data",
      "Confidence = degree of model agreement across all three",
      "Reduces variance inherent in any single model approach",
    ],
    usedBy: "Consistently lowest Brier Score and highest calibration across backtests",
  },
];

// ─── Data Sources ─────────────────────────────────────────────────────────────

const dataSources = [
  {
    name: "API-Football",
    url: "https://api-football.com",
    description: "Live scores, fixtures, standings, player stats for 800+ leagues",
    type: "Primary",
    typeColor: "#3b82f6",
  },
  {
    name: "Football-Data.org",
    url: "https://football-data.org",
    description: "Historical match results and odds data, freely available for research",
    type: "Historical",
    typeColor: "#10b981",
  },
  {
    name: "TheSportsDB",
    url: "https://thesportsdb.com",
    description: "Open sports database with team and player metadata",
    type: "Metadata",
    typeColor: "#a855f7",
  },
  {
    name: "Basketball Reference",
    url: "https://basketball-reference.com",
    description: "Comprehensive NBA statistics and historical data",
    type: "NBA",
    typeColor: "#f59e0b",
  },
  {
    name: "Official League APIs",
    url: "#",
    description: "Direct feeds from Premier League, La Liga, NBA where available",
    type: "Official",
    typeColor: "#ef4444",
  },
];

const academicRefs = [
  {
    name: "Dixon & Coles (1997)",
    description: "Modelling Association Football Scores",
    url: "https://doi.org/10.2307/2986290",
  },
  {
    name: "Elo Rating System",
    description: "Arpad Elo (1978) — The Rating of Chessplayers",
    url: "https://en.wikipedia.org/wiki/Elo_rating_system",
  },
  {
    name: "Brier Score",
    description: "Glenn Brier (1950) — Verification of Forecasts Expressed in Terms of Probability",
    url: "https://en.wikipedia.org/wiki/Brier_score",
  },
  {
    name: "FiveThirtyEight Sports Methodology",
    description: "Nate Silver — Elo-based sports forecasting methodology",
    url: "https://fivethirtyeight.com/methodology/",
  },
];

// ─── Track Record Stats colors/labels (static metadata) ──────────────────────

const trackStatMeta = [
  {
    key: "total_predictions" as const,
    label: "Total Predictions",
    sublabel: "Analyzed",
    color: "#3b82f6",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "accuracy" as const,
    label: "Overall Accuracy",
    sublabel: "vs 50% random baseline",
    color: "#10b981",
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
  },
  {
    key: "log_loss" as const,
    label: "Log Loss",
    sublabel: "Lower is better",
    color: "#a855f7",
    format: (v: number) => v.toFixed(3),
  },
  {
    key: "brier_score" as const,
    label: "Brier Score",
    sublabel: "vs 0.25 baseline (lower = better)",
    color: "#f59e0b",
    format: (v: number) => v.toFixed(2),
  },
];

// ─── Disclaimer Items ─────────────────────────────────────────────────────────

const notItems = [
  { text: "We are NOT a betting advisory service", isNot: true },
  { text: "We do NOT guarantee any financial returns", isNot: true },
  { text: "We do NOT encourage gambling or wagering", isNot: true },
];

const isItems = [
  { text: "We ARE a data analytics platform for sports enthusiasts and researchers", isNot: false },
  { text: "All model outputs are simulations and should be treated as educational content", isNot: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AboutPage() {
  // Fetch real track record summary
  const { data: trackSummary, isError: trackError } = useQuery({
    queryKey: ["trackrecord-summary"],
    queryFn:  () => api.getTrackrecordSummary(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <main className="min-h-screen px-4 py-10 md:px-8 lg:px-12 max-w-6xl mx-auto space-y-20 animate-fade-in">

      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section className="text-center space-y-6 pt-6 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-2">
          <BookOpen className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
            Methodology & Transparency
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
          <span className="gradient-text">How BetsPlug Works</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed">
          Transparent, data-driven sports analysis built on proven statistical methods
        </p>

        <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-base">
          BetsPlug combines real-time data from multiple verified sources
          with advanced machine learning models to deliver probability-based match analysis.
          Every prediction is traceable, every model is backtested, and every result is tracked.
        </p>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-500/50" />
          <Zap className="h-4 w-4 text-blue-500/60" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-500/50" />
        </div>
      </section>

      {/* ── 2. Why Trust Our Data ────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            Why Trust Our Data?
          </h2>
          <p className="text-slate-400 text-sm">
            Four pillars of credibility that underpin every analysis
          </p>
        </div>

        <div
          className="glass-card p-6 md:p-8 glow-blue"
          style={{ borderColor: "rgba(59,130,246,0.25)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trustPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="flex gap-4 p-5 rounded-full transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full mt-0.5"
                    style={{
                      background: pillar.glowColor,
                      border: `1px solid ${pillar.color}40`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: pillar.color }} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-slate-100 text-sm">{pillar.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. Data Pipeline ─────────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            Our Data Pipeline
          </h2>
          <p className="text-slate-400 text-sm">
            From raw data to calibrated probability — every step documented
          </p>
        </div>

        <div className="relative">
          {/* Vertical connecting line */}
          <div
            className="absolute left-[27px] top-12 bottom-12 w-px hidden md:block"
            style={{
              background:
                "linear-gradient(to bottom, rgba(59,130,246,0.6), rgba(239,68,68,0.3))",
            }}
          />

          <div className="space-y-4">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="relative flex gap-5 group"
                >
                  {/* Step indicator */}
                  <div
                    className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full z-10 transition-all duration-200 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}30 0%, ${step.color}15 100%)`,
                      border: `2px solid ${step.color}50`,
                      boxShadow: `0 0 12px ${step.color}25`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: step.color }} />
                    <span
                      className="text-[9px] font-bold mt-0.5"
                      style={{ color: `${step.color}cc` }}
                    >
                      {step.number}
                    </span>
                  </div>

                  {/* Content card */}
                  <div
                    className="flex-1 glass-card-hover p-5 rounded-full"
                    style={{ borderColor: `${step.color}20` }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h3
                        className="font-semibold text-slate-100"
                        style={{ color: idx === 0 ? "#e2e8f0" : undefined }}
                      >
                        {step.title}
                      </h3>
                      <div className="flex gap-1.5 flex-wrap">
                        {step.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: `${step.color}15`,
                              color: `${step.color}cc`,
                              border: `1px solid ${step.color}30`,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Models Explained ──────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            Our Models Explained
          </h2>
          <p className="text-slate-400 text-sm">
            Four independent forecasting engines — not a black box
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {models.map((model) => {
            const Icon = model.icon;
            return (
              <div
                key={model.title}
                className="glass-card-hover p-6 rounded-full space-y-4 group"
                style={{ borderColor: model.borderColor }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `${model.color}20`,
                        border: `1px solid ${model.color}40`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: model.color }} />
                    </div>
                    <h3 className="font-semibold text-slate-100">{model.title}</h3>
                  </div>
                  <span
                    className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: `${model.badgeColor}20`,
                      color: model.badgeColor,
                      border: `1px solid ${model.badgeColor}40`,
                    }}
                  >
                    {model.badge}
                  </span>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed">{model.description}</p>

                {/* Detail bullets */}
                <ul className="space-y-1.5">
                  {model.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle
                        className="h-3.5 w-3.5 mt-0.5 shrink-0"
                        style={{ color: model.color }}
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer note */}
                <div
                  className="pt-2 border-t text-xs text-slate-500 italic"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  {model.usedBy}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. Data Sources ──────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            Data Sources & References
          </h2>
          <p className="text-slate-400 text-sm">
            Where our data comes from — full transparency on every feed
          </p>
        </div>

        <div className="glass-card p-6 md:p-8 space-y-8">
          {/* Live data sources */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-2">
              <Database className="h-3.5 w-3.5" />
              Live & Historical Data Providers
            </h3>

            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {dataSources.map((source) => (
                <div
                  key={source.name}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5 group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full w-20 text-center"
                      style={{
                        background: `${source.typeColor}15`,
                        color: source.typeColor,
                        border: `1px solid ${source.typeColor}30`,
                      }}
                    >
                      {source.type}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-200">
                          {source.name}
                        </span>
                        {source.url !== "#" && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-blue-400 transition-colors"
                            aria-label={`Visit ${source.name}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{source.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic references */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Academic & Methodological Foundations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {academicRefs.map((ref) => (
                <a
                  key={ref.name}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3.5 rounded-full transition-all duration-200 group"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(59,130,246,0.3)";
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(59,130,246,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.03)";
                  }}
                >
                  <Star className="h-4 w-4 text-blue-400/60 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                        {ref.name}
                      </span>
                      <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {ref.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Track Record ──────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            Our Track Record Speaks
          </h2>
          <p className="text-slate-400 text-sm">
            Real numbers. No cherry-picking. Updated continuously.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {trackStatMeta.map((meta) => {
            const rawValue = trackSummary && !trackError
              ? (trackSummary as unknown as Record<string, number>)[meta.key]
              : undefined;
            const displayValue =
              rawValue !== undefined && rawValue !== null
                ? meta.format(rawValue)
                : "—";

            return (
              <div
                key={meta.label}
                className="glass-card-hover p-6 text-center rounded-full space-y-2"
                style={{ borderColor: `${meta.color}25` }}
              >
                <div
                  className="text-3xl md:text-4xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}bb 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {displayValue}
                </div>
                <div className="text-sm font-semibold text-slate-200">{meta.label}</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">{meta.sublabel}</div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/trackrecord"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group"
          >
            View full track record
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── 7. What We Are NOT ───────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            What We Are NOT
          </h2>
          <p className="text-slate-400 text-sm">
            Important clarifications about the nature of this platform
          </p>
        </div>

        <div
          className="glass-card p-6 md:p-8 space-y-6"
          style={{
            borderColor: "rgba(245,158,11,0.35)",
            boxShadow:
              "0 0 30px rgba(245,158,11,0.08), 0 0 60px rgba(245,158,11,0.04)",
          }}
        >
          {/* Warning header */}
          <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{
                background: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.4)",
              }}
            >
              <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-amber-300">Important Disclaimer</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Please read carefully before using this platform
              </p>
            </div>
          </div>

          {/* NOT items */}
          <div className="space-y-2.5">
            {notItems.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <XCircle className="h-4.5 w-4.5 text-red-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-300 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          />

          {/* IS items */}
          <div className="space-y-2.5">
            {isItems.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-300 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Responsible gambling notice */}
          <div
            className="rounded-full p-4 flex items-start gap-3"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-300 leading-relaxed">
              Always gamble responsibly. If you or someone you know has a gambling problem, visit{" "}
              <a
                href="https://www.begambleaware.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors font-medium"
              >
                BeGambleAware.org
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. CTA ───────────────────────────────────────────────────────────── */}
      <section className="text-center space-y-6 pb-10">
        <div
          className="glass-card p-8 md:p-12 rounded-full space-y-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(16,185,129,0.04) 100%)",
            borderColor: "rgba(59,130,246,0.2)",
          }}
        >
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
              Ready to explore?
            </h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
              Dive into live probability-based match analysis powered by the models documented above.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/predictions">
              <button
                className="btn-gradient inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white glow-blue-sm"
              >
                <SparklesIcon className="h-4 w-4" />
                View Live Predictions
              </button>
            </Link>

            <Link href="/strategy">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-slate-200 border transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                <FlaskConical className="h-4 w-4" />
                Explore Strategy Lab
              </button>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

// ─── Local Sparkles SVG (used in CTA) ────────────────────────────────────────
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
