"use client";

import { useTranslations } from "@/i18n/locale-provider";
import { POTD_STATS } from "@/data/potd-stats";
import { useBotdTrackRecord } from "./use-botd-track-record";

/**
 * Shape of the `vars` object accepted by `t(key, vars)` for any
 * message that uses `{potdAccuracy}` / `{potdPicks}` placeholders.
 *
 * Declared as an index-signature type (rather than a strict
 * interface) so it directly satisfies `MessageVars` without a cast
 * — callers can write `t(key, usePotdNumbers())` and TypeScript is
 * happy.
 */
export type PotdNumbers = {
  [key: string]: string;
  /**
   * Pick-of-the-Day accuracy as a locale-formatted string, ready
   * to drop into `{potdAccuracy}%` placeholders. No `%` suffix.
   * E.g. "66.7" (en / sw), "66,7" (nl / de / fr / es / it / id).
   */
  potdAccuracy: string;
  /**
   * Total tracked POTD picks, locale-formatted. E.g. "346" or
   * "1,284". No suffix.
   */
  potdPicks: string;
};

/**
 * Returns `{potdAccuracy, potdPicks}` strings ready to feed to
 * `t(key, vars)` for messages using those placeholders. Values
 * are live from `/api/bet-of-the-day/track-record` when the hook
 * has resolved, otherwise the `POTD_STATS` SSR fallback. Always
 * formatted for the current locale (decimal separator picked from
 * `Intl.NumberFormat(locale)`).
 *
 * Canonical usage:
 *
 *   const nums = usePotdNumbers();
 *   <p>{t("faq.how.a1", nums)}</p>
 */
export function usePotdNumbers(): PotdNumbers {
  const { locale } = useTranslations();
  const live = useBotdTrackRecord();

  // Guard against 0 from BOTD when all picks are still pending evaluation —
  // `??` only catches null/undefined, so we need an explicit > 0 check.
  // When BOTD is cold (accuracy_pct=0, total_picks=8), fall back to the
  // Gold-tier static snapshot so the page shows the honest 70%+ numbers.
  const accuracyRaw =
    live?.accuracy_pct != null && live.accuracy_pct > 0
      ? live.accuracy_pct
      : Number.parseFloat(POTD_STATS.accuracy);
  const picksRaw =
    live?.total_picks != null && live.total_picks > 0
      ? live.total_picks
      : Number.parseInt(POTD_STATS.totalPicks, 10);

  const fmtPct = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  });
  const fmtInt = new Intl.NumberFormat(locale);

  return {
    potdAccuracy: fmtPct.format(accuracyRaw),
    potdPicks: fmtInt.format(picksRaw),
  };
}
