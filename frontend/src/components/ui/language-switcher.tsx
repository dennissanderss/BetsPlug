"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/locale-provider";

type Variant = "compact" | "full";

export function LanguageSwitcher({
  variant = "compact",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const { locale, setLocale, t } = useTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = localeMeta[locale];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("lang.switch")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] text-slate-300 backdrop-blur-sm transition-all hover:border-green-500/40 hover:bg-white/[0.06] hover:text-white ${
          variant === "compact"
            ? "h-9 px-3 text-xs font-semibold"
            : "w-full justify-between px-4 py-3 text-sm font-medium"
        }`}
      >
        <span className="flex items-center gap-2">
          <Globe className="h-4 w-4 opacity-70 group-hover:text-green-400" />
          <span className="text-base leading-none" aria-hidden="true">
            {current.flag}
          </span>
          <span className="hidden sm:inline">
            {variant === "compact" ? locale.toUpperCase() : current.native}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-60 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0d1220]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl ${
              variant === "compact" ? "right-0" : "left-0 right-0"
            }`}
          >
            {locales.map((l) => {
              const m = localeMeta[l];
              const active = l === locale;
              return (
                <li key={l}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setLocale(l as Locale);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-green-500/10 text-green-300"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg leading-none" aria-hidden="true">
                        {m.flag}
                      </span>
                      <span>{m.native}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-green-400" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
