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
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen px-4 py-8 md:px-8 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MapPin className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
            Jouw Route
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Follow these 5 steps to get the most out of BetsPlug. Click any step to jump there.
        </p>
      </div>

      {/* Winding road layout */}
      <div className="relative">
        {STEPS.map((step, index) => {
          const isLeft = index % 2 === 0;
          const isLast = index === STEPS.length - 1;
          const Icon = step.icon;

          return (
            <div key={step.number} className="relative">
              {/* Connecting curve line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute top-[60px] hidden md:block",
                    "w-[60%] h-[80px]",
                    "border-b-2 border-dashed border-emerald-500/25",
                    isLeft
                      ? "left-[20%] rounded-br-[60px] border-r-2"
                      : "right-[20%] rounded-bl-[60px] border-l-2"
                  )}
                />
              )}

              {/* Step row */}
              <div
                className={cn(
                  "flex items-center gap-6 md:gap-10 mb-12 md:mb-20 animate-fade-in",
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                {/* Content card */}
                <Link href={step.href} className="flex-1 group">
                  <div className="glass-card p-6 group-hover:border-emerald-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                          <Icon className="h-5 w-5 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-100">{step.title}</h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                  </div>
                </Link>

                {/* Number circle (center point on the road) */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="relative flex h-16 w-16 items-center justify-center rounded-full text-xl font-extrabold text-white"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 0 25px rgba(16,185,129,0.4), 0 0 50px rgba(16,185,129,0.15)",
                    }}
                  >
                    {step.number}
                    {/* Ping animation on first step */}
                    {index === 0 && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20" />
                    )}
                  </div>
                </div>

                {/* Empty space for zigzag alignment */}
                <div className="flex-1 hidden md:block" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="glass-card p-6 mt-4 animate-fade-in">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4">
          Position Legend
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {STEPS.map((step) => (
            <Link
              key={step.number}
              href={step.href}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:border-emerald-500/20 transition-colors group"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
              >
                {step.number}
              </div>
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                {step.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-10 pb-4 animate-fade-in">
        <Link
          href="/about"
          className="btn-gradient inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold"
        >
          Begin bij Stap 1 <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}


