"use client";

import React from "react";
import { motion } from "motion/react";
import { Check, X, Minus, Crown, Users, Sparkles } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
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

/* ── Cell variants — NOCTURNE ──────────────────────────────────── */
function BetsPlugCell({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <div
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
          boxShadow: "0 0 16px rgba(74, 222, 128, 0.45)",
        }}
      >
        <Check className="h-5 w-5 text-[#050505]" strokeWidth={3} />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#a855f7]/50 bg-[#a855f7]/[0.12]">
        <Minus className="h-5 w-5 text-[#d8b4fe]" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#ef4444]/50 bg-[#ef4444]/[0.10]">
      <X className="h-5 w-5 text-[#f87171]" strokeWidth={3} />
    </div>
  );
}

function CompetitorCell({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <Pill tone="active" className="h-8 w-8 justify-center rounded-full p-0">
        <Check className="h-4 w-4" strokeWidth={3} />
      </Pill>
    );
  }
  if (value === "partial") {
    return (
      <Pill tone="draw" className="h-8 w-8 justify-center rounded-full p-0">
        <Minus className="h-4 w-4" strokeWidth={3} />
      </Pill>
    );
  }
  return (
    <Pill tone="loss" className="h-8 w-8 justify-center rounded-full p-0">
      <X className="h-4 w-4" strokeWidth={2.5} />
    </Pill>
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
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.06] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* ── Heading ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col items-center text-center"
        >
          <div className="mb-5 flex items-center gap-3">
            <HexBadge variant="green" size="sm">
              <Sparkles className="h-4 w-4" />
            </HexBadge>
            <span className="section-label">
              <Sparkles className="h-3 w-3" />
              {t("comparison.badge")}
            </span>
          </div>
          <h2
            id="comparison-heading"
            className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
          >
            {t("comparison.titleA")}{" "}
            <span className="gradient-text-green">{t("comparison.titleB")}</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
            {t("comparison.subtitle")}
          </p>
        </motion.div>

        {/* ── Table ───────────────────────────────────────────── */}
        <div className="relative">
          <div className="card-neon card-neon-green">
            <div className="relative overflow-hidden rounded-[inherit]">
              {/* Header row */}
              <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex items-end px-4 pb-4 pt-6 sm:px-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                    {t("comparison.feature")}
                  </span>
                </div>

                {/* BetsPlug header */}
                <div className="relative flex flex-col items-center gap-2 bg-[#4ade80]/[0.06] px-3 pb-5 pt-6">
                  <HexBadge variant="green" size="md">
                    <Crown className="h-5 w-5" />
                  </HexBadge>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="text-heading text-sm text-[#ededed] sm:text-base">
                      BetsPlug
                    </div>
                    <Pill tone="active" className="gap-1.5">
                      <span className="live-dot" />
                      {t("comparison.winner")}
                    </Pill>
                  </div>
                </div>

                {/* Competitors header */}
                <div className="flex flex-col items-center gap-2 px-3 pb-5 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <Users className="h-5 w-5 text-[#6b7280]" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="text-heading text-sm italic text-[#a3a9b8] sm:text-base">
                      {t("comparison.others")}
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-[#6b7280]">
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
                    className="group grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch transition-colors sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]"
                    style={{ borderTop: "1px solid hsl(0 0% 100% / 0.05)" }}
                  >
                    {/* Feature label */}
                    <div className="px-4 py-5 pr-2 sm:px-6">
                      <p className="text-sm font-semibold text-[#ededed] sm:text-[15px]">
                        {row.feature}
                      </p>
                      {row.note && (
                        <p className="mt-1 hidden text-xs text-[#a3a9b8] sm:block">
                          {row.note}
                        </p>
                      )}
                    </div>

                    {/* BetsPlug cell */}
                    <div className="flex items-center justify-center bg-[#4ade80]/[0.04] py-5 transition-colors group-hover:bg-[#4ade80]/[0.08]">
                      <BetsPlugCell value={row.betsplug} />
                    </div>

                    {/* Competitors cell */}
                    <div className="flex items-center justify-center py-5 transition-colors group-hover:bg-white/[0.02]">
                      <CompetitorCell value={row.others} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Score summary row */}
              <div
                className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]"
                style={{ borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}
              >
                <div className="flex items-center px-4 py-6 sm:px-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#4ade80]">
                    {t("comparison.finalScore")}
                  </span>
                </div>

                {/* BetsPlug final score */}
                <div className="flex flex-col items-center justify-center gap-2 bg-[#4ade80]/[0.08] px-3 py-6">
                  <div className="text-stat text-3xl leading-none sm:text-4xl">
                    <span className="gradient-text-green">
                      {fmtScore(betsplugScore)}
                    </span>
                    <span className="text-[#6b7280]">/{rows.length}</span>
                  </div>
                  <Pill tone="win">{t("comparison.fullHouse")}</Pill>
                </div>

                {/* Competitors final score */}
                <div className="flex flex-col items-center justify-center gap-2 px-3 py-6">
                  <div className="text-stat text-3xl leading-none text-[#a3a9b8] sm:text-4xl">
                    {fmtScore(competitorsScore)}
                    <span className="text-[#6b7280]">/{rows.length}</span>
                  </div>
                  <Pill tone="default">{t("comparison.fallsShort")}</Pill>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs uppercase tracking-wider text-[#6b7280]">
            {t("comparison.caption")}
          </p>
        </div>
      </div>
    </section>
  );
}
