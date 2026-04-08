"use client";

import { motion } from "motion/react";
import { Check, X, Minus } from "lucide-react";

type Cell = "yes" | "no" | "partial";

type Row = {
  feature: string;
  betsplug: Cell;
  others: Cell;
  note?: string;
};

const rows: Row[] = [
  {
    feature: "AI-powered predictions (4 models)",
    betsplug: "yes",
    others: "no",
    note: "Elo, Poisson, Logistic & Ensemble combined",
  },
  {
    feature: "Fully transparent public track record",
    betsplug: "yes",
    others: "partial",
    note: "Every pick logged, nothing hidden",
  },
  {
    feature: "Real-time probability updates",
    betsplug: "yes",
    others: "no",
  },
  {
    feature: "Free plan with daily value picks",
    betsplug: "yes",
    others: "no",
  },
  {
    feature: "Strategy backtesting tools",
    betsplug: "yes",
    others: "no",
    note: "Test your edge before committing",
  },
  {
    feature: "No hidden fees or lock-in contracts",
    betsplug: "yes",
    others: "partial",
  },
  {
    feature: "Data-first — zero hype, zero guessing",
    betsplug: "yes",
    others: "no",
  },
  {
    feature: "Coverage of 16+ global leagues",
    betsplug: "yes",
    others: "partial",
  },
];

function CellIcon({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <div className="relative mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.25)]">
        <Check className="h-4 w-4 text-green-400" strokeWidth={3} />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
        <Minus className="h-4 w-4 text-amber-400" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
      <X className="h-4 w-4 text-red-400" strokeWidth={3} />
    </div>
  );
}

export function ComparisonTable() {
  return (
    <section
      id="comparison"
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="comparison-heading"
    >
      {/* ── Unique background ────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080b14] via-[#0a1220] to-[#080b14]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(74,222,128,0.7) 0 1px, transparent 1px 24px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-20 h-[420px] w-[420px] rounded-full bg-green-500/[0.07] blur-[130px]" />
        <div className="absolute right-[12%] bottom-0 h-[380px] w-[380px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
            Why BetsPlug
          </span>
          <h2
            id="comparison-heading"
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
          >
            BetsPlug vs the <span className="gradient-text">competition</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            See exactly what sets us apart from typical tipster sites and
            prediction services.
          </p>
        </motion.div>

        {/* Table card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl"
        >
          {/* Header row */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-white/[0.08] bg-white/[0.02] px-5 py-5 sm:grid-cols-[2fr_1fr_1fr] sm:px-8 sm:py-6">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Feature
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                BetsPlug
              </span>
            </div>
            <div className="text-center text-xs font-bold uppercase tracking-widest text-slate-500">
              Competitors
            </div>
          </div>

          {/* Rows */}
          <div>
            {rows.map((row, i) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                viewport={{ once: true }}
                className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-5 py-5 transition-colors sm:grid-cols-[2fr_1fr_1fr] sm:px-8 sm:py-5 ${
                  i !== rows.length - 1 ? "border-b border-white/[0.05]" : ""
                } hover:bg-white/[0.015]`}
              >
                <div className="pr-3">
                  <p className="text-sm font-semibold text-white sm:text-base">
                    {row.feature}
                  </p>
                  {row.note && (
                    <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                      {row.note}
                    </p>
                  )}
                </div>
                <CellIcon value={row.betsplug} />
                <CellIcon value={row.others} />
              </motion.div>
            ))}
          </div>

          {/* Subtle column highlight for BetsPlug column */}
          <div
            className="pointer-events-none absolute inset-y-0 left-[calc(58.33%-0.5px)] hidden w-[16.66%] bg-gradient-to-b from-green-500/[0.04] via-green-500/[0.02] to-transparent sm:block"
            aria-hidden="true"
          />
        </motion.div>
      </div>
    </section>
  );
}
