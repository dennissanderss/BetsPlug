"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { useBotdTrackRecord } from "@/hooks/use-botd-track-record";

/**
 * TopBar — thin announcement strip above the site nav.
 * NOCTURNE: subtle translucent dark with a soft green dot and a
 * single clickable trial nudge. Dismissable per session.
 */

const STORAGE_KEY = "bp_topbar_d";

export function TopBar() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const stats = useBotdTrackRecord();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setClosing(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setTimeout(() => setVisible(false), 250);
  };

  if (!visible) return null;

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        closing ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
      }`}
    >
      <div
        className="relative flex items-center justify-center border-b px-10 py-2 text-[12px] sm:text-[13px]"
        style={{
          background: "hsl(230 20% 7% / 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "hsl(0 0% 100% / 0.06)",
        }}
      >
        <span className="live-dot mr-2.5" />

        {stats && (
          <span className="hidden text-[#a3a9b8] sm:inline">
            <span className="font-semibold text-[#ededed]">
              {Math.round(stats.accuracy_pct)}%
            </span>{" "}
            {t("topbar.winRate")}
            <span className="mx-2 text-[#4b5264]">·</span>
            <span className="font-semibold text-[#ededed]">
              {stats.total_picks}+
            </span>{" "}
            {t("topbar.picksAnalyzed")}
            <span className="mx-2 text-[#4b5264]">·</span>
          </span>
        )}

        <Link
          href={`${loc("/checkout")}?plan=gold`}
          className="inline-flex items-center gap-1 font-semibold text-[#4ade80] transition-colors hover:text-[#86efac]"
        >
          {t("topbar.cta")}
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
