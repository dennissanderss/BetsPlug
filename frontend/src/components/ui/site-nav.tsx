"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowRight, ChevronRight, ChevronDown } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { TopBar } from "@/components/ui/top-bar";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/auth";
import {
  PRIMARY_LEAGUES,
  ALL_LEAGUES,
  getLeagueName,
} from "@/data/league-catalog";
import { LEAGUE_LOGO_PATH } from "@/data/league-logos";

/**
 * SiteNav — NOCTURNE public shell navigation.
 *
 * Translucent dark glass bar pinned to the top. Logo on the left,
 * centred nav pills, right-aligned language + login + primary CTA.
 * Mobile collapses the pills into a glass drawer.
 *
 * Auth-aware: signed-in users see a "Dashboard" CTA instead of the
 * "Login"/"Start" pair, so the public site no longer contradicts the
 * /checkout flow (which already reads useAuth) — same browser session
 * showed "Login" on `/` while showing "switch plan" on /checkout
 * before this fix landed.
 */

/**
 * Routes where the marketing nav must be suppressed entirely.
 *
 * After the betsplug.com / app.betsplug.com split the Next.js app
 * effectively only serves the authed surface and the auth funnel —
 * the public marketing site lives in the separate Astro project.
 * Showing the marketing nav here adds visual noise and competes
 * with the user's only intended action on these pages (log in,
 * register, reset password, or use the dashboard).
 */
const HIDDEN_NAV_PATTERNS: ReadonlyArray<RegExp> = [
  /^\/(?:[a-z]{2}\/)?login(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?register(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?forgot-password(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?reset-password(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?verify-email(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?welcome(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?checkout(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?thank-you(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?dashboard(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?predictions(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?bet-of-the-day(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?combo-of-the-day(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?results(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?trackrecord(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?reports(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?strategy(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?subscription(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?myaccount(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?admin(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?live-score(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?favorites(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?deals(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?matches(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?teams(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?weekly-report(?:\/|$)/,
  /^\/(?:[a-z]{2}\/)?search(?:\/|$)/,
];

export function SiteNav() {
  const pathname = usePathname() ?? "";
  const isHiddenRoute = HIDDEN_NAV_PATTERNS.some((rx) => rx.test(pathname));

  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const { user, ready: authReady } = useAuth();
  const isAuthed = authReady && !!user;
  const home = loc("/");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [predictionsOpen, setPredictionsOpen] = useState(false);
  const predictionsRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNl = locale === "nl";

  // Close mega-menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!predictionsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(e.target as Node)
      ) {
        setPredictionsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPredictionsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [predictionsOpen]);

  // Small hover-intent delay so the menu doesn't flicker when the
  // cursor crosses the gap between trigger and panel.
  const openPredictions = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setPredictionsOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setPredictionsOpen(false), 120);
  };

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

  // Match Predictions is rendered as a mega-menu (see below) — the
  // rest are plain links.
  const secondaryLinks = [
    { href: loc("/how-it-works"), label: t("nav.howItWorks") },
    { href: loc("/track-record"), label: t("nav.trackRecord") },
    { href: loc("/about-us"), label: t("nav.about") },
    { href: loc("/pricing"), label: t("nav.pricing") },
    { href: loc("/contact"), label: t("nav.contact") },
  ];

  // Suppress the marketing nav on auth + dashboard routes — those
  // surfaces live on app.betsplug.com after the marketing/app split
  // and shouldn't carry public-funnel chrome.
  if (isHiddenRoute) return null;

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

            {/* Centred nav pills (desktop) — xl: gates the 6-item row to
                viewports wide enough for the longest French/German labels
                ("Comment ça marche", "Wie es funktioniert"). Below 1280px
                the hamburger takes over with a vertical layout. */}
            <div
              className="hidden flex-1 items-center justify-center gap-1 xl:flex"
            >
              {/* Match Predictions — mega-menu trigger */}
              <div
                ref={predictionsRef}
                className="relative"
                onMouseEnter={openPredictions}
                onMouseLeave={scheduleClose}
              >
                <Link
                  href={loc("/match-predictions")}
                  onClick={() => setPredictionsOpen(false)}
                  aria-haspopup="true"
                  aria-expanded={predictionsOpen}
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    predictionsOpen
                      ? "bg-white/[0.06] text-[#ededed]"
                      : "text-[#a3a9b8] hover:bg-white/[0.04] hover:text-[#ededed]"
                  }`}
                >
                  {t("nav.predictions")}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-150 ${
                      predictionsOpen ? "rotate-180" : ""
                    }`}
                  />
                </Link>

                {/* Mega-menu panel */}
                {predictionsOpen && (
                  <div
                    className="absolute left-1/2 top-full z-50 mt-2 w-[min(720px,92vw)] -translate-x-1/2 rounded-2xl p-4 shadow-[0_32px_80px_rgba(0,0,0,0.65)]"
                    style={{
                      // Fully opaque base so hero copy never bleeds through,
                      // with a soft gradient for depth.
                      background:
                        "linear-gradient(180deg, hsl(230 18% 11%) 0%, hsl(230 18% 9%) 100%)",
                      backdropFilter: "blur(32px) saturate(160%)",
                      WebkitBackdropFilter: "blur(32px) saturate(160%)",
                      border: "1px solid hsl(0 0% 100% / 0.12)",
                    }}
                    onMouseEnter={openPredictions}
                    onMouseLeave={scheduleClose}
                  >
                    <div className="mb-3 flex items-center justify-between px-2">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                          {t("nav.mega.topLeagues")}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#6b7280]">
                          {t("nav.mega.topLeaguesSubtitle")}
                        </div>
                      </div>
                      <Link
                        href={loc("/match-predictions")}
                        onClick={() => setPredictionsOpen(false)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/[0.08] px-3 py-1.5 text-[11px] font-bold text-[#86efac] transition hover:bg-[#4ade80]/[0.14]"
                      >
                        {t("nav.mega.allLeagues")}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                      {PRIMARY_LEAGUES.map((league) => {
                        const logo = LEAGUE_LOGO_PATH[league.slug] ?? null;
                        const name = getLeagueName(league, isNl ? "nl" : "en");
                        return (
                          <Link
                            key={league.slug}
                            href={loc(`/match-predictions/${league.slug}`)}
                            onClick={() => setPredictionsOpen(false)}
                            className="group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.05]"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                              {logo ? (
                                <Image
                                  src={logo}
                                  alt=""
                                  width={22}
                                  height={22}
                                  className="object-contain"
                                />
                              ) : (
                                <span className="text-sm" aria-hidden="true">
                                  {league.flag}
                                </span>
                              )}
                            </div>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                              {name}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#6b7280] transition group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
                          </Link>
                        );
                      })}
                    </div>

                    <div
                      className="mt-3 border-t pt-3"
                      style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
                    >
                      <div className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#a3a9b8]">
                        {t("nav.mega.moreLeagues")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ALL_LEAGUES.filter((l) => l.tier === "secondary").map(
                          (league) => (
                            <Link
                              key={league.slug}
                              href={loc(`/match-predictions/${league.slug}`)}
                              onClick={() => setPredictionsOpen(false)}
                              className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[11px] text-[#a3a9b8] transition-colors hover:border-[#4ade80]/30 hover:bg-[#4ade80]/[0.08] hover:text-[#86efac]"
                            >
                              {getLeagueName(league, isNl ? "nl" : "en")}
                            </Link>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-[#a3a9b8] transition-colors hover:bg-white/[0.04] hover:text-[#ededed]"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Language switcher (desktop) */}
              <div className="hidden xl:block">
                <LanguageSwitcher variant="compact" theme="dark" />
              </div>

              {isAuthed ? (
                /* Authed: single Dashboard CTA replaces Login + Start
                   so a signed-in subscriber doesn't see "Login" on the
                   public site (which used to ship even while
                   /checkout knew they were logged in). */
                <Link
                  href={loc("/dashboard")}
                  className="btn-primary hidden items-center gap-1.5 whitespace-nowrap xl:inline-flex"
                >
                  {t("nav.dashboard")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <>
                  {/* Login (desktop) */}
                  <Link
                    href={loc("/login")}
                    className="hidden whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-[#a3a9b8] transition-colors hover:bg-white/[0.04] hover:text-[#ededed] xl:inline-flex"
                  >
                    {t("nav.login")}
                  </Link>

                  {/* Primary CTA */}
                  <Link
                    href={`${loc("/checkout")}?plan=gold`}
                    className="btn-primary hidden items-center gap-1.5 whitespace-nowrap xl:inline-flex"
                  >
                    {t("nav.startFreeTrial")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}

              {/* Mobile CTA (compact) — Dashboard for authed users,
                  signup CTA otherwise. */}
              <Link
                href={isAuthed ? loc("/dashboard") : `${loc("/checkout")}?plan=gold`}
                className="btn-primary inline-flex items-center gap-1 whitespace-nowrap px-3.5 py-2 text-xs xl:hidden"
                style={{ fontSize: "0.75rem" }}
              >
                {isAuthed ? t("nav.dashboard") : t("nav.startFreeTrial")}
              </Link>

              {/* Hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#ededed] transition-colors hover:border-[#4ade80]/50 hover:bg-[#4ade80]/10 xl:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[60] xl:hidden ${
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
            {/* Match Predictions — parent link + top leagues sub-list */}
            <Link
              href={loc("/match-predictions")}
              onClick={() => setMobileOpen(false)}
              className="group flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-[#ededed] transition-colors hover:bg-white/[0.04]"
            >
              <span>{t("nav.predictions")}</span>
              <ChevronRight className="h-4 w-4 text-[#6b7280] transition-all group-hover:translate-x-1 group-hover:text-[#4ade80]" />
            </Link>
            <div className="mx-2 mt-1 mb-2 grid grid-cols-2 gap-1">
              {PRIMARY_LEAGUES.slice(0, 6).map((league) => (
                <Link
                  key={league.slug}
                  href={loc(`/match-predictions/${league.slug}`)}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 text-xs text-[#a3a9b8] transition-colors hover:text-[#ededed]"
                >
                  <span aria-hidden="true">{league.flag}</span>
                  <span className="truncate">
                    {getLeagueName(league, isNl ? "nl" : "en")}
                  </span>
                </Link>
              ))}
            </div>

            {secondaryLinks.map((link) => (
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
              href={isAuthed ? loc("/dashboard") : loc("/login")}
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm font-medium text-[#a3a9b8] transition-colors hover:border-[#4ade80]/40 hover:text-[#ededed]"
            >
              <span>{isAuthed ? t("nav.dashboard") : t("nav.login")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>

          {/* Bottom CTA — hidden for authed users, who already have a
              Dashboard link directly above. */}
          {!isAuthed && (
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
          )}
        </aside>
      </div>
    </>
  );
}

export default SiteNav;
