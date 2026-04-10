"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShieldCheck, ShieldOff, Clock } from "lucide-react";
import type { AdminUser } from "@/types/api";

// ─── Status pill (matches admin page pattern) ────────────────────────────────

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
    moderator: "bg-purple-500/15 text-purple-400",
    user: "bg-slate-500/15 text-slate-400",
  };
  const cls = colorMap[role.toLowerCase()] ?? "bg-slate-500/15 text-slate-400";

  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>
      {role}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string | null }) {
  if (!plan) {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-400">
        Free
      </span>
    );
  }
  const colorMap: Record<string, string> = {
    basic: "bg-slate-500/15 text-slate-400",
    standard: "bg-slate-500/15 text-slate-400",
    premium: "bg-amber-500/15 text-amber-400",
    lifetime: "bg-purple-500/15 text-purple-400",
  };
  const cls = colorMap[plan.toLowerCase()] ?? "bg-slate-500/15 text-slate-400";

  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>
      {plan}
    </span>
  );
}

function SubscriptionStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-slate-600">--</span>;
  const colorMap: Record<string, string> = {
    active: "bg-green-500/15 text-green-400",
    trialing: "bg-green-500/15 text-green-400",
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

function formatExpiry(sub: AdminUser["subscription"]): string {
  if (!sub) return "\u2014";
  if (sub.is_lifetime) return "Lifetime";
  if (!sub.current_period_end) return "\u2014";
  return new Date(sub.current_period_end).toLocaleDateString();
}

// ─── User Manager ────────────────────────────────────────────────────────────

export default function UserManager() {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{ userId: string; newStatus: boolean } | null>(null);

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.getAdminUsers(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.updateAdminUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmAction(null);
    },
  });

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">User Management</h3>
          <p className="text-xs text-slate-500">View and manage user accounts</p>
        </div>
        {!isLoading && users && (
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium tabular-nums text-slate-300">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Confirmation bar */}
      {confirmAction && (
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-amber-500/5 px-6 py-3">
          <p className="text-xs text-amber-400">
            Are you sure you want to {confirmAction.newStatus ? "activate" : "suspend"} this user?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                statusMutation.mutate({
                  userId: confirmAction.userId,
                  isActive: confirmAction.newStatus,
                })
              }
              disabled={statusMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold btn-gradient shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {statusMutation.isPending ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              Confirm
            </button>
            <button
              onClick={() => setConfirmAction(null)}
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
              {["Email", "Username", "Role", "Plan", "Sub Status", "Expires", "Status", "Joined", "Actions"].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500",
                    h === "Actions" ? "text-right" : "text-left"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <Skeleton className="h-4 w-full bg-white/[0.04]" />
                      </td>
                    ))}
                  </tr>
                ))
              : (users ?? []).length === 0
              ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
                          <Users className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-400">No users found.</p>
                      </div>
                    </td>
                  </tr>
                )
              : (users ?? []).map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-100">{user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-300">{user.username}</p>
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-3">
                      <PlanBadge plan={user.subscription?.plan ?? null} />
                    </td>
                    <td className="px-5 py-3">
                      <SubscriptionStatusBadge status={user.subscription?.status ?? null} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {user.subscription?.is_lifetime ? (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-500/15 text-purple-400">
                          Lifetime
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {formatExpiry(user.subscription)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={user.is_active ? "active" : "suspended"} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {formatDateTime(String(user.created_at))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() =>
                          setConfirmAction({
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
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mutation error */}
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
  );
}
