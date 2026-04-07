"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Monitor,
  Trophy,
  ChevronDown,
  Check,
  Save,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Sport {
  id: string;
  label: string;
  emoji: string;
}

interface League {
  id: string;
  label: string;
  sportId: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SPORTS: Sport[] = [
  { id: "football",         label: "Football",         emoji: "⚽" },
  { id: "basketball",       label: "Basketball",       emoji: "🏀" },
  { id: "tennis",           label: "Tennis",           emoji: "🎾" },
  { id: "baseball",         label: "Baseball",         emoji: "⚾" },
  { id: "american-football",label: "American Football",emoji: "🏈" },
  { id: "ice-hockey",       label: "Ice Hockey",       emoji: "🏒" },
  { id: "cricket",          label: "Cricket",          emoji: "🏏" },
  { id: "f1",               label: "Formula 1",        emoji: "🏎️" },
  { id: "esports",          label: "Esports",          emoji: "🎮" },
];

const LEAGUES: League[] = [
  { id: "pl",          label: "Premier League",    sportId: "football" },
  { id: "laliga",      label: "La Liga",            sportId: "football" },
  { id: "bundesliga",  label: "Bundesliga",         sportId: "football" },
  { id: "seriea",      label: "Serie A",            sportId: "football" },
  { id: "ligue1",      label: "Ligue 1",            sportId: "football" },
  { id: "ucl",         label: "Champions League",   sportId: "football" },
  { id: "nba",         label: "NBA",                sportId: "basketball" },
  { id: "euroleague",  label: "EuroLeague",         sportId: "basketball" },
];

const TIMEZONES = [
  "UTC",
  "Europe/Amsterdam",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70",
        checked
          ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          : "bg-white/[0.1]"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-white/[0.06] pb-4 mb-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
        <Icon className="h-4 w-4 text-blue-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Save toast ───────────────────────────────────────────────────────────────

function SaveToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 shadow-xl backdrop-blur-sm transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      )}
    >
      <Check className="h-4 w-4" />
      Settings saved successfully
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // Profile
  const [displayName, setDisplayName] = useState("Dennis van der Berg");
  const [email]                        = useState("dennis@betsplug.io");
  const [editingProfile, setEditingProfile] = useState(false);

  // Sport preferences
  const [followedSports, setFollowedSports] = useState<Set<string>>(
    new Set(["football", "basketball", "tennis"])
  );
  const [alertFollowedOnly, setAlertFollowedOnly] = useState(true);

  // League preferences
  const [followedLeagues, setFollowedLeagues] = useState<Set<string>>(
    new Set(["pl", "bundesliga", "ucl", "nba"])
  );

  // Notifications
  const [notifs, setNotifs] = useState({
    matchStart:    true,
    predUpdates:   true,
    strategyCalls: true,
    weeklyReport:  false,
    modelAlerts:   true,
  });

  // Display
  const [oddsFormat, setOddsFormat] = useState<"decimal" | "fractional" | "american">("decimal");
  const [language,   setLanguage]   = useState("EN");
  const [timezone,   setTimezone]   = useState("Europe/Amsterdam");
  const [lightMode,  setLightMode]  = useState(false);

  // Save toast
  const [showToast, setShowToast] = useState(false);

  // ── helpers ──

  const toggleSport = (id: string) => {
    setFollowedSports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleLeague = (id: string) => {
    setFollowedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const setNotif = (key: keyof typeof notifs) => (v: boolean) =>
    setNotifs((prev) => ({ ...prev, [key]: v }));

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Leagues grouped by sport (only for followed sports)
  const visibleSportIds = Array.from(followedSports);
  const leaguesBySport = visibleSportIds
    .map((sid) => ({
      sport: SPORTS.find((s) => s.id === sid)!,
      leagues: LEAGUES.filter((l) => l.sportId === sid),
    }))
    .filter((g) => g.leagues.length > 0);

  // Initials for avatar
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight gradient-text">Settings</h1>
        <p className="mt-1.5 text-sm text-slate-400">Customize your experience</p>
      </div>

      {/* ── Profile ─────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 animate-slide-up">
        <SectionHeader
          icon={User}
          title="Profile"
          description="Your personal information and account role"
        />

        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 text-xl font-bold text-blue-300 glow-blue-sm border border-blue-500/20">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-slate-100 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 mb-1"
              />
            ) : (
              <p className="text-base font-semibold text-slate-100">{displayName}</p>
            )}
            <p className="text-xs text-slate-500">{email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditingProfile((v) => !v)}
            className="shrink-0 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
          >
            {editingProfile ? "Done" : "Edit profile"}
          </button>
        </div>
      </div>

      {/* ── Sport Preferences ────────────────────────────────────────────────── */}
      <div className="glass-card p-6 animate-slide-up">
        <SectionHeader
          icon={Trophy}
          title="Followed Sports"
          description="Select the sports you want to track and receive intelligence for"
        />

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {SPORTS.map((sport) => {
            const active = followedSports.has(sport.id);
            return (
              <button
                key={sport.id}
                onClick={() => toggleSport(sport.id)}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all duration-200 hover:-translate-y-0.5",
                  active
                    ? "border-blue-500/40 bg-blue-500/10 glow-blue-sm"
                    : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]"
                )}
              >
                <span className="text-2xl leading-none">{sport.emoji}</span>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-tight",
                    active ? "text-blue-300" : "text-slate-400"
                  )}
                >
                  {sport.label}
                </span>
                {active && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-200">Receive alerts for followed sports only</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Suppress notifications from sports you don&apos;t follow
            </p>
          </div>
          <Toggle checked={alertFollowedOnly} onChange={setAlertFollowedOnly} />
        </div>
      </div>

      {/* ── League Preferences ───────────────────────────────────────────────── */}
      {leaguesBySport.length > 0 && (
        <div className="glass-card p-6 animate-slide-up">
          <SectionHeader
            icon={Trophy}
            title="League Preferences"
            description="Choose specific competitions within your followed sports"
          />

          <div className="space-y-5">
            {leaguesBySport.map(({ sport, leagues }) => (
              <div key={sport.id}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-base leading-none">{sport.emoji}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {sport.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {leagues.map((league) => {
                    const active = followedLeagues.has(league.id);
                    return (
                      <button
                        key={league.id}
                        onClick={() => toggleLeague(league.id)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all duration-150",
                          active
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                            : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-300"
                        )}
                      >
                        <span className="font-medium">{league.label}</span>
                        <div
                          className={cn(
                            "h-4 w-4 shrink-0 rounded border transition-colors",
                            active
                              ? "border-blue-500 bg-blue-500 flex items-center justify-center"
                              : "border-white/[0.2]"
                          )}
                        >
                          {active && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notification Preferences ─────────────────────────────────────────── */}
      <div className="glass-card p-6 animate-slide-up">
        <SectionHeader
          icon={Bell}
          title="Notification Preferences"
          description="Control which alerts and reports you receive"
        />

        <div className="space-y-2.5">
          <NotificationRow
            label="Match start alerts"
            description="Get notified when followed matches kick off"
            checked={notifs.matchStart}
            onChange={setNotif("matchStart")}
          />
          <NotificationRow
            label="Prediction updates"
            description="Receive updates when model predictions change significantly"
            checked={notifs.predUpdates}
            onChange={setNotif("predUpdates")}
          />
          <NotificationRow
            label="Strategy calls"
            description="Alerts when a strategy generates a new betting signal"
            checked={notifs.strategyCalls}
            onChange={setNotif("strategyCalls")}
          />
          <NotificationRow
            label="Weekly report emails"
            description="A summary of model performance every Monday morning"
            checked={notifs.weeklyReport}
            onChange={setNotif("weeklyReport")}
          />
          <NotificationRow
            label="Model performance alerts"
            description="Notify when accuracy drops below your threshold"
            checked={notifs.modelAlerts}
            onChange={setNotif("modelAlerts")}
          />
        </div>
      </div>

      {/* ── Display Preferences ──────────────────────────────────────────────── */}
      <div className="glass-card p-6 animate-slide-up">
        <SectionHeader
          icon={Monitor}
          title="Display Preferences"
          description="Adjust how data and the interface appears to you"
        />

        <div className="space-y-5">
          {/* Odds format */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
              Odds Format
            </label>
            <div className="flex gap-2">
              {(["decimal", "fractional", "american"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOddsFormat(fmt)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-all",
                    oddsFormat === fmt
                      ? "border-blue-500/40 bg-blue-500/15 text-blue-300 glow-blue-sm"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.15] hover:text-slate-300"
                  )}
                >
                  {fmt === "decimal"    && "Decimal (2.10)"}
                  {fmt === "fractional" && "Fractional (11/10)"}
                  {fmt === "american"   && "American (+110)"}
                </button>
              ))}
            </div>
          </div>

          {/* Language + Timezone */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Language */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Language
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 pr-8 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                >
                  {[
                    { code: "EN", label: "English" },
                    { code: "NL", label: "Nederlands" },
                    { code: "DE", label: "Deutsch" },
                    { code: "FR", label: "Français" },
                    { code: "ES", label: "Español" },
                  ].map(({ code, label }) => (
                    <option key={code} value={code}>
                      {code} — {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Timezone
              </label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 pr-8 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Dark/Light mode */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-200">
                {lightMode ? "Light mode" : "Dark mode"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lightMode
                  ? "Switch back to the premium dark interface"
                  : "Dark theme active — easy on the eyes"}
              </p>
            </div>
            <Toggle checked={lightMode} onChange={setLightMode} />
          </div>
        </div>
      </div>

      {/* ── Save button ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-200">
          Discard
        </button>
        <button
          onClick={handleSave}
          className="btn-gradient inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          <Save className="h-4 w-4" />
          Save settings
        </button>
      </div>

      {/* ── Save toast ───────────────────────────────────────────────────────── */}
      <SaveToast visible={showToast} />
    </div>
  );
}
