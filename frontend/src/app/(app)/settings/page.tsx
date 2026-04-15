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
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

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

const SPORTS: Sport[] = [{ id: "football", label: "Football", emoji: "⚽" }];

const LEAGUES: League[] = [
  { id: "pl", label: "Premier League", sportId: "football" },
  { id: "laliga", label: "La Liga", sportId: "football" },
  { id: "bundesliga", label: "Bundesliga", sportId: "football" },
  { id: "seriea", label: "Serie A", sportId: "football" },
  { id: "ligue1", label: "Ligue 1", sportId: "football" },
  { id: "ucl", label: "Champions League", sportId: "football" },
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
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80]/70",
        checked
          ? "bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.55)]"
          : "bg-white/[0.12]"
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
  icon,
  title,
  description,
  variant = "green",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "green" | "purple" | "blue";
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-white/[0.06] pb-4">
      <HexBadge variant={variant} size="md">
        {icon}
      </HexBadge>
      <div>
        <h2 className="text-heading text-base text-[#ededed]">{title}</h2>
        <p className="mt-0.5 text-xs text-[#a3a9b8]">{description}</p>
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
    <div className="glass-panel flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#ededed]">{label}</p>
        <p className="mt-0.5 text-xs text-[#a3a9b8]">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Save toast ───────────────────────────────────────────────────────────────

function SaveToast({ visible }: { visible: boolean }) {
  const { t } = useTranslations();
  return (
    <div
      className={cn(
        "glass-panel-raised fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-[#4ade80] transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <Check className="h-4 w-4" />
      {t("settings.savedSuccessfully")}
    </div>
  );
}

// Input style (glass-panel bg + subtle border + lime focus)
const inputStyle = {
  border: "1px solid hsl(0 0% 100% / 0.1)",
};

const inputClass =
  "glass-panel w-full rounded-lg px-3 py-2.5 text-sm text-[#ededed] outline-none transition-colors focus:border-[#4ade80]/60";

// ─── Settings page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useTranslations();
  const [displayName, setDisplayName] = useState("Dennis van der Berg");
  const [email] = useState("dennis@betsplug.io");
  const [editingProfile, setEditingProfile] = useState(false);

  const [followedSports, setFollowedSports] = useState<Set<string>>(
    new Set(["football"])
  );
  const [alertFollowedOnly, setAlertFollowedOnly] = useState(true);

  const [followedLeagues, setFollowedLeagues] = useState<Set<string>>(
    new Set(["pl", "bundesliga", "ucl"])
  );

  const [notifs, setNotifs] = useState({
    matchStart: true,
    predUpdates: true,
    strategyCalls: true,
    weeklyReport: false,
    modelAlerts: true,
  });

  const [oddsFormat, setOddsFormat] = useState<
    "decimal" | "fractional" | "american"
  >("decimal");
  const [language, setLanguage] = useState("EN");
  const [timezone, setTimezone] = useState("Europe/Amsterdam");
  const [lightMode, setLightMode] = useState(false);

  const [showToast, setShowToast] = useState(false);

  const toggleSport = (id: string) => {
    setFollowedSports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLeague = (id: string) => {
    setFollowedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setNotif = (key: keyof typeof notifs) => (v: boolean) =>
    setNotifs((prev) => ({ ...prev, [key]: v }));

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const visibleSportIds = Array.from(followedSports);
  const leaguesBySport = visibleSportIds
    .map((sid) => ({
      sport: SPORTS.find((s) => s.id === sid)!,
      leagues: LEAGUES.filter((l) => l.sportId === sid),
    }))
    .filter((g) => g.leagues.length > 0);

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-green) / 0.1)",
          filter: "blur(140px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-80 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-purple) / 0.08)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-8">
        {/* Header */}
        <div>
          <span className="section-label mb-3">
            <SettingsIcon className="h-3 w-3" />
            {t("settings.title")}
          </span>
          <h1 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
            {t("settings.title")}
          </h1>
          <p className="mt-2 text-sm text-[#a3a9b8]">{t("settings.subtitle")}</p>
        </div>

        {/* Profile */}
        <div className="card-neon rounded-2xl">
          <div className="relative p-6">
            <SectionHeader
              icon={<User className="h-5 w-5" />}
              title={t("settings.profile")}
              description={t("settings.profileDesc")}
              variant="green"
            />

            <div className="flex items-center gap-5">
              <HexBadge variant="green" size="xl">
                <span className="text-stat text-xl">{initials}</span>
              </HexBadge>

              <div className="min-w-0 flex-1">
                {editingProfile ? (
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={cn(inputClass, "mb-1 !py-1.5 font-semibold")}
                    style={inputStyle}
                  />
                ) : (
                  <p className="text-base font-semibold text-[#ededed]">
                    {displayName}
                  </p>
                )}
                <p className="text-xs text-[#a3a9b8]">{email}</p>
                <div className="mt-1.5">
                  <Pill tone="purple">
                    <Shield className="h-3 w-3" />
                    {t("settings.admin")}
                  </Pill>
                </div>
              </div>

              <button
                onClick={() => setEditingProfile((v) => !v)}
                className="btn-glass !px-3 !py-1.5 !text-xs"
              >
                {editingProfile ? t("settings.done") : t("settings.editProfile")}
              </button>
            </div>
          </div>
        </div>

        {/* Sport Preferences */}
        <div className="card-neon rounded-2xl">
          <div className="relative p-6">
            <SectionHeader
              icon={<Trophy className="h-5 w-5" />}
              title={t("settings.followedLeagues")}
              description={t("settings.followedLeaguesDesc")}
              variant="purple"
            />

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {SPORTS.map((sport) => {
                const active = followedSports.has(sport.id);
                return (
                  <button
                    key={sport.id}
                    onClick={() => toggleSport(sport.id)}
                    className={cn(
                      "glass-panel group flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center transition-all",
                      active && "halo-green"
                    )}
                  >
                    <span className="text-2xl leading-none">{sport.emoji}</span>
                    <span
                      className={cn(
                        "text-[11px] font-medium leading-tight",
                        active ? "text-[#4ade80]" : "text-[#a3a9b8]"
                      )}
                    >
                      {sport.label}
                    </span>
                    {active && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#4ade80]">
                        <Check className="h-2.5 w-2.5 text-black" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="glass-panel mt-5 flex items-center justify-between rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#ededed]">
                  {t("settings.alertsFollowedOnly")}
                </p>
                <p className="mt-0.5 text-xs text-[#a3a9b8]">
                  {t("settings.alertsFollowedOnlyDesc")}
                </p>
              </div>
              <Toggle
                checked={alertFollowedOnly}
                onChange={setAlertFollowedOnly}
              />
            </div>
          </div>
        </div>

        {/* League preferences */}
        {leaguesBySport.length > 0 && (
          <div className="card-neon rounded-2xl">
            <div className="relative p-6">
              <SectionHeader
                icon={<Trophy className="h-5 w-5" />}
                title={t("settings.leaguePreferences")}
                description={t("settings.leaguePreferencesDesc")}
                variant="blue"
              />

              <div className="space-y-5">
                {leaguesBySport.map(({ sport, leagues }) => (
                  <div key={sport.id}>
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="text-base leading-none">
                        {sport.emoji}
                      </span>
                      <Pill tone="default">{sport.label}</Pill>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {leagues.map((league) => {
                        const active = followedLeagues.has(league.id);
                        return (
                          <button
                            key={league.id}
                            onClick={() => toggleLeague(league.id)}
                            className={cn(
                              "glass-panel flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all",
                              active && "halo-green"
                            )}
                          >
                            <span
                              className={cn(
                                "font-medium",
                                active ? "text-[#4ade80]" : "text-[#a3a9b8]"
                              )}
                            >
                              {league.label}
                            </span>
                            <div
                              className={cn(
                                "h-4 w-4 shrink-0 rounded border transition-colors",
                                active
                                  ? "flex items-center justify-center border-[#4ade80] bg-[#4ade80]"
                                  : "border-white/[0.2]"
                              )}
                            >
                              {active && (
                                <Check className="h-2.5 w-2.5 text-black" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="card-neon rounded-2xl">
          <div className="relative p-6">
            <SectionHeader
              icon={<Bell className="h-5 w-5" />}
              title={t("settings.notificationPreferences")}
              description={t("settings.notificationPreferencesDesc")}
              variant="green"
            />

            <div className="space-y-2.5">
              <NotificationRow
                label={t("settings.matchStartAlerts")}
                description={t("settings.matchStartAlertsDesc")}
                checked={notifs.matchStart}
                onChange={setNotif("matchStart")}
              />
              <NotificationRow
                label={t("settings.predictionUpdates")}
                description={t("settings.predictionUpdatesDesc")}
                checked={notifs.predUpdates}
                onChange={setNotif("predUpdates")}
              />
              <NotificationRow
                label={t("settings.strategyCalls")}
                description={t("settings.strategyCallsDesc")}
                checked={notifs.strategyCalls}
                onChange={setNotif("strategyCalls")}
              />
              <NotificationRow
                label={t("settings.weeklyReportEmails")}
                description={t("settings.weeklyReportEmailsDesc")}
                checked={notifs.weeklyReport}
                onChange={setNotif("weeklyReport")}
              />
              <NotificationRow
                label={t("settings.modelPerformanceAlerts")}
                description={t("settings.modelPerformanceAlertsDesc")}
                checked={notifs.modelAlerts}
                onChange={setNotif("modelAlerts")}
              />
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="card-neon rounded-2xl">
          <div className="relative p-6">
            <SectionHeader
              icon={<Monitor className="h-5 w-5" />}
              title={t("settings.displayPreferences")}
              description={t("settings.displayPreferencesDesc")}
              variant="purple"
            />

            <div className="space-y-5">
              {/* Odds format */}
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                  {t("settings.oddsFormat")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["decimal", "fractional", "american"] as const).map(
                    (fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setOddsFormat(fmt)}
                        className="cursor-pointer"
                      >
                        <Pill
                          tone={oddsFormat === fmt ? "active" : "default"}
                        >
                          {fmt === "decimal" && t("settings.oddsDecimal")}
                          {fmt === "fractional" && t("settings.oddsFractional")}
                          {fmt === "american" && t("settings.oddsAmerican")}
                        </Pill>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Language + Timezone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                    {t("settings.language")}
                  </label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={cn(inputClass, "appearance-none pr-8")}
                      style={inputStyle}
                    >
                      {[
                        { code: "EN", label: "English" },
                        { code: "NL", label: "Nederlands" },
                        { code: "DE", label: "Deutsch" },
                        { code: "FR", label: "Français" },
                        { code: "ES", label: "Español" },
                      ].map(({ code, label }) => (
                        <option key={code} value={code}>
                          {code} - {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a3a9b8]" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                    {t("settings.timezone")}
                  </label>
                  <div className="relative">
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className={cn(inputClass, "appearance-none pr-8")}
                      style={inputStyle}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a3a9b8]" />
                  </div>
                </div>
              </div>

              {/* Dark/Light mode */}
              <div className="glass-panel flex items-center justify-between rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#ededed]">
                    {lightMode
                      ? t("settings.lightMode")
                      : t("settings.darkMode")}
                  </p>
                  <p className="mt-0.5 text-xs text-[#a3a9b8]">
                    {lightMode
                      ? t("settings.switchToDark")
                      : t("settings.darkThemeActive")}
                  </p>
                </div>
                <Toggle checked={lightMode} onChange={setLightMode} />
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button className="btn-ghost">{t("settings.discard")}</button>
          <button onClick={handleSave} className="btn-primary">
            <Save className="h-4 w-4" />
            {t("settings.saveSettings")}
          </button>
        </div>

        <SaveToast visible={showToast} />
      </div>
    </div>
  );
}
