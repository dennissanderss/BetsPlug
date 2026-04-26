"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-provider";
import { ENABLED_LOCALES, localeMeta, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const { locale, t, setLocale } = useTranslations();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const current = localeMeta[locale];

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(code: Locale) {
    setLocale(code);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("lang.switch")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150",
          "text-slate-300 hover:text-slate-100 hover:bg-white/[0.06]",
          "border border-transparent hover:border-white/[0.08]",
          open && "bg-white/[0.06] border-white/[0.08]"
        )}
      >
        <span className="text-base leading-none select-none">{current.flag}</span>
        <span className="hidden sm:inline text-xs font-medium text-slate-400 tracking-wide uppercase">
          {locale}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-slate-500 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label={t("lang.label")}
          className="absolute right-0 top-full mt-2 w-44 rounded-xl py-1 z-50 animate-slide-up"
          style={{
            background: "rgba(17, 24, 39, 0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)",
          }}
        >
          {/* Header label */}
          <div className="px-3 pt-2 pb-1.5 border-b border-white/[0.06] mb-1">
            <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
              {t("lang.label")}
            </p>
          </div>

          {ENABLED_LOCALES.map((code) => {
            const meta = localeMeta[code];
            const isSelected = code === locale;
            return (
              <button
                key={code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(code)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-100",
                  isSelected
                    ? "text-blue-300 bg-blue-500/[0.08]"
                    : "text-slate-300 hover:text-slate-100 hover:bg-white/[0.05]"
                )}
              >
                <span className="text-base leading-none select-none w-5 shrink-0">
                  {meta.flag}
                </span>
                <span className="flex-1 text-left">{meta.native}</span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
