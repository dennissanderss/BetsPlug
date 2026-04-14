"use client";

import React from "react";
import { motion } from "motion/react";
import { Check, X, Minus, Crown, Users, Sparkles } from "lucide-react";
import { useTranslations } from "@/i18n/locale-provider";

type Cell = "yes" | "no" | "partial";

type Row = {
  feature: string;
  betsplug: Cell;
  others: Cell;
  note?: string;
};

/** Props accepted from Sanity (locale-resolved by the parent). */
export interface ComparisonRow {
  feature: string;
  betsplug: boolean;
  freeTools: boolean;
  bookmakers: boolean;
  note?: string;
}

/** Convert a Sanity ComparisonRow to the internal Row format. */
function toRow(cr: ComparisonRow): Row {
  const betsplug: Cell = cr.betsplug ? "yes" : "no";
  // "others" column: both true → yes, one true → partial, none → no
  const othersTrue = [cr.freeTools, cr.bookmakers].filter(Boolean).length;
  const others: Cell = othersTrue === 2 ? "yes" : othersTrue === 1 ? "partial" : "no";
  return { feature: cr.feature, betsplug, others, note: cr.note };
}

const defaultRows: Row[] = [
  {
    feature: "BetsPlug Pulse AI predictions",
    betsplug: "yes",
    others: "no",
    note: "Elo, Poisson & Logistic combined via BetsPlug Pulse",
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
    feature: "Data-first - zero hype, zero guessing",
    betsplug: "yes",
    others: "no",
  },
  {
    feature: "Coverage of 16+ global leagues",
    betsplug: "yes",
    others: "partial",
  },
];

const fmtScore = (n: number) =>
  Number.isInteger(n) ? `${n}` : n.toString().replace(".", ",");

/* ── Cell variants ─────────────────────────────────────────────── */
function BetsPlugCell({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <div className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_0_24px_rgba(74,222,128,0.25)] ring-1 ring-green-300">
        <Check className="h-5 w-5 text-[#04130a]" strokeWidth={3.5} />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-300">
        <Minus className="h-5 w-5 text-amber-500" strokeWidth={3.5} />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-300">
      <X className="h-5 w-5 text-red-500" strokeWidth={3.5} />
    </div>
  );
}

function CompetitorCell({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-green-200 bg-green-50">
        <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
        <Minus className="h-4 w-4 text-amber-500" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
      <X className="h-4 w-4 text-slate-500" strokeWidth={3} />
    </div>
  );
}

export function ComparisonTable({ rows: rowsProp }: { rows?: ComparisonRow[] } = {}) {
  const rows = rowsProp?.length ? rowsProp.map(toRow) : defaultRows;

  /* ── Score calculation (partials count as 0.5) ─────────────────── */
  const betsplugScore = rows.reduce(
    (sum, r) => sum + (r.betsplug === "yes" ? 1 : r.betsplug === "partial" ? 0.5 : 0),
    0
  );
  const competitorsScore = rows.reduce(
    (sum, r) => sum + (r.others === "yes" ? 1 : r.others === "partial" ? 0.5 : 0),
    0
  );
  const { t } = useTranslations();
  return (
    <section
      id="comparison"
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="comparison-heading"
    >
      {/* ── Background ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f8fafb] via-[#f0f4f8] to-[#f8fafb]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(74,222,128,0.18) 0 1px, transparent 1px 26px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-green-500/[0.04] blur-[140px]" />
        <div className="absolute right-[8%] bottom-10 h-[380px] w-[380px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* ── Heading ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-600">
            <Sparkles className="h-3.5 w-3.5" />
            {t("comparison.badge")}
          </span>
          <h2
            id="comparison-heading"
            className="text-balance break-words text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
          >
            {t("comparison.titleA")}{" "}
            <span className="gradient-text">{t("comparison.titleB")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
            {t("comparison.subtitle")}
          </p>
        </motion.div>

        {/* ── Table ───────────────────────────────────────────────
            The table itself, crown-icon spring, per-row stagger, score
            summary and caption all used to animate independently on
            scroll. Each row added its own IntersectionObserver and the
            stagger delays meant the table was still revealing rows
            hundreds of milliseconds after the user scrolled past. All
            of that is gone — the heading above still reveals once to
            mark the section transition, then everything below is
            static. */}
        <div className="relative">
          {/* Ambient glow behind the BetsPlug column */}
          <div
            className="pointer-events-none absolute inset-y-0 left-[calc(58.33%-10px)] hidden w-[18%] rounded-[3rem] bg-gradient-to-b from-green-500/[0.06] via-green-500/[0.03] to-transparent blur-2xl sm:block"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm backdrop-blur-xl sm:p-4">
            {/* Header row */}
            <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-1.5 px-1.5 pb-3 pt-4 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-2 sm:px-4 sm:pb-4 sm:pt-5">
              <div className="flex items-end">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {t("comparison.feature")}
                </span>
              </div>

              {/* BetsPlug header — floating column top */}
              <div className="relative flex flex-col items-center gap-2 rounded-t-[1.5rem] border-x-2 border-t-2 border-green-400 bg-gradient-to-b from-green-50 to-white px-3 pb-5 pt-5 shadow-[0_-8px_40px_-12px_rgba(74,222,128,0.15)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_0_24px_rgba(74,222,128,0.5)]">
                  <Crown className="h-5 w-5 text-[#04130a]" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                    BetsPlug
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-green-600">
                    <span className="h-1 w-1 rounded-full bg-green-600" />
                    {t("comparison.winner")}
                  </div>
                </div>
              </div>

              {/* Competitors header */}
              <div className="flex flex-col items-center gap-2 px-3 pb-5 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  <Users className="h-5 w-5 text-slate-500" strokeWidth={2.25} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold tracking-tight text-slate-500 sm:text-base">
                    {t("comparison.others")}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    {t("comparison.typicalTipsters")}
                  </div>
                </div>
              </div>
            </div>

            {/* Rows */}
            <div>
              {rows.map((row, i) => (
                <div
                  key={row.feature}
                  className="group grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 px-1.5 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-2 sm:px-4"
                >
                  {/* Feature label */}
                  <div
                    className={`py-5 pr-2 sm:py-5 ${
                      i !== 0 ? "border-t border-slate-100" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                      {row.feature}
                    </p>
                    {row.note && (
                      <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                        {row.note}
                      </p>
                    )}
                  </div>

                  {/* BetsPlug cell — middle of floating column */}
                  <div className="flex items-center justify-center border-x-2 border-green-400 bg-green-50/50 py-5 transition-colors group-hover:bg-green-50">
                    <BetsPlugCell value={row.betsplug} />
                  </div>

                  {/* Competitors cell */}
                  <div
                    className={`flex items-center justify-center py-5 ${
                      i !== 0 ? "border-t border-slate-100" : ""
                    }`}
                  >
                    <CompetitorCell value={row.others} />
                  </div>
                </div>
              ))}
            </div>

            {/* Score summary row */}
            <div
              className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-1.5 px-1.5 pb-2 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-2 sm:px-4"
            >
              <div className="flex items-center border-t border-slate-200 py-6 pr-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {t("comparison.finalScore")}
                </span>
              </div>

              {/* BetsPlug final score — bottom of floating column */}
              <div className="relative flex flex-col items-center justify-center gap-1 rounded-b-[1.5rem] border-x-2 border-b-2 border-green-400 bg-gradient-to-b from-green-50 via-green-100 to-emerald-100 px-3 py-6 shadow-[0_12px_40px_-12px_rgba(74,222,128,0.15)]">
                <div className="text-3xl font-black leading-none tracking-tight sm:text-4xl">
                  <span className="gradient-text">{fmtScore(betsplugScore)}</span>
                  <span className="text-slate-500">/{rows.length}</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                  {t("comparison.fullHouse")}
                </div>
              </div>

              {/* Competitors final score */}
              <div className="flex flex-col items-center justify-center gap-1 border-t border-slate-200 px-3 py-6">
                <div className="text-3xl font-black leading-none tracking-tight text-slate-600 sm:text-4xl">
                  {fmtScore(competitorsScore)}
                  <span className="text-slate-700">/{rows.length}</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {t("comparison.fallsShort")}
                </div>
              </div>
            </div>
          </div>

          {/* Caption below */}
          <p className="mt-6 text-center text-xs text-slate-500">
            {t("comparison.caption")}
          </p>
        </div>
      </div>
    </section>
  );
}
