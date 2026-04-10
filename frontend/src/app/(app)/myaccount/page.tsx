"use client";

/**
 * My Account page
 * ───────────────
 * Mirrors nerdytips.com's account hub while staying inside BetsPlug's dark
 * glass theme. Sections: Profile, Account Details, Preferences, Security,
 * Danger Zone, Logout.
 *
 * The heavy lifting (who am I?) comes from `api.getMe()` — a method provided
 * by the Auth Core agent running in parallel on `@/lib/api` and
 * `@/types/api`. Until that method lands, we fall back to the
 * `useAuth()` context so the page still renders something useful in dev.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  User as UserIcon,
  Shield,
  Globe,
  Calculator,
  Clock,
  Lock,
  Mail,
  BadgeCheck,
  AlertTriangle,
  Trash2,
  LogOut,
  Save,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/api";

// ─── Static lists ───────────────────────────────────────────────────────────

const LANGUAGES: { code: string; label: string }[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "sw", label: "Kiswahili" },
];

const ODDS_FORMATS: { value: "decimal" | "fractional" | "american"; label: string }[] = [
  { value: "decimal", label: "Decimal (2.10)" },
  { value: "fractional", label: "Fractional (11/10)" },
  { value: "american", label: "American (+110)" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function prettyRole(role?: string | null): string {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// ─── Small shared building blocks ───────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
  tone = "blue",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  tone?: "blue" | "red";
}) {
  const toneClass =
    tone === "red"
      ? "bg-red-500/10 text-red-400"
      : "bg-blue-500/10 text-blue-400";
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-white/[0.06] pb-4">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          toneClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <div className="mt-1 truncate text-sm font-medium text-slate-200">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function LabelledSelect({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ElementType;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 pr-8 text-sm text-slate-200 outline-none transition-colors focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

// ─── Profile skeleton ───────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-2xl bg-white/[0.04]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40 bg-white/[0.04]" />
          <Skeleton className="h-3 w-56 bg-white/[0.04]" />
          <Skeleton className="h-3 w-24 bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ─── Delete account modal ──────────────────────────────────────────────────

function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  status,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  status: "idle" | "loading" | "unavailable" | "error";
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-red-500/30 p-6 shadow-2xl"
        style={{
          background: "rgba(17, 24, 39, 0.98)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(239,68,68,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Delete your account?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              This permanently removes your profile, subscription, favorites
              and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        {status === "unavailable" && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-300">
            Self-service deletion isn&apos;t available yet. Please contact
            support and we&apos;ll remove your account within 24 hours.
          </div>
        )}
        {status === "error" && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-300">
            Something went wrong while deleting your account. Please try again
            or contact support.
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={status === "loading"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {status === "loading" ? "Deleting..." : "Delete forever"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function MyAccountPage() {
  const router = useRouter();
  const { user: authUser, logout, token } = useAuth();

  // Fetch the rich user record from the API. If there's no token in
  // localStorage there's no point firing the call — we fall back to the
  // auth context below.
  const { data, isLoading, error } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    retry: false,
    enabled: Boolean(token),
  });

  // Graceful fallback — merge in whatever we have from auth context if the
  // full record isn't available.
  const user: Partial<User> = React.useMemo(() => {
    if (data) return data;
    return {
      email: authUser?.email ?? "",
      username: authUser?.name ?? "",
      full_name: authUser?.name ?? null,
      role: (authUser as (typeof authUser & { role?: string }) | null)?.role ?? "user",
      is_active: true,
      email_verified: false,
      created_at: "",
    };
  }, [data, authUser]);

  // ── Preferences (persisted to localStorage) ──────────────────────────────

  const [locale, setLocale] = React.useState<string>("nl");
  const [oddsFormat, setOddsFormat] = React.useState<string>("decimal");
  const [timezone, setTimezone] = React.useState<string>("UTC");
  const [prefsSaved, setPrefsSaved] = React.useState(false);

  React.useEffect(() => {
    try {
      setLocale(window.localStorage.getItem("betsplug_locale") ?? "nl");
      setOddsFormat(
        window.localStorage.getItem("betsplug_odds_format") ?? "decimal"
      );
      setTimezone(detectTimezone());
    } catch {
      // ignore
    }
  }, []);

  const savePreferences = React.useCallback(() => {
    try {
      window.localStorage.setItem("betsplug_locale", locale);
      window.localStorage.setItem("betsplug_odds_format", oddsFormat);
      setPrefsSaved(true);
      window.setTimeout(() => setPrefsSaved(false), 2200);
    } catch {
      // ignore
    }
  }, [locale, oddsFormat]);

  // ── Profile editing ──────────────────────────────────────────────────────

  const [editingName, setEditingName] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  React.useEffect(() => {
    if (user?.full_name != null) {
      setFullName(user.full_name ?? "");
    } else if (user?.username) {
      setFullName(user.username);
    }
  }, [user?.full_name, user?.username]);

  // ── Delete account flow ──────────────────────────────────────────────────

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteStatus, setDeleteStatus] = React.useState<
    "idle" | "loading" | "unavailable" | "error"
  >("idle");

  const handleDelete = async () => {
    setDeleteStatus("loading");
    try {
      // The backend may not yet expose this endpoint. Try it, and surface a
      // friendly fallback message if it 404s.
      const base =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${base}/auth/me/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 404 || res.status === 405) {
        setDeleteStatus("unavailable");
        return;
      }
      if (!res.ok) {
        setDeleteStatus("error");
        return;
      }
      logout();
    } catch {
      setDeleteStatus("unavailable");
    }
  };

  // ── Initials for the avatar ──────────────────────────────────────────────

  const initials = React.useMemo(() => {
    const source = user?.full_name || user?.username || user?.email || "U";
    const parts = source.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
  }, [user?.full_name, user?.username, user?.email]);

  const memberSince = user?.created_at ? formatDate(user.created_at) : "—";

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in pb-16">
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">
          My <span className="gradient-text">Account</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Manage your profile, preferences and security settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Profile card (spans two columns) ───────────────────────────── */}
        <div className="glass-card p-6 animate-slide-up lg:col-span-2">
          <SectionHeader
            icon={UserIcon}
            title="Profile"
            description="Your personal information and account role"
          />

          {isLoading && !data ? (
            <ProfileSkeleton />
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/30 to-cyan-500/15 text-2xl font-bold text-blue-200 glow-blue-sm">
                {initials}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-base font-semibold text-slate-100 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                    />
                    <button
                      onClick={() => setEditingName(false)}
                      className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-slate-100"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-slate-100">
                    {user?.full_name || user?.username || "Unnamed user"}
                  </p>
                )}

                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3 w-3" />
                  {user?.email || "—"}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
                    <Shield className="h-3 w-3" />
                    {prettyRole(user?.role)}
                  </span>
                  {user?.email_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        router.push("/login?action=verify-email")
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-amber-500/15"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Not verified — Resend
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setEditingName((v) => !v)}
                className="shrink-0 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
              >
                {editingName ? "Done" : "Edit profile"}
              </button>
            </div>
          )}

          {error && !data && (
            <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
              We couldn&apos;t load your full account record. Showing limited
              details from your session.
            </p>
          )}
        </div>

        {/* ── Account details ────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-slide-up">
          <SectionHeader
            icon={BadgeCheck}
            title="Account Details"
            description="Read-only information on record"
          />

          <div className="space-y-2.5">
            <Field label="Email" value={user?.email || "—"} icon={Mail} />
            <Field
              label="Username"
              value={user?.username || "—"}
              icon={UserIcon}
            />
            <Field
              label="Role"
              value={prettyRole(user?.role)}
              icon={Shield}
            />
            <Field
              label="Member since"
              value={memberSince}
              icon={Clock}
            />
          </div>
        </div>

        {/* ── Preferences ────────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-slide-up">
          <SectionHeader
            icon={Sparkles}
            title="Preferences"
            description="Pick the language, odds format and timezone you prefer"
          />

          <div className="space-y-4">
            <LabelledSelect
              label="Language"
              icon={Globe}
              value={locale}
              onChange={setLocale}
              options={LANGUAGES.map((l) => ({
                value: l.code,
                label: `${l.code.toUpperCase()} — ${l.label}`,
              }))}
            />
            <LabelledSelect
              label="Odds format"
              icon={Calculator}
              value={oddsFormat}
              onChange={setOddsFormat}
              options={ODDS_FORMATS}
            />

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <Clock className="h-3 w-3" />
                Timezone
              </label>
              <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-300">
                <span className="truncate">{timezone}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Auto
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-500">
                Preferences are saved on this device.
              </p>
              <button
                onClick={savePreferences}
                className="btn-gradient inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg"
              >
                {prefsSaved ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Security ────────────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-slide-up lg:col-span-2">
          <SectionHeader
            icon={Lock}
            title="Security"
            description="Keep your account safe and manage access"
          />

          <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200">
                Change password
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                We&apos;ll email you a secure link to set a new password.
              </p>
            </div>
            <button
              onClick={() => router.push("/forgot-password")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/15"
            >
              <Mail className="h-3.5 w-3.5" />
              Send password reset email
            </button>
          </div>
        </div>

        {/* ── Danger zone ─────────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-slide-up lg:col-span-2 border-red-500/20">
          <SectionHeader
            icon={AlertTriangle}
            title="Danger zone"
            description="Actions here are permanent and cannot be undone"
            tone="red"
          />

          <div className="flex flex-col justify-between gap-4 rounded-xl border border-red-500/15 bg-red-500/[0.03] px-4 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-200">
                Delete my account
              </p>
              <p className="mt-0.5 text-xs text-red-300/70">
                Removes your profile, subscription and all associated data.
              </p>
            </div>
            <button
              onClick={() => {
                setDeleteStatus("idle");
                setDeleteOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete account
            </button>
          </div>
        </div>

        {/* ── Logout ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-end">
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-red-500/30 hover:bg-red-500/[0.08] hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Log out of BetsPlug
            </button>
          </div>
        </div>
      </div>

      {/* Delete account modal */}
      <DeleteAccountModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        status={deleteStatus}
      />

      {/* Save toast for preferences */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 shadow-xl backdrop-blur-sm transition-all duration-300",
          prefsSaved
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <Check className="h-4 w-4" />
        Preferences saved
      </div>

    </div>
  );
}
