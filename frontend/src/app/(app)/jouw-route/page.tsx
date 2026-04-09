"use client";

import Link from "next/link";
import {
  FlaskConical,
  Sparkles,
  Trophy,
  LineChart,
  MapPin,
  ChevronRight,
  BarChart3,
  CalendarCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────────────── */

interface PathStep {
  label: string;
  description: string;
}

interface PathCard {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor: string; // tailwind color token, e.g. "emerald"
  href: string;
  steps: PathStep[];
}

interface CommonLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

/* ─── Data ─────────────────────────────────────────────────────────────── */

const PATHS: PathCard[] = [
  {
    title: "Strategy Follower",
    subtitle: "For serious analysts",
    icon: FlaskConical,
    accentColor: "emerald",
    href: "/strategy",
    steps: [
      {
        label: "Go to Strategy Lab",
        description: "Pick a proven strategy",
      },
      {
        label: "Check Today's Picks",
        description: "See which matches your strategy recommends",
      },
      {
        label: "Track Results",
        description: "Monitor your strategy's performance",
      },
    ],
  },
  {
    title: "Quick Pick",
    subtitle: "For daily insights",
    icon: Trophy,
    accentColor: "amber",
    href: "/bet-of-the-day",
    steps: [
      {
        label: "Check Pick of the Day",
        description: "Our AI's #1 recommendation",
      },
      {
        label: "See the analysis",
        description: "Probabilities, reasoning, key factors",
      },
      {
        label: "Track Results",
        description: "Was it correct?",
      },
    ],
  },
  {
    title: "Explorer",
    subtitle: "Browse everything",
    icon: Sparkles,
    accentColor: "blue",
    href: "/predictions",
    steps: [
      {
        label: "Browse Predictions",
        description: "All upcoming matches with AI analysis",
      },
      {
        label: "Click View Details",
        description: "Deep dive into any match",
      },
      {
        label: "Make your own picks",
        description: "Compare with our model",
      },
    ],
  },
];

const COMMON_LINKS: CommonLink[] = [
  {
    title: "Track Results",
    description: "See outcomes of all predictions",
    href: "/results",
    icon: Trophy,
  },
  {
    title: "Weekly Report",
    description: "Performance summary",
    href: "/weekly-report",
    icon: CalendarCheck,
  },
  {
    title: "Trackrecord",
    description: "Long-term accuracy data",
    href: "/trackrecord",
    icon: BarChart3,
  },
];

/* ─── Accent helpers ───────────────────────────────────────────────────── */

const ACCENT_MAP: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    glow: string;
    gradient: string;
    stepDot: string;
    stepLine: string;
    hoverBorder: string;
  }
> = {
  emerald: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    glow: "shadow-[0_-2px_20px_rgba(16,185,129,0.15)]",
    gradient: "from-emerald-500 to-emerald-600",
    stepDot: "bg-emerald-500",
    stepLine: "bg-emerald-500/20",
    hoverBorder: "group-hover:border-emerald-500/30",
  },
  amber: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    glow: "shadow-[0_-2px_20px_rgba(245,158,11,0.15)]",
    gradient: "from-amber-500 to-amber-600",
    stepDot: "bg-amber-500",
    stepLine: "bg-amber-500/20",
    hoverBorder: "group-hover:border-amber-500/30",
  },
  blue: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    glow: "shadow-[0_-2px_20px_rgba(59,130,246,0.15)]",
    gradient: "from-blue-500 to-blue-600",
    stepDot: "bg-blue-500",
    stepLine: "bg-blue-500/20",
    hoverBorder: "group-hover:border-blue-500/30",
  },
};

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function JouwRoutePage() {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 max-w-[1100px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center mb-14 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MapPin className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
            Jouw Route
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Choose your path to get the most out of BetsPlug. Each route leads to
          smarter picks - pick the one that fits your style.
        </p>
      </div>

      {/* ── Three Path Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {PATHS.map((path, idx) => {
          const Icon = path.icon;
          const a = ACCENT_MAP[path.accentColor];

          return (
            <Link
              key={path.title}
              href={path.href}
              className="group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div
                className={`glass-card relative overflow-hidden transition-all duration-300 ${a.hoverBorder} animate-fade-in h-full flex flex-col`}
              >
                {/* Top accent bar */}
                <div
                  className={`h-1 w-full bg-gradient-to-r ${a.gradient}`}
                />

                {/* Card body */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + title row */}
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${a.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-100 leading-tight">
                        {path.title}
                      </h3>
                      <p className={`text-xs font-medium ${a.text}`}>
                        {path.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.06] my-4" />

                  {/* Steps */}
                  <ol className="space-y-4 flex-1">
                    {path.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex gap-3">
                        {/* Step indicator + line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${a.stepDot}`}
                          >
                            {sIdx + 1}
                          </div>
                          {sIdx < path.steps.length - 1 && (
                            <div
                              className={`w-px flex-1 mt-1 ${a.stepLine}`}
                            />
                          )}
                        </div>

                        {/* Step text */}
                        <div className="pb-1">
                          <p className="text-sm font-semibold text-slate-200 leading-tight">
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  {/* CTA hint */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06]">
                    <span
                      className={`text-xs font-semibold ${a.text} group-hover:underline`}
                    >
                      Start this path &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Common for all paths ───────────────────────────────────────── */}
      <div className="animate-fade-in">
        {/* Section header with road motif */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Common for all paths
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </div>

        {/* Winding road visual connector */}
        <div className="relative">
          {/* Dashed center line */}
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px border-l-2 border-dashed border-emerald-500/15 hidden md:block" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COMMON_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="group">
                  <div className="glass-card p-5 group-hover:border-emerald-500/20 transition-all duration-300 h-full">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Icon className="h-4 w-4 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200">
                        {link.title}
                      </h4>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all ml-auto shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
