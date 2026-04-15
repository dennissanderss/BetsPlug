"use client";

/**
 * My Account page — NOCTURNE rebuild
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
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

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

const ODDS_FORMATS: {
  value: "decimal" | "fractional" | "american";
  label: string;
}[] = [
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

// ─── Input style ────────────────────────────────────────────────────────────

const inputStyle = { border: "1px solid hsl(0 0% 100% / 0.1)" };

const inputClass =
  "glass-panel w-full rounded-lg px-3 py-2.5 text-sm text-[#ededed] outline-none transition-colors focus:border-[#4ade80]/60";

// ─── Shared building blocks ─────────────────────────────────────────────────

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

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="glass-panel flex items-start gap-3 rounded-xl px-4 py-3">
      {icon && <div className="mt-0.5 shrink-0 text-[#a3a9b8]">{icon}</div>}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
          {label}
        </p>
        <div className="mt-1 truncate text-sm font-medium text-[#ededed]">
          {value}
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
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
        {icon}
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "appearance-none pr-8")}
          style={inputStyle}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a3a9b8]" />
      </div>
    </div>
  );
}

// ─── Profile skeleton ───────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-5">
        <Skeleton className="h-20 w-20 rounded-2xl bg-white/[0.04]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40 bg-white/[0.04]" />
          <Skeleton className="h-3 w-56 bg-white/[0.04]" />
          <Skeleton className="h-3 w-24 bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ─── Delete modal ──────────────────────────────────────────────────────────

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
        className="glass-panel-raised w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <HexBadge variant="purple" size="md">
            <AlertTriangle className="h-5 w-5" />
          </HexBadge>
          <div>
            <h3 className="text-heading text-base text-[#ededed]">
              Delete your account?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#a3a9b8]">
              This permanently removes your profile, subscription, favorites and
              all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        {status === "unavailable" && (
          <div className="glass-panel mt-4 rounded-lg px-3 py-2.5 text-xs text-[#a3a9b8]">
            Self-service deletion isn&apos;t available yet. Please contact
            support and we&apos;ll remove your account within 24 hours.
          </div>
        )}
        {status === "error" && (
          <div className="glass-panel mt-4 rounded-lg px-3 py-2.5 text-xs text-[#fca5a5]">
            Something went wrong while deleting your account. Please try again
            or contact support.
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-glass">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={status === "loading"}
            className="btn-ghost disabled:cursor-not-allowed disabled:opacity-60"
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

  const { data, isLoading, error } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    retry: false,
    enabled: Boolean(token),
  });

  const user: Partial<User> = React.useMemo(() => {
    if (data) return data;
    return {
      email: authUser?.email ?? "",
      username: authUser?.name ?? "",
      full_name: authUser?.name ?? null,
      role:
        (authUser as (typeof authUser & { role?: string }) | null)?.role ??
        "user",
      is_active: true,
      email_verified: false,
      created_at: "",
    };
  }, [data, authUser]);

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

  const [editingName, setEditingName] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  React.useEffect(() => {
    if (user?.full_name != null) {
      setFullName(user.full_name ?? "");
    } else if (user?.username) {
      setFullName(user.username);
    }
  }, [user?.full_name, user?.username]);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteStatus, setDeleteStatus] = React.useState<
    "idle" | "loading" | "unavailable" | "error"
  >("idle");

  const handleDelete = async () => {
    setDeleteStatus("loading");
    try {
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

  const initials = React.useMemo(() => {
    const source =
      user?.full_name || user?.username || user?.email || "U";
    const parts = source.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
  }, [user?.full_name, user?.username, user?.email]);

  const memberSince = user?.created_at ? formatDate(user.created_at) : "—";
  const tierLabel = prettyRole(user?.role);

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
            <UserIcon className="h-3 w-3" />
            My account
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <HexBadge variant="green" size="xl">
              <span className="text-stat text-2xl">{initials}</span>
            </HexBadge>
            <div className="min-w-0 flex-1">
              <h1 className="text-heading text-2xl text-[#ededed] sm:text-3xl">
                {user?.full_name || user?.username || "Unnamed user"}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-[#a3a9b8]">
                <Mail className="h-3.5 w-3.5" />
                {user?.email || "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Pill tone="purple">
                  <Shield className="h-3 w-3" />
                  {tierLabel}
                </Pill>
                {user?.email_verified ? (
                  <Pill tone="win">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </Pill>
                ) : (
                  <button
                    onClick={() =>
                      router.push("/login?action=verify-email")
                    }
                    className="cursor-pointer"
                  >
                    <Pill tone="loss">
                      <AlertTriangle className="h-3 w-3" />
                      Not verified — Resend
                    </Pill>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <UserIcon className="h-5 w-5" />,
              title: "Edit profile",
              action: () => setEditingName(true),
              variant: "green" as const,
            },
            {
              icon: <Lock className="h-5 w-5" />,
              title: "Change password",
              action: () => router.push("/forgot-password"),
              variant: "purple" as const,
            },
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: "Preferences",
              action: savePreferences,
              variant: "blue" as const,
            },
            {
              icon: <LogOut className="h-5 w-5" />,
              title: "Log out",
              action: logout,
              variant: "green" as const,
            },
          ].map((a) => (
            <div key={a.title} className="card-neon rounded-2xl">
              <div className="relative flex flex-col gap-3 p-5">
                <HexBadge variant={a.variant} size="md">
                  {a.icon}
                </HexBadge>
                <p className="text-sm font-semibold text-[#ededed]">
                  {a.title}
                </p>
                <button onClick={a.action} className="btn-glass self-start">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile */}
          <div className="card-neon rounded-2xl lg:col-span-2">
            <div className="relative p-6">
              <SectionHeader
                icon={<UserIcon className="h-5 w-5" />}
                title="Profile"
                description="Your personal information and account role"
                variant="green"
              />

              {isLoading && !data ? (
                <ProfileSkeleton />
              ) : (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <HexBadge variant="green" size="xl">
                    <span className="text-stat text-2xl">{initials}</span>
                  </HexBadge>

                  <div className="min-w-0 flex-1 space-y-2">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={cn(
                            inputClass,
                            "!py-1.5 text-base font-semibold"
                          )}
                          style={inputStyle}
                        />
                        <button
                          onClick={() => setEditingName(false)}
                          className="btn-glass !px-3 !py-1.5 !text-xs"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-[#ededed]">
                        {user?.full_name || user?.username || "Unnamed user"}
                      </p>
                    )}

                    <p className="flex items-center gap-1.5 text-xs text-[#a3a9b8]">
                      <Mail className="h-3 w-3" />
                      {user?.email || "—"}
                    </p>
                  </div>

                  <button
                    onClick={() => setEditingName((v) => !v)}
                    className="btn-glass !px-4 !py-2 !text-xs"
                  >
                    {editingName ? "Done" : "Edit profile"}
                  </button>
                </div>
              )}

              {error && !data && (
                <div className="glass-panel mt-4 rounded-lg px-3 py-2 text-xs text-[#a3a9b8]">
                  We couldn&apos;t load your full account record. Showing limited
                  details from your session.
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="card-neon rounded-2xl">
            <div className="relative p-6">
              <SectionHeader
                icon={<BadgeCheck className="h-5 w-5" />}
                title="Account Details"
                description="Read-only information on record"
                variant="purple"
              />

              <div className="space-y-2.5">
                <Field
                  label="Email"
                  value={user?.email || "—"}
                  icon={<Mail className="h-3.5 w-3.5" />}
                />
                <Field
                  label="Username"
                  value={user?.username || "—"}
                  icon={<UserIcon className="h-3.5 w-3.5" />}
                />
                <Field
                  label="Role"
                  value={prettyRole(user?.role)}
                  icon={<Shield className="h-3.5 w-3.5" />}
                />
                <Field
                  label="Member since"
                  value={memberSince}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card-neon rounded-2xl">
            <div className="relative p-6">
              <SectionHeader
                icon={<Sparkles className="h-5 w-5" />}
                title="Preferences"
                description="Pick the language, odds format and timezone you prefer"
                variant="blue"
              />

              <div className="space-y-4">
                <LabelledSelect
                  label="Language"
                  icon={<Globe className="h-3 w-3" />}
                  value={locale}
                  onChange={setLocale}
                  options={LANGUAGES.map((l) => ({
                    value: l.code,
                    label: `${l.code.toUpperCase()} — ${l.label}`,
                  }))}
                />
                <LabelledSelect
                  label="Odds format"
                  icon={<Calculator className="h-3 w-3" />}
                  value={oddsFormat}
                  onChange={setOddsFormat}
                  options={ODDS_FORMATS}
                />

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                    <Clock className="h-3 w-3" />
                    Timezone
                  </label>
                  <div
                    className="glass-panel flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[#ededed]"
                    style={inputStyle}
                  >
                    <span className="truncate">{timezone}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                      Auto
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-[#a3a9b8]">
                    Preferences are saved on this device.
                  </p>
                  <button onClick={savePreferences} className="btn-primary">
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
          </div>

          {/* Security */}
          <div className="card-neon rounded-2xl lg:col-span-2">
            <div className="relative p-6">
              <SectionHeader
                icon={<Lock className="h-5 w-5" />}
                title="Security"
                description="Keep your account safe and manage access"
                variant="green"
              />

              <div className="glass-panel flex flex-col justify-between gap-4 rounded-xl px-4 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#ededed]">
                    Change password
                  </p>
                  <p className="mt-0.5 text-xs text-[#a3a9b8]">
                    We&apos;ll email you a secure link to set a new password.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/forgot-password")}
                  className="btn-glass"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Send password reset email
                </button>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="card-neon rounded-2xl lg:col-span-2">
            <div className="relative p-6">
              <SectionHeader
                icon={<AlertTriangle className="h-5 w-5" />}
                title="Danger zone"
                description="Actions here are permanent and cannot be undone"
                variant="purple"
              />

              <div className="glass-panel flex flex-col justify-between gap-4 rounded-xl px-4 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#ededed]">
                    Delete my account
                  </p>
                  <p className="mt-0.5 text-xs text-[#a3a9b8]">
                    Removes your profile, subscription and all associated data.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeleteStatus("idle");
                    setDeleteOpen(true);
                  }}
                  className="btn-ghost"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete account
                </button>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-end">
              <button onClick={logout} className="btn-glass">
                <LogOut className="h-4 w-4" />
                Log out of BetsPlug
              </button>
            </div>
          </div>
        </div>

        <DeleteAccountModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          status={deleteStatus}
        />

        <div
          className={cn(
            "glass-panel-raised fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-[#4ade80] transition-all duration-300",
            prefsSaved
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <Check className="h-4 w-4" />
          Preferences saved
        </div>
      </div>
    </div>
  );
}
