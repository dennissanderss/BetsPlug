"use client";

/**
 * TrackRecordHubTabs — shared tab strip that ties the three
 * performance surfaces (cumulative /trackrecord, recent /resultaten,
 * daily pick /bet-of-the-day) into one mental model. Users asked to
 * see "the same data per tier per page" rather than hunting across
 * three routes; the simplest win is to surface a consistent nav
 * header on all three.
 *
 * Rendered at the top of each page's main column so the active tab
 * always matches the current route.
 */

import Link from "next/link";
import { ClipboardList, Trophy, Star } from "lucide-react";
import { useLocalizedHref } from "@/i18n/locale-provider";

type HubTabKey = "cumulative" | "recent" | "potd";

interface TabDef {
  key: HubTabKey;
  href: string;
  label: string;
  sub: string;
  icon: typeof ClipboardList;
}

// Hrefs are canonical (English) paths; useLocalizedHref resolves them
// to the correct Dutch slug per-route (see frontend/src/i18n/routes.ts).
const TABS: TabDef[] = [
  {
    key: "cumulative",
    href: "/trackrecord",
    label: "Cumulatief",
    sub: "All-time per tier",
    icon: ClipboardList,
  },
  {
    key: "recent",
    href: "/results",
    label: "Recent",
    sub: "Laatste 30 dagen",
    icon: Trophy,
  },
  {
    key: "potd",
    href: "/bet-of-the-day",
    label: "Pick of the Day",
    sub: "Dagelijkse topvoorspelling",
    icon: Star,
  },
];

export function TrackRecordHubTabs({ active }: { active: HubTabKey }) {
  const lHref = useLocalizedHref();
  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-3">
        {TABS.map(({ key, href, label, sub, icon: Icon }) => {
          const isActive = key === active;
          return (
            <Link
              key={key}
              href={lHref(href)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-3 px-4 py-3 transition-colors ${
                isActive
                  ? "bg-white/[0.05]"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-emerald-400" : "text-slate-500"
                }`}
              />
              <div className="min-w-0 text-left">
                <p
                  className={`text-sm font-semibold ${
                    isActive ? "text-[#ededed]" : "text-slate-300"
                  }`}
                >
                  {label}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  {sub}
                </p>
              </div>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-400"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default TrackRecordHubTabs;
