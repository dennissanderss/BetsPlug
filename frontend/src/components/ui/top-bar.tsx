"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Flame, ArrowRight } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

const STORAGE_KEY = "bp_topbar_d";

interface TrackRecord {
  accuracy_pct: number;
  total_picks: number;
  correct: number;
  current_streak: number;
}

/**
 * TopBar — slim promotional bar above the main navigation.
 *
 * Shows live track-record stats (win rate + pick count) fetched from
 * the /bet-of-the-day/track-record API, plus a €0.01-trial CTA.
 * Dismissable — persisted in sessionStorage so it stays hidden for
 * the current browser session.
 */
export function TopBar() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [stats, setStats] = useState<TrackRecord | null>(null);

  /* ── Restore dismiss state ── */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  /* ── Fetch track-record stats ── */
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/bet-of-the-day/track-record`)
      .then((r) => r.json())
      .then((d: TrackRecord) => {
        if (d && typeof d.accuracy_pct === "number") setStats(d);
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    setClosing(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        closing ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
      }`}
    >
      <div className="relative bg-[#0a0e1a] border-b border-green-500/[0.12] overflow-hidden">
        {/* Subtle green gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/[0.06] to-transparent pointer-events-none" />

        <div className="relative flex items-center justify-center gap-2 px-10 py-2 text-[13px] sm:text-sm">
          <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />

          {stats ? (
            <>
              {/* Desktop: full stats */}
              <span className="hidden sm:inline text-slate-300">
                <span className="font-bold text-white">
                  {Math.round(stats.accuracy_pct)}%
                </span>{" "}
                {t("topbar.winRate")}
                <span className="mx-1.5 text-slate-600">·</span>
                <span className="font-bold text-white">
                  {stats.total_picks}+
                </span>{" "}
                {t("topbar.picksAnalyzed")}
                <span className="mx-1.5 text-slate-600">·</span>
              </span>

              {/* Mobile: compact */}
              <span className="sm:hidden text-slate-300">
                <span className="font-bold text-white">
                  {Math.round(stats.accuracy_pct)}%
                </span>{" "}
                {t("topbar.winRate")}
                <span className="mx-1.5 text-slate-600">·</span>
              </span>
            </>
          ) : null}

          <Link
            href={`${loc("/checkout")}?plan=gold`}
            className="font-bold text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-1 whitespace-nowrap"
          >
            {t("topbar.cta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-600 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default TopBar;
