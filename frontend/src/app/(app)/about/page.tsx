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
  Cpu,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  Mail,
  ArrowRight,
  Activity,
  Target,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

const PILLARS = [
  {
    icon: ShieldCheck,
    variant: "blue" as const,
    title: "Verified data sources",
    desc: "Aggregated from official league APIs and established football data providers. Every data point is cross-referenced before entering our models.",
  },
  {
    icon: Eye,
    variant: "green" as const,
    title: "Transparent models",
    desc: "Elo ratings, Poisson regression, logistic regression — well-documented statistical methods, not black-box algorithms.",
  },
  {
    icon: FlaskConical,
    variant: "purple" as const,
    title: "Backtested rigorously",
    desc: "Every strategy is backtested with walk-forward validation on historical data. No leakage, no cherry-picking.",
  },
  {
    icon: BarChart3,
    variant: "green" as const,
    title: "Live track record",
    desc: "Our public track record shows every prediction and every outcome, updated in real time — the good and the bad.",
  },
];

const PIPELINE = [
  { icon: Database, variant: "blue" as const, title: "Data collection", desc: "Match data, team stats, standings and historical results from official and third-party feeds." },
  { icon: Layers, variant: "green" as const, title: "Feature engineering", desc: "24+ analytical features per match: form, home/away splits, H2H, Elo differentials." },
  { icon: Cpu, variant: "purple" as const, title: "Model prediction", desc: "Elo, Poisson, logistic and BetsPlug Pulse blend into calibrated probability outputs." },
  { icon: ClipboardCheck, variant: "blue" as const, title: "Evaluation", desc: "Every prediction stored immutably and auto-evaluated after kickoff. Nothing deleted." },
];

const MODELS = [
  { icon: TrendingUp, variant: "blue" as const, title: "Elo Rating", badge: "Classic" },
  { icon: Activity, variant: "green" as const, title: "Poisson Regression", badge: "Statistical" },
  { icon: Target, variant: "purple" as const, title: "Logistic Regression", badge: "ML" },
  { icon: Layers, variant: "green" as const, title: "BetsPlug Pulse", badge: "Ensemble" },
];

export default function AboutPage() {
  const { data: trackSummary } = useQuery({
    queryKey: ["trackrecord-summary"],
    queryFn: () => api.getTrackrecordSummary(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-10 animate-fade-in">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[#60a5fa]/10 blur-3xl" />
        <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="text-center space-y-4">
        <p className="section-label">Methodology & transparency</p>
        <h1 className="text-display">
          <span className="gradient-text-green">How BetsPlug works</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
          Transparent, data-driven football analysis built on proven statistical methods. Every prediction is traceable, every model is backtested, and every result is tracked.
        </p>
      </section>

      {/* Track record quick stats */}
      {trackSummary && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total predictions", value: trackSummary.total_predictions?.toLocaleString?.() ?? "—", color: "text-[#60a5fa]" },
            { label: "Accuracy", value: trackSummary.accuracy != null ? `${(trackSummary.accuracy * 100).toFixed(1)}%` : "—", color: "text-[#4ade80]" },
            { label: "Brier score", value: trackSummary.brier_score != null ? trackSummary.brier_score.toFixed(3) : "—", color: "text-[#d8b4fe]" },
            { label: "Avg. confidence", value: trackSummary.avg_confidence != null ? `${(trackSummary.avg_confidence * 100).toFixed(1)}%` : "—", color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="glass-panel p-4 space-y-1">
              <p className="section-label">{s.label}</p>
              <p className={`text-stat tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Trust pillars */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <HexBadge variant="green" size="sm"><ShieldCheck className="h-4 w-4" /></HexBadge>
          <div>
            <p className="section-label">Why trust this data</p>
            <h2 className="text-lg font-semibold text-white">Four pillars of credibility</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="card-neon">
                <div className="relative flex gap-4 p-5">
                  <HexBadge variant={p.variant} size="sm"><Icon className="h-4 w-4" /></HexBadge>
                  <div>
                    <h3 className="font-semibold text-white text-sm mb-1">{p.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pipeline */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <HexBadge variant="blue" size="sm"><Database className="h-4 w-4" /></HexBadge>
          <div>
            <p className="section-label">Pipeline</p>
            <h2 className="text-lg font-semibold text-white">From raw data to probability</h2>
          </div>
        </div>
        <div className="space-y-3">
          {PIPELINE.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card-neon">
                <div className="relative flex items-start gap-4 p-5">
                  <HexBadge variant={s.variant} size="md"><Icon className="h-5 w-5" /></HexBadge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="section-label">Step {String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Models */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <HexBadge variant="purple" size="sm"><Cpu className="h-4 w-4" /></HexBadge>
          <div>
            <p className="section-label">Models</p>
            <h2 className="text-lg font-semibold text-white">Four independent engines</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODELS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="card-neon">
                <div className="relative flex flex-col items-start gap-3 p-5">
                  <HexBadge variant={m.variant} size="md"><Icon className="h-5 w-5" /></HexBadge>
                  <div>
                    <Pill tone={m.variant === "green" ? "win" : m.variant === "purple" ? "purple" : "info"}>{m.badge}</Pill>
                    <h3 className="font-semibold text-white text-sm mt-2">{m.title}</h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Disclaimer + CTA */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card-neon">
          <div className="relative p-5 space-y-3">
            <div className="flex items-center gap-3">
              <HexBadge variant="blue" size="sm"><BookOpen className="h-4 w-4" /></HexBadge>
              <h3 className="font-semibold text-white text-sm">What this app is</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li>A data analytics platform for football enthusiasts and researchers.</li>
              <li>All model outputs are simulations — treat them as educational.</li>
              <li>Not a betting advisory service. No guaranteed returns.</li>
            </ul>
          </div>
        </div>
        <div className="card-neon card-neon-green halo-green">
          <div className="relative p-5 space-y-3">
            <div className="flex items-center gap-3">
              <HexBadge variant="green" size="sm"><Mail className="h-4 w-4" /></HexBadge>
              <h3 className="font-semibold text-white text-sm">Questions?</h3>
            </div>
            <p className="text-sm text-slate-400">
              Get in touch via the contact form or check the full methodology on our track record page.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
                Contact <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/trackrecord" className="btn-glass inline-flex items-center gap-2">
                Track record
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
