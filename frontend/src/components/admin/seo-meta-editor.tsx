"use client";

import * as React from "react";
import {
  Globe,
  FileText,
  Check,
  Copy,
  RotateCcw,
  Save,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────────

const LOCALES = ["en", "nl", "de", "fr", "es", "it", "sw", "id"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Francais",
  es: "Espanol",
  it: "Italiano",
  sw: "Kiswahili",
  id: "Bahasa Indonesia",
};

const LOCALE_FLAGS: Record<Locale, string> = {
  en: "GB",
  nl: "NL",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
  sw: "TZ",
  id: "ID",
};

interface PageRecommendation {
  title: string;
  description: string;
}

interface PageDef {
  path: string;
  label: string;
  recommendations: Partial<Record<Locale, PageRecommendation>>;
}

const PAGES: PageDef[] = [
  {
    path: "/",
    label: "Home",
    recommendations: {
      en: {
        title: "BetsPlug - AI Football Predictions & Analytics",
        description:
          "AI-powered football predictions with 4 models. Live probabilities, Elo ratings, and verified track record across 15+ leagues. Start your free trial.",
      },
      nl: {
        title: "BetsPlug - AI Voetbalvoorspellingen & Analyse",
        description:
          "AI-gestuurde voetbalvoorspellingen met 4 modellen. Live kansen, Elo-ratings en geverifieerd track record voor 15+ competities. Start gratis proefperiode.",
      },
      de: {
        title: "BetsPlug - KI-Fussballprognosen & Analysen",
        description:
          "KI-gestutzte Fussballvorhersagen mit 4 Modellen. Live-Wahrscheinlichkeiten, Elo-Ratings und verifizierte Bilanz fur 15+ Ligen. Kostenlos testen.",
      },
      fr: {
        title: "BetsPlug - Predictions Football IA & Analyses",
        description:
          "Predictions football par IA avec 4 modeles. Probabilites en direct, classements Elo et historique verifie pour 15+ ligues. Essai gratuit.",
      },
      es: {
        title: "BetsPlug - Predicciones de Futbol con IA",
        description:
          "Predicciones de futbol con IA y 4 modelos. Probabilidades en vivo, ratings Elo y historial verificado en 15+ ligas. Prueba gratis.",
      },
      it: {
        title: "BetsPlug - Pronostici Calcio IA & Analisi",
        description:
          "Pronostici calcio con IA e 4 modelli. Probabilita in tempo reale, rating Elo e storico verificato per 15+ campionati. Prova gratuita.",
      },
      sw: {
        title: "BetsPlug - Utabiri wa Mpira wa Miguu kwa AI",
        description:
          "Utabiri wa soka kwa AI na mifano 4. Uwezekano wa moja kwa moja, ukadiriaji wa Elo na rekodi iliyothibitishwa kwa ligi 15+.",
      },
      id: {
        title: "BetsPlug - Prediksi Sepak Bola AI & Analitik",
        description:
          "Prediksi sepak bola bertenaga AI dengan 4 model. Probabilitas langsung, peringkat Elo, dan rekam jejak terverifikasi untuk 15+ liga.",
      },
    },
  },
  {
    path: "/articles",
    label: "Articles",
    recommendations: {
      en: {
        title: "Football Analysis & AI Betting Articles | BetsPlug",
        description:
          "In-depth football analysis, AI match breakdowns and data-driven betting insights across Premier League, La Liga, Bundesliga, Serie A and more.",
      },
      nl: {
        title: "Voetbalanalyse & AI Wedtips Artikelen | BetsPlug",
        description:
          "Diepgaande voetbalanalyse, AI-wedstrijdanalyses en datagedreven wedtips voor de Premier League, La Liga, Bundesliga, Serie A en meer.",
      },
      de: {
        title: "Fussballanalyse & KI-Wettartikel | BetsPlug",
        description:
          "Tiefgehende Fussballanalysen, KI-Spielanalysen und datenbasierte Wett-Einblicke fur Premier League, La Liga, Bundesliga, Serie A und mehr.",
      },
      fr: {
        title: "Analyse Football & Articles Paris IA | BetsPlug",
        description:
          "Analyses football approfondies, decryptages IA et insights data pour la Premier League, La Liga, Bundesliga, Serie A et plus.",
      },
      es: {
        title: "Analisis de Futbol & Articulos IA | BetsPlug",
        description:
          "Analisis de futbol en profundidad, desglose de partidos con IA e insights basados en datos para Premier League, La Liga, Bundesliga y mas.",
      },
      it: {
        title: "Analisi Calcio & Articoli IA | BetsPlug",
        description:
          "Analisi calcistiche approfondite, analisi partite IA e insights basati sui dati per Premier League, La Liga, Bundesliga, Serie A e altro.",
      },
      sw: {
        title: "Uchambuzi wa Soka & Makala za AI | BetsPlug",
        description:
          "Uchambuzi wa kina wa soka, uchambuzi wa mechi kwa AI na maarifa yanayotokana na data kwa ligi kuu za Ulaya.",
      },
      id: {
        title: "Analisis Sepak Bola & Artikel AI | BetsPlug",
        description:
          "Analisis sepak bola mendalam, breakdown pertandingan AI, dan wawasan taruhan berbasis data untuk liga-liga top Eropa.",
      },
    },
  },
  {
    path: "/about-us",
    label: "About Us",
    recommendations: {
      en: {
        title: "About BetsPlug - AI Football Analytics Team",
        description:
          "Meet the engineers behind BetsPlug. Football fanatics with ICT backgrounds turning raw match data into transparent, probability-driven predictions.",
      },
      nl: {
        title: "Over BetsPlug - AI Voetbalanalyse Team",
        description:
          "Maak kennis met de engineers achter BetsPlug. Voetbalfanaten met ICT-achtergrond die ruwe data omzetten in transparante voorspellingen.",
      },
      de: {
        title: "Uber BetsPlug - KI-Fussballanalyse Team",
        description:
          "Lernen Sie die Ingenieure hinter BetsPlug kennen. Fussballfans mit IT-Hintergrund, die Spieldaten in transparente Prognosen verwandeln.",
      },
      fr: {
        title: "A Propos de BetsPlug - Equipe d'Analyse IA",
        description:
          "Decouvrez les ingenieurs derriere BetsPlug. Des passionnes de football avec un background IT, transformant les donnees en predictions.",
      },
      es: {
        title: "Sobre BetsPlug - Equipo de Analisis IA",
        description:
          "Conoce a los ingenieros detras de BetsPlug. Fanaticos del futbol con experiencia TIC que convierten datos en predicciones transparentes.",
      },
      it: {
        title: "Chi Siamo - Il Team BetsPlug",
        description:
          "Conosci gli ingegneri dietro BetsPlug. Appassionati di calcio con background IT che trasformano i dati in pronostici trasparenti.",
      },
      sw: {
        title: "Kuhusu BetsPlug - Timu ya Uchambuzi wa AI",
        description:
          "Kutana na wahandisi nyuma ya BetsPlug. Mashabiki wa soka wenye ujuzi wa IT wanaobadilisha data kuwa utabiri wa uwazi.",
      },
      id: {
        title: "Tentang BetsPlug - Tim Analitik AI",
        description:
          "Kenali para insinyur di balik BetsPlug. Penggemar sepak bola dengan latar belakang TI yang mengubah data mentah menjadi prediksi transparan.",
      },
    },
  },
  {
    path: "/match-predictions",
    label: "Match Predictions",
    recommendations: {
      en: {
        title: "AI Football Match Predictions | BetsPlug",
        description:
          "Real-time AI predictions for football matches across 15+ leagues. View probabilities, value bets, and confidence scores. Updated daily.",
      },
      nl: {
        title: "AI Voetbalwedstrijd Voorspellingen | BetsPlug",
        description:
          "Realtime AI-voorspellingen voor voetbalwedstrijden in 15+ competities. Bekijk kansen, value bets en betrouwbaarheidsscores. Dagelijks bijgewerkt.",
      },
    },
  },
  {
    path: "/privacy",
    label: "Privacy Policy",
    recommendations: {
      en: {
        title: "Privacy Policy | BetsPlug",
        description:
          "How BetsPlug collects, uses, and protects your personal data. GDPR-compliant privacy practices.",
      },
      nl: {
        title: "Privacybeleid | BetsPlug",
        description:
          "Hoe BetsPlug uw persoonsgegevens verzamelt, gebruikt en beschermt. AVG-conform privacybeleid.",
      },
    },
  },
  {
    path: "/terms",
    label: "Terms of Service",
    recommendations: {
      en: {
        title: "Terms of Service | BetsPlug",
        description:
          "Terms and conditions for using BetsPlug's AI football analytics platform. Read before signing up.",
      },
      nl: {
        title: "Algemene Voorwaarden | BetsPlug",
        description:
          "Voorwaarden voor het gebruik van BetsPlug's AI voetbalanalyse platform. Lees voor registratie.",
      },
    },
  },
];

const STORAGE_KEY = "betsplug_seo_meta_drafts";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MetaValues {
  title: string;
  description: string;
}

type DraftState = Record<string, Partial<Record<Locale, MetaValues>>>;

// ─── Character count helpers ────────────────────────────────────────────────

function getTitleColor(len: number): string {
  if (len === 0) return "text-slate-500";
  if (len <= 60) return "text-green-400";
  if (len <= 70) return "text-amber-400";
  return "text-red-400";
}

function getTitleBgColor(len: number): string {
  if (len === 0) return "bg-slate-500/15";
  if (len <= 60) return "bg-green-500/15";
  if (len <= 70) return "bg-amber-500/15";
  return "bg-red-500/15";
}

function getDescColor(len: number): string {
  if (len === 0) return "text-slate-500";
  if (len >= 120 && len <= 160) return "text-green-400";
  if ((len >= 100 && len < 120) || (len > 160 && len <= 170))
    return "text-amber-400";
  return "text-red-400";
}

function getDescBgColor(len: number): string {
  if (len === 0) return "bg-slate-500/15";
  if (len >= 120 && len <= 160) return "bg-green-500/15";
  if ((len >= 100 && len < 120) || (len > 160 && len <= 170))
    return "bg-amber-500/15";
  return "bg-red-500/15";
}

function CharBadge({
  count,
  colorFn,
  bgFn,
  optimal,
}: {
  count: number;
  colorFn: (n: number) => string;
  bgFn: (n: number) => string;
  optimal: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        bgFn(count),
        colorFn(count)
      )}
    >
      {count} chars
      <span className="text-[10px] font-normal opacity-70">({optimal})</span>
    </span>
  );
}

// ─── SERP Preview ───────────────────────────────────────────────────────────

function SerpPreview({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const displayTitle = title || "Page Title";
  const displayDesc = description || "Page description will appear here...";
  const displayUrl = `betsplug.com${path}`;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">
        Google SERP Preview
      </p>
      <p className="text-sm font-medium text-blue-400 line-clamp-1 cursor-pointer hover:underline">
        {displayTitle}
      </p>
      <p className="text-xs text-green-500/80">{displayUrl}</p>
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
        {displayDesc}
      </p>
    </div>
  );
}

// ─── Locale Tab Bar ─────────────────────────────────────────────────────────

function LocaleTabs({
  active,
  onChange,
  hasRecommendation,
}: {
  active: Locale;
  onChange: (l: Locale) => void;
  hasRecommendation: (l: Locale) => boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
      {LOCALES.map((locale) => {
        const isActive = locale === active;
        const hasRec = hasRecommendation(locale);
        return (
          <button
            key={locale}
            onClick={() => onChange(locale)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            )}
          >
            <span className="text-[11px] uppercase">{locale}</span>
            {!hasRec && (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page Sidebar ───────────────────────────────────────────────────────────

function PageSidebar({
  pages,
  activePath,
  onSelect,
  drafts,
}: {
  pages: PageDef[];
  activePath: string;
  onSelect: (path: string) => void;
  drafts: DraftState;
}) {
  return (
    <div className="space-y-1">
      {pages.map((page) => {
        const isActive = page.path === activePath;
        const hasDraft = drafts[page.path] && Object.keys(drafts[page.path]!).length > 0;
        return (
          <button
            key={page.path}
            onClick={() => onSelect(page.path)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all",
              isActive
                ? "bg-blue-600/15 border border-blue-500/30 text-blue-300"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent"
            )}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{page.label}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate">
                {page.path}
              </p>
            </div>
            {hasDraft && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SeoMetaEditor() {
  const [activePath, setActivePath] = React.useState(PAGES[0].path);
  const [activeLocale, setActiveLocale] = React.useState<Locale>("en");
  const [drafts, setDrafts] = React.useState<DraftState>({});
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [mobilePageOpen, setMobilePageOpen] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDrafts(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const activePage = PAGES.find((p) => p.path === activePath) ?? PAGES[0];
  const activeRec = activePage.recommendations[activeLocale];
  const activeDraft = drafts[activePath]?.[activeLocale];

  const currentTitle = activeDraft?.title ?? "";
  const currentDesc = activeDraft?.description ?? "";

  // ─── Handlers ───────────────────────────────────────────────────────────

  function updateField(field: "title" | "description", value: string) {
    setDrafts((prev) => ({
      ...prev,
      [activePath]: {
        ...prev[activePath],
        [activeLocale]: {
          title: field === "title" ? value : (prev[activePath]?.[activeLocale]?.title ?? ""),
          description:
            field === "description"
              ? value
              : (prev[activePath]?.[activeLocale]?.description ?? ""),
        },
      },
    }));
    setSaved(false);
  }

  function applyRecommendation() {
    if (!activeRec) return;
    setDrafts((prev) => ({
      ...prev,
      [activePath]: {
        ...prev[activePath],
        [activeLocale]: {
          title: activeRec.title,
          description: activeRec.description,
        },
      },
    }));
    setSaved(false);
  }

  function applyAllRecommendations() {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const page of PAGES) {
        for (const locale of LOCALES) {
          const rec = page.recommendations[locale];
          if (rec) {
            next[page.path] = {
              ...next[page.path],
              [locale]: { title: rec.title, description: rec.description },
            };
          }
        }
      }
      return next;
    });
    setSaved(false);
  }

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Ignore storage errors
    }
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(drafts, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  function resetAll() {
    setDrafts({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  // Count total filled entries
  const totalEntries = Object.values(drafts).reduce((sum, locales) => {
    if (!locales) return sum;
    return (
      sum +
      Object.values(locales).filter(
        (v) => v && (v.title.length > 0 || v.description.length > 0)
      ).length
    );
  }, 0);

  const totalPossible = PAGES.length * LOCALES.length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                SEO Meta Editor
              </h2>
              <p className="text-xs text-slate-500">
                Edit meta titles & descriptions per page per locale
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Progress indicator */}
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium tabular-nums text-slate-300">
              {totalEntries}/{totalPossible} filled
            </span>

            <button
              onClick={applyAllRecommendations}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Apply All AI Recs
            </button>

            <button
              onClick={saveDraft}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                saved
                  ? "border border-green-500/30 bg-green-500/10 text-green-300"
                  : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
              )}
            >
              {saved ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saved ? "Saved!" : "Save Draft"}
            </button>

            <button
              onClick={copyJson}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                copied
                  ? "border border-green-500/30 bg-green-500/10 text-green-300"
                  : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy JSON"}
            </button>

            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main content: sidebar + editor */}
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Page sidebar - desktop */}
        <div className="hidden lg:block">
          <div className="glass-card rounded-xl p-3 sticky top-4">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Pages
            </p>
            <PageSidebar
              pages={PAGES}
              activePath={activePath}
              onSelect={setActivePath}
              drafts={drafts}
            />
          </div>
        </div>

        {/* Page selector - mobile */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobilePageOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span>{activePage.label}</span>
              <span className="font-mono text-xs text-slate-500">
                {activePage.path}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform",
                mobilePageOpen && "rotate-180"
              )}
            />
          </button>
          {mobilePageOpen && (
            <div className="mt-1 rounded-xl border border-white/[0.06] bg-[#0f1629] p-2 shadow-xl">
              <PageSidebar
                pages={PAGES}
                activePath={activePath}
                onSelect={(path) => {
                  setActivePath(path);
                  setMobilePageOpen(false);
                }}
                drafts={drafts}
              />
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Page header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {activePage.label}
                </h3>
                <p className="font-mono text-xs text-slate-500">
                  {activePage.path}
                </p>
              </div>
            </div>
            <a
              href={`https://betsplug.com${activePage.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ExternalLink className="h-3 w-3" />
              View page
            </a>
          </div>

          {/* Locale tabs */}
          <div className="border-b border-white/[0.06] px-6 py-3">
            <LocaleTabs
              active={activeLocale}
              onChange={setActiveLocale}
              hasRecommendation={(l) => !!activePage.recommendations[l]}
            />
          </div>

          {/* Editor form */}
          <div className="p-6 space-y-5">
            {/* Title field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Meta Title
                </label>
                <CharBadge
                  count={currentTitle.length}
                  colorFn={getTitleColor}
                  bgFn={getTitleBgColor}
                  optimal={"< 60 ideal"}
                />
              </div>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder={activeRec?.title ?? "Enter meta title..."}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
              />
              {/* Title length bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    currentTitle.length <= 60
                      ? "bg-green-500"
                      : currentTitle.length <= 70
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                  style={{
                    width: `${Math.min((currentTitle.length / 70) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Description field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Meta Description
                </label>
                <CharBadge
                  count={currentDesc.length}
                  colorFn={getDescColor}
                  bgFn={getDescBgColor}
                  optimal={"120-160 ideal"}
                />
              </div>
              <textarea
                value={currentDesc}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder={
                  activeRec?.description ?? "Enter meta description..."
                }
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors resize-none"
              />
              {/* Description length bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    currentDesc.length >= 120 && currentDesc.length <= 160
                      ? "bg-green-500"
                      : (currentDesc.length >= 100 &&
                            currentDesc.length < 120) ||
                          (currentDesc.length > 160 &&
                            currentDesc.length <= 170)
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                  style={{
                    width: `${Math.min((currentDesc.length / 170) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* AI Recommendation panel */}
            {activeRec && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <p className="text-xs font-semibold text-purple-300">
                      AI Recommendation
                    </p>
                  </div>
                  <button
                    onClick={applyRecommendation}
                    className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-[11px] font-medium text-purple-300 transition-colors hover:bg-purple-500/25"
                  >
                    <Check className="h-3 w-3" />
                    Use This
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">
                      Suggested Title
                    </p>
                    <p className="text-xs text-slate-300">{activeRec.title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">
                      Suggested Description
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeRec.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!activeRec && (
              <div className="rounded-lg border border-dashed border-white/[0.08] p-4 text-center">
                <p className="text-xs text-slate-500">
                  No AI recommendation available for{" "}
                  <span className="font-medium text-slate-400">
                    {LOCALE_LABELS[activeLocale]}
                  </span>{" "}
                  on this page.
                </p>
              </div>
            )}

            {/* SERP Preview */}
            <SerpPreview
              title={currentTitle || activeRec?.title || ""}
              description={currentDesc || activeRec?.description || ""}
              path={activePage.path}
            />

            {/* Coverage summary for this page */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-3">
                Locale Coverage for {activePage.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {LOCALES.map((locale) => {
                  const draft = drafts[activePath]?.[locale];
                  const hasDraft =
                    draft &&
                    (draft.title.length > 0 || draft.description.length > 0);
                  const hasRec = !!activePage.recommendations[locale];

                  return (
                    <button
                      key={locale}
                      onClick={() => setActiveLocale(locale)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
                        locale === activeLocale
                          ? "bg-blue-600/20 border border-blue-500/30 text-blue-300"
                          : "border border-white/[0.06] text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <span className="uppercase">{locale}</span>
                      {hasDraft ? (
                        <Check className="h-2.5 w-2.5 text-green-400" />
                      ) : hasRec ? (
                        <Sparkles className="h-2.5 w-2.5 text-purple-400/50" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-2.5 w-2.5 text-green-400" /> = has draft
                </span>
                <span className="mx-2">|</span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-purple-400/50" /> = AI
                  rec available
                </span>
                <span className="mx-2">|</span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600" />{" "}
                  = empty
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
