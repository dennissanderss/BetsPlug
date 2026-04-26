"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, Globe, Loader2, Search, Target } from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLocalizedHref } from "@/i18n/locale-provider";
import type { SearchResult, SearchResultGroup } from "@/types/api";

// Order in which we surface result groups in the dropdown — keeps
// the most navigable entities (teams, leagues) above the noisier
// match list.
const GROUP_ORDER = ["team", "league", "sport", "match"] as const;
const PER_GROUP_LIMIT = 4;
const TOTAL_LIMIT = 8;

const ICONS: Record<string, React.ElementType> = {
  team: Target,
  league: BarChart3,
  sport: Globe,
  match: Clock,
};

const ICON_TONES: Record<string, string> = {
  team: "text-emerald-300 bg-emerald-500/15",
  league: "text-purple-300 bg-purple-500/15",
  sport: "text-blue-300 bg-blue-500/15",
  match: "text-amber-300 bg-amber-500/15",
};

function hrefFor(r: SearchResult, loc: (p: string) => string): string {
  switch (r.entity_type) {
    case "sport":
      return loc(`/sports/${r.slug ?? r.id}`);
    case "league":
      return loc(`/leagues/${r.slug ?? r.id}`);
    case "team":
      return loc(`/teams/${r.slug ?? r.id}`);
    case "match":
      return loc(`/matches/${r.id}`);
    default:
      return loc("/search");
  }
}

interface HeaderSearchProps {
  variant: "desktop" | "mobile";
  placeholder: string;
  autoFocus?: boolean;
  onClose?: () => void;
}

export function HeaderSearch({
  variant,
  placeholder,
  autoFocus,
  onClose,
}: HeaderSearchProps) {
  const router = useRouter();
  const loc = useLocalizedHref();

  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce query → debouncedQuery (200ms keeps the dropdown snappy
  // without spamming the backend on every keystroke).
  React.useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const enabled = debouncedQuery.length >= 2;

  const { data, isFetching, isError } = useQuery({
    queryKey: ["header-search", debouncedQuery],
    queryFn: () => api.search(debouncedQuery, undefined, 8),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // Flatten groups → at most TOTAL_LIMIT items, capped per group.
  const items: SearchResult[] = React.useMemo(() => {
    if (!data?.groups) return [];
    const ordered = [...(data.groups as SearchResultGroup[])].sort(
      (a, b) =>
        GROUP_ORDER.indexOf(a.entity_type as (typeof GROUP_ORDER)[number]) -
        GROUP_ORDER.indexOf(b.entity_type as (typeof GROUP_ORDER)[number])
    );
    const flat: SearchResult[] = [];
    for (const g of ordered) {
      flat.push(...g.items.slice(0, PER_GROUP_LIMIT));
      if (flat.length >= TOTAL_LIMIT) break;
    }
    return flat.slice(0, TOTAL_LIMIT);
  }, [data]);

  const totalHits = data?.total_hits ?? 0;
  const showDropdown = open && enabled;

  // Reset highlight when items change.
  React.useEffect(() => {
    setActiveIndex(-1);
  }, [items]);

  // Outside-click closes the dropdown (desktop only — mobile owns its
  // overlay close button).
  React.useEffect(() => {
    if (variant !== "desktop") return;
    function onMouseDown(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [variant]);

  React.useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [autoFocus]);

  function navigateAndClose(href: string) {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    router.push(href);
    onClose?.();
  }

  function submitFullSearch() {
    const q = query.trim();
    if (!q) return;
    navigateAndClose(`${loc("/search")}?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      onClose?.();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown && activeIndex >= 0 && items[activeIndex]) {
        navigateAndClose(hrefFor(items[activeIndex], loc));
      } else {
        submitFullSearch();
      }
      return;
    }
    if (!showDropdown || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1 >= items.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 < 0 ? items.length - 1 : i - 1));
    }
  }

  const containerCls =
    variant === "desktop"
      ? "relative flex-1 min-w-0 max-w-sm"
      : "relative w-full";

  const inputCls =
    variant === "desktop"
      ? "flex-1 bg-transparent text-sm text-[#ededed] placeholder:text-[#6b7280] outline-none"
      : "w-full bg-transparent py-2 text-base text-[#ededed] placeholder:text-[#6b7280] outline-none";

  return (
    <div ref={wrapperRef} className={containerCls}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitFullSearch();
        }}
        className="search-pill flex items-center gap-2 px-3"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-[#6b7280]" />
        <input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          className={inputCls}
        />
        {isFetching && enabled && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#4ade80]" />
        )}
      </form>

      {showDropdown && (
        <div
          className={cn(
            "absolute z-[60] mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0b1220]/95 p-2 shadow-2xl backdrop-blur-md",
            variant === "desktop" ? "left-0 right-0" : "left-0 right-0"
          )}
        >
          {/* Loading first time */}
          {isFetching && items.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="px-3 py-3 text-sm text-red-300">
              Search failed — please try again.
            </div>
          )}

          {/* Empty state */}
          {!isFetching && !isError && items.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-400">
              No matches for{" "}
              <span className="font-semibold text-slate-200">
                &ldquo;{debouncedQuery}&rdquo;
              </span>
            </div>
          )}

          {/* Result list */}
          {items.length > 0 && (
            <ul role="listbox" className="space-y-0.5">
              {items.map((it, idx) => {
                const Icon = ICONS[it.entity_type] ?? Search;
                const tone =
                  ICON_TONES[it.entity_type] ??
                  "text-slate-300 bg-white/[0.06]";
                const isActive = idx === activeIndex;
                return (
                  <li key={`${it.entity_type}-${it.id}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => navigateAndClose(hrefFor(it, loc))}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                        isActive
                          ? "bg-white/[0.08]"
                          : "hover:bg-white/[0.05]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          tone
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#ededed]">
                          {it.name}
                        </span>
                        {it.description && (
                          <span className="block truncate text-[11px] text-slate-400">
                            {it.description}
                          </span>
                        )}
                      </span>
                      <span className="hidden shrink-0 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:inline-block">
                        {it.entity_type}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer: view all */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={submitFullSearch}
              className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <span>
                See all results{" "}
                {totalHits > items.length && (
                  <span className="text-slate-500">
                    ({totalHits} total)
                  </span>
                )}
              </span>
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                Enter
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
