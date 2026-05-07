"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * TopBar — rotating multi-lever announcement strip.
 *
 * Cycles between five Cialdini-aligned variants so returning
 * visitors don't go blind on the same copy:
 *   - scarcity:    "Picks lock at kick-off"
 *   - authority:   "{hitRate}% hit rate · {N}+ picks verified"
 *   - reciprocity: "Free Pick of the Day — no card, no email"
 *   - social:      "1,500+ subscribers trust BetsPlug"
 *   - fomo:        "Last month: {X}% hit on Pick of the Day"
 *
 * Variant selection is session-scoped (deterministic per
 * sessionStorage key) so the copy stays stable within one browsing
 * session but rotates for a returning visitor. GTM dataLayer events
 * fire on both impression and click with `topbar_variant` so we
 * can measure conversion rate per variant and eventually pin the
 * winner.
 *
 * Dismiss is session-persistent.
 */

const STORAGE_DISMISS = "bp_topbar_d";
const STORAGE_VARIANT = "bp_topbar_v";

type VariantKey = "scarcity" | "authority" | "reciprocity" | "social" | "fomo";

const VARIANTS: VariantKey[] = [
  "scarcity",
  "authority",
  "reciprocity",
  "social",
  "fomo",
];

const EMOJI: Record<VariantKey, string> = {
  scarcity: "⏰",
  authority: "🏆",
  reciprocity: "🎁",
  social: "👥",
  fomo: "🔥",
};

/** Dot / accent colour per variant. Matches the emoji vibe. */
const DOT_COLOR: Record<VariantKey, string> = {
  scarcity: "#f59e0b", // amber  — urgency
  authority: "#4ade80", // green — trust
  reciprocity: "#a855f7", // purple — gift
  social: "#60a5fa", // blue    — community
  fomo: "#ef4444", // red        — fire
};

/** Push a GTM dataLayer event. Silently no-ops if GTM is not loaded. */
function trackEvent(event: string, params: Record<string, unknown>) {
  try {
    const w = window as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
    };
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event, ...params });
  } catch {
    /* ignore */
  }
}

/** Safe variants that don't need a live-numbers quote. Used when
 *  the BOTD track-record is too sparse to honestly render
 *  "{X}% win rate · {N}+ picks" — skips "authority" + "fomo"
 *  which both embed {hitRate}. */
const SAFE_VARIANTS: VariantKey[] = ["scarcity", "reciprocity", "social"];

/** Pick a variant for this session. Deterministic per sessionStorage
 *  key so the copy doesn't flicker across page navigations. Rotates
 *  across sessions so returning visitors see fresh copy. */
function pickVariantForSession(safeOnly: boolean): VariantKey {
  const pool = safeOnly ? SAFE_VARIANTS : VARIANTS;
  try {
    const stored = sessionStorage.getItem(STORAGE_VARIANT);
    if (stored && (pool as string[]).includes(stored)) {
      return stored as VariantKey;
    }
  } catch {
    /* sessionStorage disabled — fall through to random pick */
  }
  const idx = Math.floor(Math.random() * pool.length);
  const pick = pool[idx];
  try {
    sessionStorage.setItem(STORAGE_VARIANT, pick);
  } catch {
    /* ignore */
  }
  return pick;
}

interface CopyPieces {
  desktop: string;
  mobile: string;
  cta: string;
  href: string;
}

function buildCopy(
  variant: VariantKey,
  t: (key: string) => string,
  loc: (path: string) => string,
  hitRate: string,
  totalPicks: string,
): CopyPieces {
  switch (variant) {
    case "scarcity":
      return {
        desktop: t("topbar.v.scarcity.text"),
        mobile: t("topbar.v.scarcity.textMobile"),
        cta: t("topbar.v.scarcity.cta"),
        href: `${loc("/checkout")}?plan=gold`,
      };
    case "authority":
      return {
        desktop: t("topbar.v.authority.text")
          .replace("{hitRate}", hitRate)
          .replace("{totalPicks}", totalPicks),
        mobile: t("topbar.v.authority.textMobile").replace(
          "{hitRate}",
          hitRate,
        ),
        cta: t("topbar.v.authority.cta"),
        href: loc("/track-record"),
      };
    case "reciprocity":
      return {
        desktop: t("topbar.v.reciprocity.text"),
        mobile: t("topbar.v.reciprocity.textMobile"),
        cta: t("topbar.v.reciprocity.cta"),
        href: loc("/predictions"),
      };
    case "social":
      return {
        desktop: t("topbar.v.social.text"),
        mobile: t("topbar.v.social.textMobile"),
        cta: t("topbar.v.social.cta"),
        href: `${loc("/checkout")}?plan=bronze`,
      };
    case "fomo":
      return {
        desktop: t("topbar.v.fomo.text").replace("{hitRate}", hitRate),
        mobile: t("topbar.v.fomo.textMobile").replace("{hitRate}", hitRate),
        cta: t("topbar.v.fomo.cta"),
        href: `${loc("/checkout")}?plan=gold`,
      };
  }
}

export function TopBar() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [variant, setVariant] = useState<VariantKey | null>(null);
  // BOTD ledger has been retired — stats are no longer queried, so
  // top-bar always falls back to SAFE_VARIANTS that don't quote a hit
  // rate or pick count.
  const stats: { accuracy_pct?: number; total_picks?: number; evaluated?: number } | null = null;
  const canQuoteStats = false;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_DISMISS) === "1") return;
    } catch {
      /* ignore */
    }
    // Defer variant pick until we know whether stats are quotable —
    // stats is null on first render. Waiting one tick keeps the
    // sessionStorage-scoped variant stable once chosen.
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_DISMISS) === "1") return;
    } catch {
      /* ignore */
    }
    if (variant !== null) return; // already picked for this session
    // Wait for the stats hook to resolve before picking — once we
    // know, pick a variant appropriate to the data we can actually
    // quote. If stats are still null after 2s assume they're sparse
    // and use safe variants.
    const pick = () => {
      const v = pickVariantForSession(!canQuoteStats);
      setVariant(v);
      setVisible(true);
      trackEvent("topbar_impression", { topbar_variant: v });
    };
    if (stats === null) {
      const timer = setTimeout(pick, 2000);
      return () => clearTimeout(timer);
    }
    pick();
    return;
  }, [stats, canQuoteStats, variant]);

  const hitRate = useMemo(() => "", []);
  const totalPicks = useMemo(() => "", []);

  const copy = useMemo(() => {
    if (!variant) return null;
    return buildCopy(
      variant,
      (key) => t(key as any),
      loc,
      hitRate,
      totalPicks,
    );
  }, [variant, t, loc, hitRate, totalPicks]);

  const dismiss = () => {
    setClosing(true);
    try {
      sessionStorage.setItem(STORAGE_DISMISS, "1");
    } catch {
      /* ignore */
    }
    setTimeout(() => setVisible(false), 250);
    if (variant) {
      trackEvent("topbar_dismiss", { topbar_variant: variant });
    }
  };

  const onCtaClick = () => {
    if (variant) {
      trackEvent("topbar_click", {
        topbar_variant: variant,
        topbar_cta: copy?.cta,
      });
    }
  };

  if (!visible || !variant || !copy) return null;

  const dotColor = DOT_COLOR[variant];
  const emoji = EMOJI[variant];

  return (
    <div
      data-topbar-variant={variant}
      className={`overflow-hidden transition-all duration-300 ease-out ${
        closing ? "max-h-0 opacity-0" : "max-h-14 opacity-100"
      }`}
    >
      <div
        className="relative flex items-center justify-center gap-2 border-b px-3 py-2 text-[12px] sm:px-10 sm:text-[13px]"
        style={{
          background: "hsl(230 20% 7% / 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "hsl(0 0% 100% / 0.06)",
        }}
      >
        {/* Accent dot — colour rotates with variant */}
        <span
          aria-hidden="true"
          className="relative inline-flex h-1.5 w-1.5 shrink-0 rounded-full"
          style={{
            background: dotColor,
            boxShadow: `0 0 8px ${dotColor}cc`,
          }}
        />

        {/* Emoji (only on sm+ — mobile shows it inline with the
            shortened copy so there's no orphan char at 320px) */}
        <span aria-hidden="true" className="hidden shrink-0 sm:inline">
          {emoji}
        </span>

        {/* Desktop copy */}
        <span className="hidden min-w-0 text-[#cbd3e0] sm:inline">
          {copy.desktop}
        </span>

        {/* Mobile copy */}
        <span className="min-w-0 truncate text-[#cbd3e0] sm:hidden">
          <span aria-hidden="true" className="mr-1">
            {emoji}
          </span>
          {copy.mobile}
        </span>

        <span className="mx-1 hidden text-[#4b5264] sm:inline">·</span>

        <Link
          href={copy.href}
          onClick={onCtaClick}
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#4ade80] transition-colors hover:text-[#86efac]"
        >
          {copy.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6b7280] transition-colors hover:text-[#ededed]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default TopBar;
