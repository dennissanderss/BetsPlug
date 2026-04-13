"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  ChevronRight,
  Star,
  Trophy,
  Target,
  Activity,
  ArrowRight,
  CheckCircle2,
  Users,
  Brain,
  LineChart,
  Sparkles,
  Menu,
  X,
  Bell,
  Flame,
  LayoutDashboard,
} from "lucide-react";
import { GetStartedButton } from "@/components/ui/get-started-button";
import { LeaguesTicker } from "@/components/ui/leagues-ticker";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { TopBar } from "@/components/ui/top-bar";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { Article } from "@/data/articles";
import type { Testimonial } from "@/components/ui/testimonials-columns";
import type { ComparisonRow } from "@/components/ui/comparison-table";
import { getLocaleValue } from "@/lib/sanity-data";

const FreePredictions = dynamic(() => import("@/components/ui/free-predictions").then(m => m.FreePredictions), { ssr: false });
const BetsPlugFooter = dynamic(() => import("@/components/ui/betsplug-footer").then(m => m.BetsPlugFooter), { ssr: true });
const TestimonialsSection = dynamic(() => import("@/components/ui/testimonials-section").then(m => m.TestimonialsSection), { ssr: false });
const SocialProofPopup = dynamic(() => import("@/components/ui/social-proof-popup").then(m => m.SocialProofPopup), { ssr: false });
const SeoSection = dynamic(() => import("@/components/ui/seo-section").then(m => m.SeoSection), { ssr: true });
// FloatingSports removed — stadium background replaces floating icons
const HowItWorks = dynamic(() => import("@/components/ui/how-it-works").then(m => m.HowItWorks), { ssr: true });
const ComparisonTable = dynamic(() => import("@/components/ui/comparison-table").then(m => m.ComparisonTable), { ssr: true });
const PricingSection = dynamic(() => import("@/components/ui/pricing-section").then(m => m.PricingSection), { ssr: true });
const LatestArticlesSection = dynamic(() => import("@/components/ui/latest-articles-section").then(m => m.LatestArticlesSection), { ssr: true });

// ─── Featured match data ─────────────────────────────────────────────────────

interface FeaturedMatch {
  available: boolean;
  home_team: string | null;
  away_team: string | null;
  league: string | null;
  kickoff: string | null;
  pick: string | null;
  home_win_prob: number | null;
  draw_prob: number | null;
  away_win_prob: number | null;
  confidence: number | null;
  elo_diff: number | null;
  edge: number | null;
  label: string | null;
}

function useFeaturedMatch() {
  const [data, setData] = useState<FeaturedMatch | null>(null);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/homepage/featured-match`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, []);
  return data;
}

function useBotdStats() {
  const [data, setData] = useState<{ accuracy_pct: number; total_picks: number; correct: number; current_streak: number } | null>(null);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/bet-of-the-day/track-record`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, []);
  return data;
}

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Dashboard Preview Section ──────────────────────────────────────────────
// Shows off the real product inside a stylized browser mock — copy on the
// left, mock on the right. Purely presentational: no data fetching.

function DashboardPreviewSection() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const features = [
    {
      icon: Target,
      title: t("dashPrev.feature1Title"),
      desc: t("dashPrev.feature1Desc"),
    },
    {
      icon: Activity,
      title: t("dashPrev.feature2Title"),
      desc: t("dashPrev.feature2Desc"),
    },
    {
      icon: Shield,
      title: t("dashPrev.feature3Title"),
      desc: t("dashPrev.feature3Desc"),
    },
    {
      icon: Bell,
      title: t("dashPrev.feature4Title"),
      desc: t("dashPrev.feature4Desc"),
    },
  ];

  const navItems = [
    { icon: LayoutDashboard, label: t("dashPrev.mockNavDashboard"), active: true },
    { icon: Target, label: t("dashPrev.mockNavPredictions") },
    { icon: Trophy, label: t("dashPrev.mockNavResults") },
    { icon: Flame, label: t("dashPrev.mockNavBet"), badge: "HOT" },
    { icon: BarChart3, label: t("dashPrev.mockNavTrack") },
    { icon: Activity, label: t("dashPrev.mockNavLive"), badge: "LIVE" },
  ];

  const kpis = [
    {
      label: t("dashPrev.mockKpi1Label"),
      value: "3.939",
      note: "All time",
      icon: Activity,
    },
    {
      label: t("dashPrev.mockKpi2Label"),
      value: "50.3%",
      note: t("dashPrev.mockKpi2Note"),
      icon: Target,
      accent: true,
    },
    {
      label: t("dashPrev.mockKpi3Label"),
      value: "+12.0%",
      note: t("dashPrev.mockKpi3Note"),
      icon: TrendingUp,
    },
    {
      label: t("dashPrev.mockKpi4Label"),
      value: "62.7%",
      note: t("dashPrev.mockKpi4Note"),
      icon: Sparkles,
    },
  ];

  const accuracyBars = [
    { label: "Premier", value: 58 },
    { label: "La Liga", value: 54 },
    { label: "Bundes.", value: 52 },
    { label: "Serie A", value: 57 },
    { label: "Ligue 1", value: 50 },
    { label: "Eredivisie", value: 55 },
  ];

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/[0.06] blur-[140px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          {/* ─── Left: copy ─── */}
          <div className="min-w-0">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 backdrop-blur-sm">
              <LayoutDashboard className="h-4 w-4 text-green-400" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">
                {t("dashPrev.badge")}
              </span>
            </div>

            <h2 className="text-balance break-words text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("dashPrev.titleA")}{" "}
              <span className="gradient-text">{t("dashPrev.titleHighlight")}</span>
              {t("dashPrev.titleB")}
            </h2>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("dashPrev.subtitle")}
            </p>

            {/* Feature list */}
            <ul className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, desc }) => (
                <li
                  key={title}
                  className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm transition hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/[0.08]">
                    <Icon className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">
                      {desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href={loc("/checkout")}
                className="btn-gradient inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-bold"
              >
                {t("dashPrev.cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* ─── Right: browser mock with dashboard ─── */}
          <div className="relative min-w-0">
            {/* Outer glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-transparent blur-2xl"
            />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1a] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/70" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <span className="h-3 w-3 rounded-full bg-green-500/70" />
                </div>
                <div className="mx-auto flex max-w-[240px] items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400">
                  <Shield className="h-3 w-3 text-green-400" />
                  <span className="truncate">betsplug.com/dashboard</span>
                </div>
              </div>

              {/* Dashboard body */}
              <div className="grid grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)]">
                {/* Sidebar */}
                <aside className="border-r border-white/[0.06] bg-black/20 p-3 sm:p-4">
                  <div className="mb-5 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-green-400 to-emerald-500 text-[10px] font-black text-black">
                      B
                    </div>
                    <span className="text-[11px] font-bold text-white">BETS<span className="text-green-400">PLUG</span></span>
                  </div>

                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 rounded-md px-2 py-2 text-[10px] sm:text-[11px] ${
                          item.active
                            ? "bg-green-500/[0.12] text-green-300"
                            : "text-slate-400"
                        }`}
                      >
                        <item.icon
                          className={`h-3 w-3 shrink-0 ${
                            item.active ? "text-green-400" : "text-slate-500"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.badge === "HOT" && (
                          <span className="ml-auto rounded bg-orange-500/20 px-1 text-[8px] font-bold text-orange-300">
                            HOT
                          </span>
                        )}
                        {item.badge === "LIVE" && (
                          <span className="ml-auto flex items-center gap-0.5 rounded bg-red-500/20 px-1 text-[8px] font-bold text-red-300">
                            <span className="h-1 w-1 animate-pulse rounded-full bg-red-400" />
                            LIVE
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </aside>

                {/* Main */}
                <div className="min-w-0 space-y-4 p-3 sm:p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="gradient-text text-xl font-extrabold leading-tight sm:text-2xl">
                        {t("dashPrev.mockTitle")}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-[11px]">
                        {t("dashPrev.mockSubtitle")}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/[0.08] px-2 py-1 text-[9px] font-semibold text-green-300 sm:text-[10px]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                      {t("dashPrev.mockLive")}
                    </div>
                  </div>

                  {/* KPI grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {kpis.map((kpi) => (
                      <div
                        key={kpi.label}
                        className={`min-w-0 rounded-lg border p-2 sm:p-3 ${
                          kpi.accent
                            ? "border-green-500/30 bg-green-500/[0.06]"
                            : "border-white/[0.06] bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 truncate text-[8px] font-bold uppercase tracking-wider text-slate-500 sm:text-[9px]">
                            {kpi.label}
                          </div>
                          <kpi.icon
                            className={`h-3 w-3 ${
                              kpi.accent ? "text-green-400" : "text-slate-500"
                            }`}
                          />
                        </div>
                        <div
                          className={`mt-1 text-base font-extrabold leading-tight sm:text-xl ${
                            kpi.accent ? "text-green-300" : "text-white"
                          }`}
                        >
                          {kpi.value}
                        </div>
                        <div className="mt-0.5 text-[9px] text-slate-500 sm:text-[10px]">
                          {kpi.note}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart + Bars row */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Trend chart */}
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <div className="text-[10px] font-bold text-white sm:text-[11px]">
                        {t("dashPrev.mockChartTitle")}
                      </div>
                      <div className="mt-0.5 text-[9px] text-slate-500">
                        {t("dashPrev.mockChartSub")}
                      </div>
                      <svg
                        viewBox="0 0 200 60"
                        className="mt-2 h-14 w-full"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="dp-line" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#4ade80" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                          <linearGradient id="dp-fill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 45 L30 38 L60 42 L90 28 L120 32 L150 18 L180 22 L200 12 L200 60 L0 60 Z"
                          fill="url(#dp-fill)"
                        />
                        <path
                          d="M0 45 L30 38 L60 42 L90 28 L120 32 L150 18 L180 22 L200 12"
                          fill="none"
                          stroke="url(#dp-line)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* Accuracy bars */}
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <div className="text-[10px] font-bold text-white sm:text-[11px]">
                        {t("dashPrev.mockAccuracyTitle")}
                      </div>
                      <div className="mt-0.5 text-[9px] text-slate-500">
                        {t("dashPrev.mockAccuracySub")}
                      </div>
                      <div className="mt-3 flex h-14 items-end gap-1.5">
                        {accuracyBars.map((b) => (
                          <div
                            key={b.label}
                            className="flex flex-1 flex-col items-center gap-1"
                          >
                            <div
                              className="w-full rounded-sm bg-gradient-to-t from-green-500/70 to-green-400"
                              style={{ height: `${b.value}%` }}
                            />
                            <span className="text-[7px] text-slate-500 sm:text-[8px]">
                              {b.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stat chip */}
            <div className="absolute -left-4 top-1/3 hidden rounded-xl border border-green-500/30 bg-[#0d1220]/90 p-3 shadow-xl backdrop-blur-xl sm:block">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-400" />
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">
                    Today
                  </div>
                  <div className="text-sm font-extrabold text-white">12 wins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────────────

interface HomeContentProps {
  articles: Article[];
  testimonials: Testimonial[];
  homepage?: any;
}

export function HomeContent({ articles, testimonials, homepage }: HomeContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();

  // Resolve Sanity comparison rows to current locale
  const comparisonRows: ComparisonRow[] | undefined = homepage?.comparisonRows?.length
    ? homepage.comparisonRows.map((r: any) => ({
        feature: getLocaleValue(r.feature, locale),
        betsplug: r.betsplug ?? true,
        freeTools: r.freeTools ?? false,
        bookmakers: r.bookmakers ?? false,
        note: getLocaleValue(r.note, locale) || undefined,
      }))
    : undefined;
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const featured = useFeaturedMatch();
  const botdStats = useBotdStats();

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

  const navLinks = [
    { href: loc("/match-predictions"), label: t("nav.predictions") },
    { href: loc("/how-it-works"), label: t("nav.howItWorks") },
    { href: loc("/track-record"), label: t("nav.trackRecord") },
    { href: loc("/about-us"), label: t("nav.about") },
    { href: "#pricing", label: t("nav.pricing") },
    { href: loc("/contact"), label: t("nav.contact") },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080b14] text-white">
      {/* ── Top Bar + Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <TopBar />
        <nav className="border-b border-white/[0.06] bg-[#080b14]/80 backdrop-blur-xl transition-all duration-300">
          <div
            className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 ${
              isScrolled ? "py-1 md:py-0.5" : "py-3 md:py-1"
            }`}
          >
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.webp"
              alt="BetsPlug logo"
              width={200}
              height={80}
              priority
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
                className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
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
              href={loc("/login")}
              className={`hidden rounded-md border border-white/[0.1] font-medium text-slate-300 transition-all hover:border-white/[0.2] hover:text-white lg:inline-block ${
                isScrolled ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
              }`}
            >
              {t("nav.login")}
            </Link>
            <Link
              href={`${loc("/checkout")}?plan=gold`}
              className={`btn-gradient hidden rounded-md font-extrabold tracking-tight shadow-lg shadow-green-500/20 transition-all duration-300 lg:inline-block ${
                isScrolled ? "px-4 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
              }`}
            >
              {t("nav.startFreeTrial")}
            </Link>

            {/* Mobile/Tablet CTA button */}
            <Link
              href={`${loc("/checkout")}?plan=gold`}
              className={`btn-gradient flex items-center justify-center rounded-md font-extrabold tracking-tight shadow-lg shadow-green-500/20 transition-all duration-300 lg:hidden ${
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
      </header>

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
          className={`absolute right-0 top-0 flex h-full w-[92vw] max-w-sm flex-col overflow-hidden border-l border-white/[0.08] bg-gradient-to-b from-[#0d1220] via-[#080b14] to-[#060912] shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute -right-20 top-0 h-[400px] w-[300px] rounded-full bg-green-500/[0.08] blur-[120px]" />

          {/* Top: Logo + close */}
          <div className="relative flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <Image
                src="/logo.webp"
                alt="BetsPlug logo"
                width={120}
                height={48}
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
              href={loc("/login")}
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
                href={`${loc("/checkout")}?plan=gold`}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-gradient flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/20"
              >
                {t("nav.startFreeTrial")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32">
        {/* Stadium background image */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Dark overlay gradient for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080b14]/90 via-[#080b14]/85 to-[#080b14]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            {/* Left: Copy */}
            <div>
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 backdrop-blur-sm">
                <span className="live-dot" />
                <span className="text-xs font-semibold uppercase tracking-wider text-green-300">
                  {t("hero.badge")}
                </span>
              </div>

              <h1 className="text-balance break-words text-[2.25rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.75rem] xl:text-6xl">
                {t("hero.titleLine1")}{" "}
                <span className="gradient-text">{t("hero.titleLine2")}</span>
                {t("hero.titleLine3") ? ` ${t("hero.titleLine3")}` : ""}
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-400">
                {t("hero.subtitle")}
              </p>

              {/* USP row — icon + short heading, no box */}
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                {[
                  { icon: Brain, title: t("hero.usp1Title") },
                  { icon: Target, title: t("hero.usp2Title") },
                  { icon: CheckCircle2, title: t("hero.usp3Title") },
                ].map(({ icon: Icon, title }) => (
                  <div key={title} className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 shrink-0 text-green-400" />
                    <span className="text-sm font-semibold text-white">
                      {title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Users trust bar */}
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <div className="flex items-center -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
                  ].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 border-[#080b14] object-cover"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white">
                    <AnimatedNumber target={1500} suffix="+" />
                  </p>
                  <p className="text-xs text-slate-500">{t("hero.activeUsers")}</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href={`${loc("/checkout")}?plan=gold`}>
                  <GetStartedButton>{t("hero.ctaPrimary")}</GetStartedButton>
                </Link>
                <Link
                  href={loc("/how-it-works")}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-green-500/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10">
                    <ArrowRight className="h-3.5 w-3.5 -rotate-45" />
                  </span>
                  {t("hero.ctaSecondary")}
                </Link>
              </div>
            </div>

            {/* Right: Floating stats card */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-md">
                {/* Glow halo */}
                <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-green-500/30 via-emerald-500/10 to-transparent blur-3xl" />

                {/* Main phone-like card */}
                <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 backdrop-blur-xl shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t("hero.freePrediction") || "Free Prediction"}
                      </p>
                      <p className="mt-1 text-xl font-extrabold text-white">{featured?.available ? `${featured.home_team} vs ${featured.away_team}` : "Arsenal vs Chelsea"}</p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-[10px] font-bold uppercase text-green-400">
                      <Sparkles className="h-3 w-3" /> {t("hero.hot")}
                    </span>
                  </div>

                  <div className="mb-4 rounded-2xl border border-white/5 bg-black/30 p-4">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="text-sm text-slate-400">{t("hero.homeWin")}</span>
                      <span className="text-2xl font-extrabold text-green-400">{featured?.available ? `${Math.round((featured.home_win_prob ?? 0.52) * 100)}%` : "52%"}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]" style={{ width: `${featured?.available ? Math.round((featured.home_win_prob ?? 0.52) * 100) : 52}%` }} />
                    </div>
                    <div className="mt-3 flex gap-2 text-xs text-slate-500">
                      <span>{t("hero.draw")} {featured?.available ? `${Math.round((featured.draw_prob ?? 0.24) * 100)}%` : "24%"}</span>
                      <span>·</span>
                      <span>{t("hero.away")} {featured?.available ? `${Math.round((featured.away_win_prob ?? 0.24) * 100)}%` : "24%"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: t("hero.confidence"), value: featured?.available ? `${Math.round((featured.confidence ?? 0.78) * 100)}%` : "78%" },
                      { label: "ACCURACY", value: `${botdStats?.accuracy_pct ?? 66.5}%` },
                      { label: "PICKS TODAY", value: "5+" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-white/5 bg-black/20 p-3 text-center"
                      >
                        <p className="text-[10px] font-medium uppercase text-slate-500">{s.label}</p>
                        <p className="mt-1 text-sm font-bold text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={loc("/predictions")}
                    className="btn-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-bold"
                  >
                    {t("hero.joinNow")} <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Floating mini-card — real BOTD accuracy */}
                <div className="absolute -left-10 -top-6 rotate-[-6deg] rounded-2xl border border-white/10 bg-[#0d1220]/90 p-3 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Pick of the Day</p>
                      <p className="text-sm font-extrabold text-white">{botdStats?.accuracy_pct ?? 66.7}%</p>
                    </div>
                  </div>
                </div>

                {/* Floating bottom card — real correct count */}
                <div className="absolute -right-6 -bottom-4 rotate-[5deg] rounded-2xl border border-white/10 bg-[#0d1220]/90 p-3 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                      <Trophy className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Correct Picks</p>
                      <p className="text-sm font-extrabold text-white">{botdStats?.correct ?? 226}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LEAGUES WE COVER — infinite ticker
         ═══════════════════════════════════════════════════════════════════ */}
      <LeaguesTicker />

      {/* ═══════════════════════════════════════════════════════════════════
          FREE PREDICTIONS — 3 AI picks to demonstrate value (reciprocity)
         ═══════════════════════════════════════════════════════════════════ */}
      <FreePredictions />

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS — 3 steps, moved up for AIDA Interest phase
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TRUSTED PARTNER SECTION — 3 cards with middle highlighted
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="trusted-partner" className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 grid gap-8 md:grid-cols-2 md:items-end">
            <div>
              <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                {t("trusted.titleA")}{" "}
                <span className="gradient-text">{t("trusted.titleHighlight")}</span>{" "}
                {t("trusted.titleB")}
                <br />
                {t("trusted.titleC")}
              </h2>
            </div>
            <p className="text-base leading-relaxed text-slate-400">
              {t("trusted.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="glass-card-hover relative overflow-hidden p-8">
              <p className="mb-8 text-5xl font-extrabold text-white/10">01.</p>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">{t("trusted.card1Title")}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {t("trusted.card1Desc")}
              </p>
            </div>

            {/* Card 2 — HIGHLIGHTED */}
            <div className="card-highlight relative overflow-hidden p-8">
              <p className="mb-8 text-5xl font-extrabold text-black/15">02.</p>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black/15">
                <Brain className="h-6 w-6 text-black" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-black">{t("trusted.card2Title")}</h3>
              <p className="mb-6 text-sm leading-relaxed text-black/80">
                {t("trusted.card2Desc")}
              </p>
              <Link
                href="#track-record"
                className="inline-flex items-center gap-1 text-sm font-bold text-black hover:gap-2 transition-all"
              >
                {t("trusted.learnMore")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="glass-card-hover relative overflow-hidden p-8">
              <p className="mb-8 text-5xl font-extrabold text-white/10">03.</p>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">{t("trusted.card3Title")}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {t("trusted.card3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS / CHART SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="track-record" className="relative overflow-hidden py-20 md:py-28">
        {/* Unique background: subtle grid pattern + off-center glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#070a12] via-[#0a1220] to-[#070a12]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(74,222,128,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-green-500/[0.06] blur-[140px]" />
          <div className="absolute right-[10%] top-10 h-[320px] w-[320px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            {/* Left: chart visualization */}
            <div className="relative">
              <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl">
                {/* Top stat */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-400">
                      {t("track.label")}
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-white">75.4%</p>
                    <p className="text-xs text-slate-500">{t("track.accuracy")}</p>
                  </div>
                  <span className="rounded-full bg-green-500/15 px-3 py-1 text-[11px] font-bold text-green-400">
                    ▲ +5.45%
                  </span>
                </div>

                {/* Mock line chart */}
                <div className="relative h-48">
                  <svg viewBox="0 0 400 180" className="h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 140 L 40 120 L 80 130 L 120 90 L 160 100 L 200 70 L 240 80 L 280 50 L 320 60 L 360 30 L 400 40 L 400 180 L 0 180 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M 0 140 L 40 120 L 80 130 L 120 90 L 160 100 L 200 70 L 240 80 L 280 50 L 320 60 L 360 30 L 400 40"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: "drop-shadow(0 0 8px rgba(74, 222, 128, 0.6))" }}
                    />
                    {/* Dots */}
                    {[
                      [160, 100],
                      [280, 50],
                      [360, 30],
                    ].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="5" fill="#4ade80" />
                    ))}
                  </svg>
                </div>

                {/* Bottom metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                  {[
                    { label: t("track.metricPredictions"), value: "1,284" },
                    { label: t("track.metricModels"), value: "4" },
                    { label: t("track.metricLeagues"), value: "15+" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-extrabold text-white">{s.value}</p>
                      <p className="text-[10px] uppercase text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating mini card */}
              <div className="absolute -right-4 -top-4 rotate-3 rounded-2xl border border-white/10 bg-[#0d1220]/95 p-4 backdrop-blur-xl shadow-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {t("track.thisWeek")}
                </p>
                <p className="mt-1 text-xl font-extrabold text-green-400">+12.4%</p>
                <p className="text-[10px] text-slate-500">ROI</p>
              </div>
            </div>

            {/* Right: copy */}
            <div>
              <span className="mb-4 inline-block rounded-full bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
                {t("track.badge")}
              </span>
              <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                {t("track.titleA")}{" "}
                <span className="gradient-text">{t("track.titleHighlight")}</span>
                <br />
                {t("track.titleB")}
              </h2>

              <div className="mt-6 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-green-400 text-green-400" />
                ))}
                <span className="ml-2 text-sm text-slate-400">{t("track.rating")}</span>
              </div>

              <p className="mt-6 text-base leading-relaxed text-slate-400">
                {t("track.desc1")}
              </p>

              <p className="mt-4 text-base leading-relaxed text-slate-400">
                {t("track.desc2")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={loc("/predictions")}>
                  <GetStartedButton>{t("track.cta")}</GetStartedButton>
                </Link>
                <Link
                  href="#faq"
                  className="text-sm font-semibold text-slate-400 underline underline-offset-4 transition-colors hover:text-white"
                >
                  {t("track.askQuestion")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES GRID
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="predictions" className="relative overflow-hidden py-20 md:py-28">
        {/* Unique background: dotted pattern + twin side glows */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080b14] via-[#0a0f1a] to-[#080b14]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.55) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-1/3 h-[420px] w-[420px] rounded-full bg-green-500/[0.06] blur-[130px]" />
          <div className="absolute -right-20 bottom-1/4 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.05] blur-[130px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <span className="mb-4 inline-block rounded-full bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
              {t("features.badge")}
            </span>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
              {t("features.titleA")}{" "}
              <span className="gradient-text">{t("features.titleB")}</span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Zap, title: t("features.f1Title"), desc: t("features.f1Desc") },
              { icon: Brain, title: t("features.f2Title"), desc: t("features.f2Desc") },
              { icon: LineChart, title: t("features.f3Title"), desc: t("features.f3Desc") },
              { icon: Shield, title: t("features.f4Title"), desc: t("features.f4Desc") },
              { icon: Star, title: t("features.f5Title"), desc: t("features.f5Desc") },
              { icon: Users, title: t("features.f6Title"), desc: t("features.f6Desc") },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card-hover group p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 transition-all group-hover:bg-green-500/20">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMPARISON TABLE — BetsPlug vs competitors (funnel: differentiation)
         ═══════════════════════════════════════════════════════════════════ */}
      <ComparisonTable rows={comparisonRows} />

      {/* ═══════════════════════════════════════════════════════════════════
          DASHBOARD PREVIEW — show off the product inside a browser mock
         ═══════════════════════════════════════════════════════════════════ */}
      <DashboardPreviewSection />

      {/* ═══════════════════════════════════════════════════════════════════
          TESTIMONIALS
         ═══════════════════════════════════════════════════════════════════ */}
      <TestimonialsSection testimonials={testimonials} />

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING — plans + lifetime Platinum deal
         ═══════════════════════════════════════════════════════════════════ */}
      <PricingSection />

      {/* ═══════════════════════════════════════════════════════════════════
          SEO CONTENT
         ═══════════════════════════════════════════════════════════════════ */}
      <SeoSection />

      {/* ═══════════════════════════════════════════════════════════════════
          LATEST ARTICLES — 3 most recent posts + light "see all" link
         ═══════════════════════════════════════════════════════════════════ */}
      <LatestArticlesSection articles={articles} />

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA — last push before footer
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] via-emerald-500/[0.04] to-transparent p-10 backdrop-blur-xl md:p-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-green-500/20 blur-[100px]" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px]" />

            <div className="relative text-center">
              <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
                {t("finalCta.badge")}
              </span>
              <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                {t("finalCta.titleA")}{" "}
                <span className="gradient-text">{t("finalCta.titleHighlight")}</span>
                <br />
                {t("finalCta.titleB")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-slate-400">
                {t("finalCta.subtitle")}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href={`${loc("/checkout")}?plan=gold`}>
                  <GetStartedButton>{t("finalCta.primary")}</GetStartedButton>
                </Link>
                <Link
                  href={loc("/about")}
                  className="text-sm font-semibold text-slate-400 underline underline-offset-4 transition-colors hover:text-white"
                >
                  {t("finalCta.secondary")}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                {[
                  t("finalCta.moneyBack"),
                  t("finalCta.cancelAnytime"),
                  t("finalCta.instantAccess"),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════════════════════════════ */}
      <BetsPlugFooter />

      {/* Social proof popup */}
      <SocialProofPopup />
    </div>
  );
}
