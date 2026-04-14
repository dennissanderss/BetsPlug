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

/* ── Cell variants — hard edge ──────────────────────────────────── */
function BetsPlugCell({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <div className="mx-auto flex h-9 w-9 items-center justify-center bg-[#4ade80]">
        <Check className="h-5 w-5 text-[#050505]" strokeWidth={3} />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="mx-auto flex h-9 w-9 items-center justify-center border border-[#4ade80]/60 bg-[#4ade80]/[0.1]">
        <Minus className="h-5 w-5 text-[#4ade80]" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-9 w-9 items-center justify-center border border-[#ef4444]/60 bg-[#ef4444]/[0.08]">
      <X className="h-5 w-5 text-[#ef4444]" strokeWidth={3} />
    </div>
  );
}

function CompetitorCell({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <div className="mx-auto flex h-8 w-8 items-center justify-center border border-[#4ade80]/40">
        <Check className="h-4 w-4 text-[#4ade80]" strokeWidth={3} />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="mx-auto flex h-8 w-8 items-center justify-center border border-white/15">
        <Minus className="h-4 w-4 text-[#a3a3a3]" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-8 w-8 items-center justify-center border border-white/10">
      <X className="h-4 w-4 text-[#707070]" strokeWidth={2.5} />
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
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* ── Heading ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mb-12 max-w-3xl"
        >
          <span className="section-tag mb-5">
            <Sparkles className="h-3 w-3" />
            {t("comparison.badge")}
          </span>
          <h2
            id="comparison-heading"
            className="text-display text-3xl text-white sm:text-4xl lg:text-5xl"
          >
            {t("comparison.titleA")}{" "}
            <span className="text-[#4ade80]">{t("comparison.titleB")}</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#a3a3a3] sm:text-lg">
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
          {/* Hard-edge panel — BetsPlug column gets left/right lime border via cell styling */}
          <div className="relative border border-white/10 bg-[#0a0a0a]">
            {/* Corner brackets */}
            <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
            <span className="pointer-events-none absolute right-[-1px] top-[-1px] h-3 w-3 border-r-2 border-t-2 border-[#4ade80]" />
            <span className="pointer-events-none absolute left-[-1px] bottom-[-1px] h-3 w-3 border-l-2 border-b-2 border-[#4ade80]" />
            <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

            {/* Header row */}
            <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex items-end px-4 pb-4 pt-6 sm:px-6">
                <span className="mono-label">{t("comparison.feature")}</span>
              </div>

              {/* BetsPlug header */}
              <div className="relative flex flex-col items-center gap-2 border-x border-[#4ade80]/50 bg-[#4ade80]/[0.05] px-3 pb-5 pt-5">
                <div className="flex h-10 w-10 items-center justify-center bg-[#4ade80]">
                  <Crown className="h-5 w-5 text-[#050505]" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <div className="text-display text-sm text-white sm:text-base">
                    BETSPLUG
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                    <span className="live-dot" />
                    {t("comparison.winner")}
                  </div>
                </div>
              </div>

              {/* Competitors header */}
              <div className="flex flex-col items-center gap-2 px-3 pb-5 pt-5">
                <div className="flex h-10 w-10 items-center justify-center border border-white/15 bg-white/[0.02]">
                  <Users className="h-5 w-5 text-[#707070]" strokeWidth={2} />
                </div>
                <div className="text-center">
                  <div className="text-display text-sm text-[#a3a3a3] sm:text-base">
                    {t("comparison.others")}
                  </div>
                  <div className="mt-1 mono-label">
                    {t("comparison.typicalTipsters")}
                  </div>
                </div>
              </div>
            </div>

            {/* Rows */}
            <div>
              {rows.map((row) => (
                <div
                  key={row.feature}
                  className="group grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch border-t border-white/[0.08] sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]"
                >
                  {/* Feature label */}
                  <div className="px-4 py-5 pr-2 sm:px-6">
                    <p className="text-sm font-bold text-white sm:text-[15px]">
                      {row.feature}
                    </p>
                    {row.note && (
                      <p className="mt-1 hidden text-xs text-[#707070] sm:block">
                        {row.note}
                      </p>
                    )}
                  </div>

                  {/* BetsPlug cell */}
                  <div className="flex items-center justify-center border-x border-[#4ade80]/50 bg-[#4ade80]/[0.05] py-5 transition-colors group-hover:bg-[#4ade80]/[0.08]">
                    <BetsPlugCell value={row.betsplug} />
                  </div>

                  {/* Competitors cell */}
                  <div className="flex items-center justify-center py-5">
                    <CompetitorCell value={row.others} />
                  </div>
                </div>
              ))}
            </div>

            {/* Score summary row */}
            <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch border-t border-white/10 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex items-center px-4 py-6 sm:px-6">
                <span className="mono-label-lime">
                  {t("comparison.finalScore")}
                </span>
              </div>

              {/* BetsPlug final score */}
              <div className="flex flex-col items-center justify-center gap-1 border-x border-[#4ade80]/50 bg-[#4ade80]/[0.08] px-3 py-6">
                <div className="text-stat text-3xl leading-none sm:text-4xl">
                  <span className="text-[#4ade80]">{fmtScore(betsplugScore)}</span>
                  <span className="text-[#707070]">/{rows.length}</span>
                </div>
                <div className="font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                  {t("comparison.fullHouse")}
                </div>
              </div>

              {/* Competitors final score */}
              <div className="flex flex-col items-center justify-center gap-1 px-3 py-6">
                <div className="text-stat text-3xl leading-none text-[#a3a3a3] sm:text-4xl">
                  {fmtScore(competitorsScore)}
                  <span className="text-[#707070]">/{rows.length}</span>
                </div>
                <div className="font-mono text-[10px] font-black uppercase tracking-widest text-[#707070]">
                  {t("comparison.fallsShort")}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
            / {t("comparison.caption")}
          </p>
        </div>
      </div>
    </section>
  );
}
