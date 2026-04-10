"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  ShieldCheck,
  ShieldOff,
  Clock,
  Search,
  Trash2,
  CreditCard,
  Crown,
  AlertTriangle,
  X,
} from "lucide-react";
import type { AdminUser } from "@/types/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type PlanFilter = "all" | "free" | "basic" | "standard" | "premium" | "lifetime";

function planKey(user: AdminUser): PlanFilter {
  const plan = user.subscription?.plan?.toLowerCase();
  if (!plan) return "free";
  if (plan === "basic") return "basic";
  if (plan === "standard") return "standard";
  if (plan === "premium") return "premium";
  if (plan === "lifetime") return "lifetime";
  return "free";
}

function planLabel(key: PlanFilter): string {
  switch (key) {
    case "all":      return "All";
    case "free":     return "Free";
    case "basic":    return "Bronze";
    case "standard": return "Silver";
    case "premium":  return "Gold";
    case "lifetime": return "Platinum";
  }
}

function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return "\u2014";
  const cur = (currency || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(2)}`;
  }
}

function formatExpiry(sub: AdminUser["subscription"]): string {
  if (!sub) return "\u2014";
  if (sub.is_lifetime) return "Lifetime";
  if (!sub.current_period_end) return "\u2014";
  return new Date(sub.current_period_end).toLocaleDateString();
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const colorMap: Record<string, string> = {
    active: "bg-green-500/15 text-green-400",
    suspended: "bg-red-500/15 text-red-400",
    inactive: "bg-red-500/15 text-red-400",
  };
  const cls = colorMap[s] ?? "bg-slate-500/15 text-slate-400";
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colorMap: Record<string, string> = {
    admin: "bg-blue-500/15 text-blue-400",
    analyst: "bg-purple-500/15 text-purple-400",
    moderator: "bg-purple-500/15 text-purple-400",
    viewer: "bg-slate-500/15 text-slate-400",
    user: "bg-slate-500/15 text-slate-400",
  };
  const cls = colorMap[role.toLowerCase()] ?? "bg-slate-500/15 text-slate-400";
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>
      {role}
    </span>
  );
}

function PlanBadge({ user }: { user: AdminUser }) {
  const key = planKey(user);
  const label = planLabel(key);
  const colorMap: Record<PlanFilter, string> = {
    all:      "bg-slate-500/15 text-slate-400",
    free:     "bg-slate-500/15 text-slate-400",
    basic:    "bg-amber-700/20 text-amber-300",
    standard: "bg-slate-400/15 text-slate-200",
    premium:  "bg-amber-500/15 text-amber-400",
    lifetime: "bg-purple-500/15 text-purple-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", colorMap[key])}>
      {key === "lifetime" && <Crown className="h-3 w-3" />}
      {label}
    </span>
  );
}

function SubscriptionStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-slate-600">\u2014</span>;
  const colorMap: Record<string, string> = {
    active: "bg-green-500/15 text-green-400",
    trialing: "bg-blue-500/15 text-blue-400",
    cancelled: "bg-amber-500/15 text-amber-400",
    expired: "bg-red-500/15 text-red-400",
    past_due: "bg-red-500/15 text-red-400",
  };
  const labelMap: Record<string, string> = {
    active: "Active",
    trialing: "Trialing",
    cancelled: "Cancelled",
    expired: "Expired",
    past_due: "Past Due",
  };
  const cls = colorMap[status.toLowerCase()] ?? "bg-slate-500/15 text-slate-400";
  const label = labelMap[status.toLowerCase()] ?? status;
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", cls)}>
      {label}
    </span>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  active,
  onClick,
  accent,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card rounded-xl px-4 py-3 text-left transition-all hover:bg-white/[0.04]",
        active && "ring-1 ring-blue-500/60 bg-blue-500/[0.04]"
      )}
    >
      <p className={cn("text-[11px] font-semibold uppercase tracking-wide", accent)}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-100">{value}</p>
    </button>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  user,
  onCancel,
  onConfirm,
  isPending,
  errorMsg,
}: {
  user: AdminUser;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  errorMsg: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md rounded-xl border border-red-500/30 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-100">Delete user permanently?</h3>
            <p className="mt-1 text-sm text-slate-400">
              This will permanently delete{" "}
              <span className="font-semibold text-slate-200">{user.email}</span> along with all their
              subscriptions and payment records. This action cannot be undone.
            </p>
            {user.payment && user.payment.payments_count > 0 && (
              <p className="mt-2 text-xs text-amber-400">
                <CreditCard className="mr-1 inline h-3 w-3" />
                {user.payment.payments_count} payment record(s) will be removed.
              </p>
            )}
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 transition-colors disabled:opacity-60"
          >
            {isPending && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            <Trash2 className="h-3.5 w-3.5" />
            Delete forever
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Manager ────────────────────────────────────────────────────────────

export default function UserManager() {
  const queryClient = useQueryClient();
  const [confirmStatus, setConfirmStatus] = useState<{ userId: string; newStatus: boolean } | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  const { data: users, isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.getAdminUsers(200, 0),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.updateAdminUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmStatus(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteTarget(null);
    },
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const list = users ?? [];
    const counts: Record<PlanFilter, number> = {
      all: list.length,
      free: 0,
      basic: 0,
      standard: 0,
      premium: 0,
      lifetime: 0,
    };
    let revenue = 0;
    for (const u of list) {
      counts[planKey(u)] += 1;
      if (u.payment) revenue += u.payment.total_paid || 0;
    }
    return { counts, revenue };
  }, [users]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = users ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      if (planFilter !== "all" && planKey(u) !== planFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "suspended" && u.is_active) return false;
      if (q) {
        const hay = [u.email, u.username, u.full_name ?? ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, planFilter, statusFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total"
          value={stats.counts.all}
          active={planFilter === "all"}
          onClick={() => setPlanFilter("all")}
          accent="text-slate-400"
        />
        <StatCard
          label="Free"
          value={stats.counts.free}
          active={planFilter === "free"}
          onClick={() => setPlanFilter("free")}
          accent="text-slate-400"
        />
        <StatCard
          label="Bronze"
          value={stats.counts.basic}
          active={planFilter === "basic"}
          onClick={() => setPlanFilter("basic")}
          accent="text-amber-300"
        />
        <StatCard
          label="Silver"
          value={stats.counts.standard}
          active={planFilter === "standard"}
          onClick={() => setPlanFilter("standard")}
          accent="text-slate-200"
        />
        <StatCard
          label="Gold"
          value={stats.counts.premium}
          active={planFilter === "premium"}
          onClick={() => setPlanFilter("premium")}
          accent="text-amber-400"
        />
        <StatCard
          label="Platinum"
          value={stats.counts.lifetime}
          active={planFilter === "lifetime"}
          onClick={() => setPlanFilter("lifetime")}
          accent="text-purple-400"
        />
      </div>

      {/* Revenue strip */}
      <div className="glass-card rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <CreditCard className="h-4 w-4 text-emerald-400" />
          <span className="text-slate-400">Lifetime revenue across all users:</span>
          <span className="font-semibold tabular-nums text-emerald-400">
            {formatMoney(stats.revenue, "EUR")}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {users?.length ?? 0} users
        </p>
      </div>

      {/* Toolbar */}
      <div className="glass-card rounded-xl p-4 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, username or name..."
            className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
          {(["all", "active", "suspended"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                statusFilter === k
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">User Management</h3>
            <p className="text-xs text-slate-500">
              View, manage, and delete user accounts. Click a stat above to filter.
            </p>
          </div>
          {!isLoading && users && (
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium tabular-nums text-slate-300">
              {users.length} total
            </span>
          )}
        </div>

        {/* Status confirmation bar */}
        {confirmStatus && (
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-amber-500/5 px-6 py-3">
            <p className="text-xs text-amber-400">
              Are you sure you want to {confirmStatus.newStatus ? "activate" : "suspend"} this user?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  statusMutation.mutate({
                    userId: confirmStatus.userId,
                    isActive: confirmStatus.newStatus,
                  })
                }
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold btn-gradient shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {statusMutation.isPending && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Confirm
              </button>
              <button
                onClick={() => setConfirmStatus(null)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[
                  "User",
                  "Role",
                  "Plan",
                  "Sub Status",
                  "Last Payment",
                  "Total Paid",
                  "Expires",
                  "Status",
                  "Joined",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500",
                      h === "Actions" || h === "Total Paid" ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <Skeleton className="h-4 w-full bg-white/[0.04]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-red-400">
                    {error instanceof Error ? error.message : "Failed to load users."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
                        <Users className="h-6 w-6 text-slate-500" />
                      </div>
                      <p className="text-sm text-slate-400">
                        {users && users.length > 0
                          ? "No users match the current filters."
                          : "No users found."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    {/* User */}
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-100">{user.email}</p>
                      <p className="text-xs text-slate-500">
                        {user.username}
                        {user.full_name ? ` · ${user.full_name}` : ""}
                      </p>
                    </td>
                    {/* Role */}
                    <td className="px-5 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    {/* Plan */}
                    <td className="px-5 py-3">
                      <PlanBadge user={user} />
                    </td>
                    {/* Sub Status */}
                    <td className="px-5 py-3">
                      <SubscriptionStatusBadge status={user.subscription?.status ?? null} />
                      {user.subscription?.cancel_at_period_end && (
                        <p className="mt-0.5 text-[10px] text-amber-400">cancels at period end</p>
                      )}
                    </td>
                    {/* Last Payment */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {user.payment && user.payment.last_amount != null ? (
                        <div>
                          <p className="text-sm font-medium tabular-nums text-slate-200">
                            {formatMoney(user.payment.last_amount, user.payment.currency)}
                          </p>
                          {user.payment.last_payment_at && (
                            <p className="text-[11px] text-slate-500">
                              {new Date(user.payment.last_payment_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">\u2014</span>
                      )}
                    </td>
                    {/* Total Paid */}
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      {user.payment && user.payment.total_paid > 0 ? (
                        <div>
                          <p className="text-sm font-semibold tabular-nums text-emerald-400">
                            {formatMoney(user.payment.total_paid, user.payment.currency)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {user.payment.payments_count} payment
                            {user.payment.payments_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">\u2014</span>
                      )}
                    </td>
                    {/* Expires */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {user.subscription?.is_lifetime ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-500/15 text-purple-400">
                          <Crown className="h-3 w-3" />
                          Lifetime
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{formatExpiry(user.subscription)}</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3">
                      <StatusPill status={user.is_active ? "active" : "suspended"} />
                    </td>
                    {/* Joined */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {formatDateTime(String(user.created_at))}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setConfirmStatus({
                              userId: user.id,
                              newStatus: !user.is_active,
                            })
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                            user.is_active
                              ? "text-red-400 hover:bg-red-500/10"
                              : "text-green-400 hover:bg-green-500/10"
                          )}
                          title={user.is_active ? "Suspend user" : "Activate user"}
                        >
                          {user.is_active ? (
                            <>
                              <ShieldOff className="h-3.5 w-3.5" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete user permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Status mutation error */}
        {statusMutation.isError && (
          <div className="border-t border-white/[0.06] px-6 py-3">
            <p className="text-xs text-red-400">
              {statusMutation.error instanceof Error
                ? statusMutation.error.message
                : "Failed to update user status."}
            </p>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onCancel={() => {
            if (!deleteMutation.isPending) {
              setDeleteTarget(null);
              deleteMutation.reset();
            }
          }}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          isPending={deleteMutation.isPending}
          errorMsg={
            deleteMutation.isError
              ? deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete user."
              : null
          }
        />
      )}
    </div>
  );
}
