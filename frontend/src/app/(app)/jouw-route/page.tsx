"use client";

import Link from "next/link";
import {
  Users,
  FlaskConical,
  Sparkles,
  Trophy,
  LineChart,
  MapPin,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Step definitions ──────────────────────────────────────────────────── */

interface Step {
  number: number;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "Welcome to BetsPlug",
    href: "/about",
    icon: Users,
    description:
      "Learn who we are and how our AI model analyzes thousands of data points to predict match outcomes.",
  },
  {
    number: 2,
    title: "Choose Your Strategy",
    href: "/strategy",
    icon: FlaskConical,
    description:
      "Browse our tested strategies. Each one filters predictions differently — pick the one that matches your style.",
  },
  {
    number: 3,
    title: "View Predictions",
    href: "/predictions",
    icon: Sparkles,
    description:
      "Daily AI-powered predictions for 6 top leagues. See win probabilities, confidence levels, and our model's reasoning.",
  },
  {
    number: 4,
    title: "Track Your Results",
    href: "/results",
    icon: Trophy,
    description:
      "Follow every pick's outcome. See which predictions were correct and track your performance over time.",
  },
  {
    number: 5,
    title: "Analyze & Improve",
    href: "/trackrecord",
    icon: LineChart,
    description:
      "Deep dive into accuracy metrics, equity curves, and calibration data. Use insights to refine your approach.",
  },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function JouwRoutePage() {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 max-w-[900px] mx-auto space-y-0">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MapPin className="h-6 w-6 text-emerald-400" />
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
            Jouw Route
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Follow these 5 steps to get the most out of BetsPlug. Click any step
          to jump there.
        </p>
      </div>

      {/* Route steps */}
      <div className="relative">
        {STEPS.map((step, index) => (
          <Link key={step.number} href={step.href} className="block group">
            <div className="flex gap-6 items-start mb-0">
              {/* Left: number circle + connecting line */}
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 font-bold text-lg group-hover:bg-emerald-500/30 group-hover:border-emerald-500/60 transition-all">
                  {step.number}
                </div>
                {index < STEPS.length - 1 && (
                  <div className="w-0.5 h-16 bg-gradient-to-b from-emerald-500/40 to-emerald-500/10" />
                )}
              </div>

              {/* Right: content card */}
              <div className="glass-card p-5 flex-1 mb-4 group-hover:border-emerald-500/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <step.icon className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-slate-100">
                      {step.title}
                    </h3>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-8 animate-fade-in">
        <Link
          href="/strategy"
          className="btn-gradient inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
        >
          Start with Step 2: Choose Your Strategy
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
