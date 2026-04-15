"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight, ChevronRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { TopBar } from "@/components/ui/top-bar";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * SiteNav — NOCTURNE public shell navigation.
 *
 * Translucent dark glass bar pinned to the top. Logo on the left,
 * centred nav pills, right-aligned language + login + primary CTA.
 * Mobile collapses the pills into a glass drawer.
 */

export function SiteNav() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navLinks = [
    { href: loc("/match-predictions"), label: t("nav.predictions") },
    { href: loc("/how-it-works"), label: t("nav.howItWorks") },
    { href: loc("/track-record"), label: t("nav.trackRecord") },
    { href: loc("/about-us"), label: t("nav.about") },
    { href: loc("/pricing"), label: t("nav.pricing") },
    { href: loc("/contact"), label: t("nav.contact") },
  ];

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50">
        <TopBar />

        <nav
          className="transition-all duration-300"
          style={{
            background: scrolled
              ? "hsl(230 20% 7% / 0.82)"
              : "hsl(230 20% 7% / 0.55)",
            backdropFilter: "blur(28px) saturate(140%)",
            WebkitBackdropFilter: "blur(28px) saturate(140%)",
            borderBottom: "1px solid hsl(0 0% 100% / 0.06)",
          }}
        >
          <div
            className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all sm:px-6 ${
              scrolled ? "py-2" : "py-3"
            }`}
          >
            {/* Logo */}
            <Link href={home} className="flex shrink-0 items-center">
              <Image
                src="/logo.webp"
                alt="BetsPlug"
                width={200}
                height={80}
                priority
                className={`w-auto transition-all duration-300 ${
                  scrolled ? "h-9 sm:h-10" : "h-11 sm:h-12"
                }`}
              />
            </Link>

            {/* Centred nav pills (desktop) */}
            <div
              className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#a3a9b8] transition-colors hover:bg-white/[0.04] hover:text-[#ededed]"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Language switcher (desktop) */}
              <div className="hidden lg:block">
                <LanguageSwitcher variant="compact" theme="dark" />
              </div>

              {/* Login (desktop) */}
              <Link
                href={loc("/login")}
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#a3a9b8] transition-colors hover:bg-white/[0.04] hover:text-[#ededed] lg:inline-flex"
              >
                {t("nav.login")}
              </Link>

              {/* Primary CTA */}
              <Link
                href={`${loc("/checkout")}?plan=gold`}
                className="btn-primary hidden items-center gap-1.5 lg:inline-flex"
              >
                {t("nav.startFreeTrial")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              {/* Mobile CTA (compact) */}
              <Link
                href={`${loc("/checkout")}?plan=gold`}
                className="btn-primary inline-flex items-center gap-1 px-3.5 py-2 text-xs lg:hidden"
                style={{ fontSize: "0.75rem" }}
              >
                {t("nav.startFreeTrial")}
              </Link>

              {/* Hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#ededed] transition-colors hover:border-[#4ade80]/50 hover:bg-[#4ade80]/10 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "rgba(5, 6, 10, 0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        />

        {/* Drawer panel */}
        <aside
          className={`absolute right-0 top-0 flex h-full w-[92vw] max-w-sm flex-col overflow-hidden transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            background: "linear-gradient(180deg, hsl(230 22% 8%) 0%, hsl(234 25% 5%) 100%)",
            borderLeft: "1px solid hsl(0 0% 100% / 0.08)",
          }}
        >
          {/* Ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 top-0 h-[400px] w-[300px] rounded-full"
            style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(100px)" }}
          />

          {/* Top — logo + close */}
          <div
            className="relative flex items-center justify-between border-b px-6 py-5"
            style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
          >
            <Link href={home} onClick={() => setMobileOpen(false)} className="flex items-center">
              <Image
                src="/logo.webp"
                alt="BetsPlug"
                width={120}
                height={48}
                className="h-11 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#a3a9b8] transition-colors hover:border-[#4ade80]/50 hover:text-[#ededed]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="relative flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
            <span className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
              {t("nav.menu")}
            </span>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="group flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-[#ededed] transition-colors hover:bg-white/[0.04]"
              >
                <span>{link.label}</span>
                <ChevronRight className="h-4 w-4 text-[#6b7280] transition-all group-hover:translate-x-1 group-hover:text-[#4ade80]" />
              </Link>
            ))}

            <div
              className="my-4 h-px"
              style={{ background: "hsl(0 0% 100% / 0.06)" }}
            />

            <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
              {t("lang.label")}
            </div>
            <div className="px-2">
              <LanguageSwitcher variant="full" theme="dark" />
            </div>

            <Link
              href={loc("/login")}
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm font-medium text-[#a3a9b8] transition-colors hover:border-[#4ade80]/40 hover:text-[#ededed]"
            >
              <span>{t("nav.login")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>

          {/* Bottom CTA */}
          <div
            className="relative border-t px-4 py-5"
            style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
          >
            <Link
              href={`${loc("/checkout")}?plan=gold`}
              onClick={() => setMobileOpen(false)}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              {t("nav.startFreeTrial")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

export default SiteNav;
