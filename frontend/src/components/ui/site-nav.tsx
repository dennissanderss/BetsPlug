"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * SiteNav — shared public navigation used on every marketing page
 * (landing, contact, …). Fixed position, shrinks on scroll, with a
 * mobile slide-out menu. Anchor links (#predictions etc.) point to the
 * home page so they work from any sub-page.
 */
export function SiteNav() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Anchor links are absolute to the localized home page so they work
  // from sub-pages like /contact as well.
  const home = loc("/");
  const navLinks = [
    { href: `${home}#predictions`, label: t("nav.predictions") },
    { href: loc("/how-it-works"), label: t("nav.howItWorks") },
    { href: loc("/track-record"), label: t("nav.trackRecord") },
    { href: loc("/about-us"), label: t("nav.about") },
    { href: `${home}#pricing`, label: t("nav.pricing") },
    { href: loc("/contact"), label: t("nav.contact") },
  ];

  return (
    <>
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#080b14]/80 backdrop-blur-xl transition-all duration-300">
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 ${
            isScrolled ? "py-1 md:py-0.5" : "py-3 md:py-1"
          }`}
        >
          <Link href={home} className="flex items-center">
            <img
              src="/logo.webp"
              alt="BetsPlug"
              className={`w-auto drop-shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all duration-300 ${
                isScrolled
                  ? "h-8 sm:h-10 md:h-12 lg:h-14"
                  : "h-10 sm:h-14 md:h-16 lg:h-20"
              }`}
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: desktop buttons + mobile hamburger */}
          <div className="flex items-center gap-3">
            {/* Language switcher (desktop) */}
            <div className="hidden lg:block">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* Desktop buttons (lg+) */}
            <Link
              href={loc("/dashboard")}
              className={`hidden rounded-lg border border-white/[0.1] font-medium text-slate-300 transition-all hover:border-white/[0.2] hover:text-white lg:inline-block ${
                isScrolled ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
              }`}
            >
              {t("nav.login")}
            </Link>
            <Link
              href={`${home}#pricing`}
              className={`btn-gradient hidden rounded-full font-extrabold tracking-tight shadow-lg shadow-green-500/20 transition-all duration-300 lg:inline-block ${
                isScrolled ? "px-4 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
              }`}
            >
              {t("nav.startFreeTrial")}
            </Link>

            {/* Mobile/Tablet CTA button */}
            <Link
              href={`${home}#pricing`}
              className={`btn-gradient flex items-center justify-center rounded-full font-extrabold tracking-tight shadow-lg shadow-green-500/20 transition-all duration-300 lg:hidden ${
                isScrolled ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs sm:text-sm"
              }`}
            >
              {t("nav.startFreeTrial")}
            </Link>

            {/* Mobile/Tablet hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className={`flex items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-white backdrop-blur-sm transition-all duration-300 hover:border-green-500/40 hover:bg-white/[0.06] lg:hidden ${
                isScrolled ? "h-9 w-9" : "h-11 w-11"
              }`}
            >
              <Menu className={isScrolled ? "h-4 w-4" : "h-5 w-5"} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-out menu ── */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Slide-out panel */}
        <aside
          className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-white/[0.08] bg-gradient-to-b from-[#0d1220] via-[#080b14] to-[#060912] shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute -right-20 top-0 h-[400px] w-[300px] rounded-full bg-green-500/[0.08] blur-[120px]" />

          {/* Top: Logo + close */}
          <div className="relative flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <Link href={home} onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <img
                src="/logo.webp"
                alt="BetsPlug"
                className="h-12 w-auto drop-shadow-[0_0_20px_rgba(74,222,128,0.4)]"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-slate-400 transition-all hover:border-green-500/40 hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Middle: menu items */}
          <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-8">
            <span className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              {t("nav.menu")}
            </span>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center justify-between rounded-2xl border border-transparent px-4 py-4 text-lg font-semibold text-white transition-all hover:border-green-500/20 hover:bg-green-500/[0.06]"
              >
                <span className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700 transition-all group-hover:w-4 group-hover:bg-green-400" />
                  {link.label}
                </span>
                <ChevronRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-green-400" />
              </Link>
            ))}

            {/* Divider */}
            <div className="my-6 border-t border-white/[0.06]" />

            {/* Language switcher (mobile) */}
            <div className="mb-4">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {t("lang.label")}
              </span>
              <LanguageSwitcher variant="full" />
            </div>

            <Link
              href={loc("/dashboard")}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-4 text-base font-medium text-slate-300 transition-all hover:border-white/[0.2] hover:text-white"
            >
              <span>{t("nav.login")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>

          {/* Bottom: CTA */}
          <div className="relative border-t border-white/[0.06] px-6 py-6">
            <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] to-transparent p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                  {t("nav.getStarted")}
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">
                {t("nav.joinBlurb")}
              </p>
              <Link
                href={`${home}#pricing`}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/20"
              >
                {t("nav.startFreeTrial")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default SiteNav;
