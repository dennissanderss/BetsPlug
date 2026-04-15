"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  AlertTriangle,
  Receipt,
  RefreshCw,
  Calendar,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminExpense, FinanceOverview, FinancePoint } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Granularity = "day" | "week" | "month";

interface RangeOption {
  id: string;
  label: string;
  months: number;
  granularity: Granularity;
}

const RANGE_OPTIONS: RangeOption[] = [
  { id: "30d", label: "Last 30 days", months: 1, granularity: "day" },
  { id: "6m", label: "Last 6 months", months: 6, granularity: "week" },
  { id: "12m", label: "Last 12 months", months: 12, granularity: "month" },
];

const EXPENSE_CATEGORIES = [
  "hosting",
  "tools",
  "marketing",
  "salaries",
  "taxes",
  "other",
] as const;

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

interface ExpenseFormState {
  amount: string;
  currency: string;
  description: string;
  category: ExpenseCategory;
  expense_date: string;
  notes: string;
}

const EMPTY_EXPENSE_FORM: ExpenseFormState = {
  amount: "",
  currency: "EUR",
  description: "",
  category: "hosting",
  expense_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = "EUR"): string {
  try {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-EU").format(value);
}

function formatPeriodLabel(period: string, granularity: Granularity): string {
  try {
    const d = new Date(period);
    if (Number.isNaN(d.getTime())) return period;
    if (granularity === "day") {
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    }
    if (granularity === "week") {
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    }
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  } catch {
    return period;
  }
}

function toTitle(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function planColor(plan: string): string {
  const key = plan.toLowerCase();
  const map: Record<string, string> = {
    free: "bg-slate-500",
    basic: "bg-amber-700",
    bronze: "bg-amber-700",
    standard: "bg-slate-400",
    silver: "bg-slate-400",
    premium: "bg-amber-500",
    gold: "bg-amber-500",
    lifetime: "bg-purple-500",
    platinum: "bg-purple-500",
  };
  return map[key] ?? "bg-blue-500";
}

function planLabel(plan: string): string {
  const key = plan.toLowerCase();
  const map: Record<string, string> = {
    basic: "Bronze",
    standard: "Silver",
    premium: "Gold",
    lifetime: "Platinum",
  };
  return map[key] ?? toTitle(plan);
}

function categoryColor(category: string): string {
  const key = category.toLowerCase();
  const map: Record<string, string> = {
    hosting: "bg-blue-500",
    tools: "bg-cyan-500",
    marketing: "bg-pink-500",
    salaries: "bg-emerald-500",
    taxes: "bg-amber-500",
    other: "bg-slate-500",
  };
  return map[key] ?? "bg-slate-500";
}

function categoryTextColor(category: string): string {
  const key = category.toLowerCase();
  const map: Record<string, string> = {
    hosting: "text-blue-400",
    tools: "text-cyan-400",
    marketing: "text-pink-400",
    salaries: "text-emerald-400",
    taxes: "text-amber-400",
    other: "text-slate-400",
  };
  return map[key] ?? "text-slate-400";
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: "emerald" | "rose" | "blue" | "purple" | "red";
  delta?: number | null;
  deltaLabel?: string;
  subText?: string;
}

function KpiCard({ label, value, icon: Icon, accent, delta, deltaLabel, subText }: KpiCardProps) {
  const accentMap: Record<KpiCardProps["accent"], { bg: string; fg: string; ring: string }> = {
    emerald: { bg: "bg-emerald-500/10", fg: "text-emerald-400", ring: "ring-emerald-500/20" },
    rose:    { bg: "bg-rose-500/10",    fg: "text-rose-400",    ring: "ring-rose-500/20" },
    blue:    { bg: "bg-blue-500/10",    fg: "text-blue-400",    ring: "ring-blue-500/20" },
    purple:  { bg: "bg-purple-500/10",  fg: "text-purple-400",  ring: "ring-purple-500/20" },
    red:     { bg: "bg-red-500/10",     fg: "text-red-400",     ring: "ring-red-500/20" },
  };
  const a = accentMap[accent];

  const deltaIsPositive = delta != null && delta > 0;
  const deltaIsNegative = delta != null && delta < 0;

  return (
    <div className="card-neon relative overflow-hidden rounded-xl border border-white/[0.06] p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", a.fg)}>
            {value}
          </p>
          {delta != null && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  deltaIsPositive && "bg-emerald-500/15 text-emerald-400",
                  deltaIsNegative && "bg-rose-500/15 text-rose-400",
                  !deltaIsPositive && !deltaIsNegative && "bg-slate-500/15 text-slate-400"
                )}
              >
                {deltaIsPositive ? (
                  <ArrowUpRight className="h-2.5 w-2.5" />
                ) : deltaIsNegative ? (
                  <ArrowDownRight className="h-2.5 w-2.5" />
                ) : null}
                {deltaIsPositive ? "+" : ""}
                {delta.toFixed(1)}%
              </span>
              {deltaLabel && (
                <span className="text-[10px] text-slate-500">{deltaLabel}</span>
              )}
            </div>
          )}
          {subText && (
            <p className="mt-2 text-[11px] text-slate-500">{subText}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
            a.bg,
            a.ring
          )}
        >
          <Icon className={cn("h-5 w-5", a.fg)} />
        </div>
      </div>
    </div>
  );
}

// ─── Timeline chart ───────────────────────────────────────────────────────────

interface TimelineChartProps {
  data: FinancePoint[];
  granularity: Granularity;
  currency: string;
}

interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: FinancePoint;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadEntry[];
  granularity: Granularity;
  currency: string;
}

function CustomTooltip({ active, label, payload, granularity, currency }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as FinancePoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1220]/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-sm">
      <p className="mb-1.5 font-semibold text-slate-200">
        {formatPeriodLabel(label ?? point.period, granularity)}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Revenue
          </span>
          <span className="font-semibold tabular-nums text-emerald-400">
            {formatCurrency(point.revenue, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Expenses
          </span>
          <span className="font-semibold tabular-nums text-rose-400">
            {formatCurrency(point.expenses, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-1">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            Profit
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              point.profit >= 0 ? "text-blue-400" : "text-rose-400"
            )}
          >
            {formatCurrency(point.profit, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-500">
          <span>Payments</span>
          <span className="tabular-nums">{formatCount(point.payments_count)}</span>
        </div>
      </div>
    </div>
  );
}

function TimelineChart({ data, granularity, currency }: TimelineChartProps) {
  const chartData = React.useMemo(
    () =>
      data.map((p) => ({
        ...p,
        label: formatPeriodLabel(p.period, granularity),
      })),
    [data, granularity]
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.08] text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
          <TrendingUp className="h-5 w-5 text-slate-500" />
        </div>
        <p className="text-sm text-slate-400">No revenue data yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Revenue and expenses will appear here once payments come in.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 12, right: 16, bottom: 8, left: -8 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.06} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={{ stroke: "#ffffff", strokeOpacity: 0.08 }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={{ stroke: "#ffffff", strokeOpacity: 0.08 }}
          tickLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()
          }
          width={50}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          content={<CustomTooltip granularity={granularity} currency={currency} />}
        />
        <Bar
          dataKey="revenue"
          name="Revenue"
          fill="url(#revenueGradient)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="expenses"
          name="Expenses"
          fill="url(#expensesGradient)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="#60a5fa"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#60a5fa", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#60a5fa", strokeWidth: 2, stroke: "#0b1220" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── Breakdown list ───────────────────────────────────────────────────────────

interface BreakdownEntry {
  key: string;
  label: string;
  amount: number;
  color: string;
  textColor?: string;
}

interface BreakdownListProps {
  entries: BreakdownEntry[];
  currency: string;
  emptyIcon: React.ElementType;
  emptyText: string;
}

function BreakdownList({ entries, currency, emptyIcon: EmptyIcon, emptyText }: BreakdownListProps) {
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  if (entries.length === 0 || total <= 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.08] text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.04]">
          <EmptyIcon className="h-5 w-5 text-slate-500" />
        </div>
        <p className="text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-3">
      {sorted.map((e) => {
        const pct = total > 0 ? (e.amount / total) * 100 : 0;
        return (
          <div key={e.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", e.color)} />
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    e.textColor ?? "text-slate-200"
                  )}
                >
                  {e.label}
                </span>
              </div>
              <div className="flex shrink-0 items-baseline gap-2">
                <span className="text-sm font-semibold tabular-nums text-slate-100">
                  {formatCurrency(e.amount, currency)}
                </span>
                <span className="text-[11px] tabular-nums text-slate-500">
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={cn("h-full rounded-full transition-all", e.color)}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Expense form (inline) ────────────────────────────────────────────────────

interface ExpenseFormProps {
  initial?: ExpenseFormState;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (data: ExpenseFormState) => void;
  isPending: boolean;
  errorMsg: string | null;
}

const darkInputCls =
  "h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors";

const darkSelectCls =
  "h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors";

function ExpenseForm({
  initial,
  submitLabel,
  onCancel,
  onSubmit,
  isPending,
  errorMsg,
}: ExpenseFormProps) {
  const [form, setForm] = React.useState<ExpenseFormState>(initial ?? EMPTY_EXPENSE_FORM);

  const canSubmit =
    form.amount.trim() !== "" &&
    !Number.isNaN(Number(form.amount)) &&
    Number(form.amount) > 0 &&
    form.description.trim() !== "" &&
    form.expense_date.trim() !== "";

  return (
    <div className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-5">
      <div className="grid gap-3 md:grid-cols-6">
        {/* Date */}
        <div className="md:col-span-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Date
          </label>
          <input
            type="date"
            value={form.expense_date}
            onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
            className={darkInputCls}
          />
        </div>

        {/* Amount */}
        <div className="md:col-span-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className={cn(darkInputCls, "tabular-nums")}
          />
        </div>

        {/* Currency */}
        <div className="md:col-span-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Currency
          </label>
          <select
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            className={darkSelectCls}
          >
            <option value="EUR" className="bg-[#111827]">EUR</option>
            <option value="USD" className="bg-[#111827]">USD</option>
            <option value="GBP" className="bg-[#111827]">GBP</option>
          </select>
        </div>

        {/* Category */}
        <div className="md:col-span-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
            className={darkSelectCls}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#111827]">
                {toTitle(c)}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Description
          </label>
          <input
            type="text"
            placeholder="e.g. Railway hosting invoice"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={darkInputCls}
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-6">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Notes (optional)
          </label>
          <input
            type="text"
            placeholder="Internal notes about this expense"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className={darkInputCls}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(form)}
          disabled={!canSubmit || isPending}
          className="inline-flex items-center gap-1.5 rounded-lg btn-primary px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          <Check className="h-3.5 w-3.5" />
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  expense: AdminExpense;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  errorMsg: string | null;
}

function DeleteConfirmModal({
  expense,
  onCancel,
  onConfirm,
  isPending,
  errorMsg,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-neon w-full max-w-md rounded-xl border border-red-500/30 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-100">Delete expense?</h3>
            <p className="mt-1 text-sm text-slate-400">
              This will permanently delete{" "}
              <span className="font-semibold text-slate-200">{expense.description}</span>{" "}
              ({formatCurrency(expense.amount, expense.currency)}). This action cannot be undone.
            </p>
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

// ─── Category badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        "bg-white/[0.04]",
        categoryTextColor(category)
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", categoryColor(category))} />
      {category}
    </span>
  );
}

// ─── Main Finance Tab ─────────────────────────────────────────────────────────

export default function FinanceTab() {
  const queryClient = useQueryClient();
  const [rangeId, setRangeId] = React.useState<string>("12m");
  const [granularityOverride, setGranularityOverride] = React.useState<Granularity | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<AdminExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminExpense | null>(null);

  const range = RANGE_OPTIONS.find((r) => r.id === rangeId) ?? RANGE_OPTIONS[2];
  const granularity = granularityOverride ?? range.granularity;

  // Reset granularity override when range changes
  React.useEffect(() => {
    setGranularityOverride(null);
  }, [rangeId]);

  const overviewQuery = useQuery<FinanceOverview, Error>({
    queryKey: ["admin-finance-overview", granularity, range.months],
    queryFn: () =>
      api.adminFinanceOverview({
        period: granularity,
        months: range.months,
      }),
    refetchInterval: 60_000,
  });

  const expensesQuery = useQuery<AdminExpense[], Error>({
    queryKey: ["admin-expenses"],
    queryFn: () => api.adminListExpenses(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormState) =>
      api.adminCreateExpense({
        amount: Number(data.amount),
        currency: data.currency,
        description: data.description.trim(),
        category: data.category,
        expense_date: data.expense_date,
        notes: data.notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance-overview"] });
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseFormState }) =>
      api.adminUpdateExpense(id, {
        amount: Number(data.amount),
        currency: data.currency,
        description: data.description.trim(),
        category: data.category,
        expense_date: data.expense_date,
        notes: data.notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance-overview"] });
      setEditingExpense(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance-overview"] });
      setDeleteTarget(null);
    },
  });

  const data = overviewQuery.data;
  const currency = data?.currency || "EUR";

  // ── KPI deltas vs previous period ───────────────────────────────────────────
  const deltas = React.useMemo(() => {
    if (!data || data.timeline.length < 2) {
      return { revenue: null, expenses: null, profit: null };
    }
    const tl = data.timeline;
    const last = tl[tl.length - 1];
    const prev = tl[tl.length - 2];
    const pct = (curr: number, prior: number): number | null => {
      if (prior === 0) return curr === 0 ? 0 : null;
      return ((curr - prior) / Math.abs(prior)) * 100;
    };
    return {
      revenue: pct(last.revenue, prev.revenue),
      expenses: pct(last.expenses, prev.expenses),
      profit: pct(last.profit, prev.profit),
    };
  }, [data]);

  // ── Paying users derivation ────────────────────────────────────────────────
  const payingUsers = React.useMemo(() => {
    if (!data) return null;
    const planCount = Object.keys(data.by_plan || {}).length;
    // We don't know exact count, but total non-zero plan revenue slices as indicator
    return planCount > 0 ? planCount : null;
  }, [data]);

  // ── Totals from overview ───────────────────────────────────────────────────
  const totalPayments = React.useMemo(() => {
    if (!data) return 0;
    return data.timeline.reduce((sum, p) => sum + (p.payments_count || 0), 0);
  }, [data]);

  // ── Breakdown entries ──────────────────────────────────────────────────────
  const planEntries = React.useMemo<BreakdownEntry[]>(() => {
    if (!data?.by_plan) return [];
    return Object.entries(data.by_plan).map(([k, amt]) => ({
      key: k,
      label: planLabel(k),
      amount: Number(amt) || 0,
      color: planColor(k),
    }));
  }, [data]);

  const categoryEntries = React.useMemo<BreakdownEntry[]>(() => {
    if (!data?.expenses_by_category) return [];
    return Object.entries(data.expenses_by_category).map(([k, amt]) => ({
      key: k,
      label: toTitle(k),
      amount: Number(amt) || 0,
      color: categoryColor(k),
    }));
  }, [data]);

  // ── Sorted expenses ─────────────────────────────────────────────────────────
  const sortedExpenses = React.useMemo(() => {
    if (!expensesQuery.data) return [];
    return [...expensesQuery.data].sort(
      (a, b) =>
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
    );
  }, [expensesQuery.data]);

  const overviewEndpointMissing =
    overviewQuery.isError &&
    overviewQuery.error instanceof Error &&
    /404|not.?found/i.test(overviewQuery.error.message || "");

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Period selector ───────────────────────────────────────────────── */}
      <div className="card-neon flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Calendar className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Finance overview</p>
            <p className="text-[11px] text-slate-500">
              Revenue, expenses and profit across your Stripe and manual ledger
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Granularity pills */}
          <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
            {(["day", "week", "month"] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularityOverride(g)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  granularity === g
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Range pills */}
          <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRangeId(r.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  rangeId === r.id
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => {
              overviewQuery.refetch();
              expensesQuery.refetch();
            }}
            disabled={overviewQuery.isFetching}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-200 disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", overviewQuery.isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Endpoint missing banner ────────────────────────────────────────── */}
      {overviewEndpointMissing && (
        <div className="card-neon rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-100">
                Finance endpoints not yet deployed
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                The backend finance routes are not available on this environment yet. Once deployed, the dashboard will populate automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Generic error banner ───────────────────────────────────────────── */}
      {overviewQuery.isError && !overviewEndpointMissing && (
        <div className="card-neon flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-300">
              Failed to load finance overview:{" "}
              {overviewQuery.error instanceof Error
                ? overviewQuery.error.message
                : "Unknown error"}
            </p>
          </div>
          <button
            onClick={() => overviewQuery.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* ── Row 1: KPI cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-neon rounded-xl p-5 space-y-3">
              <Skeleton className="h-3 w-1/3 bg-white/[0.06]" />
              <Skeleton className="h-7 w-2/3 bg-white/[0.06]" />
              <Skeleton className="h-3 w-1/2 bg-white/[0.04]" />
            </div>
          ))
        ) : (
          <>
            <KpiCard
              label="Revenue"
              value={formatCurrency(data?.total_revenue ?? 0, currency)}
              icon={TrendingUp}
              accent="emerald"
              delta={deltas.revenue}
              deltaLabel="vs prev period"
            />
            <KpiCard
              label="Expenses"
              value={formatCurrency(data?.total_expenses ?? 0, currency)}
              icon={TrendingDown}
              accent="rose"
              delta={deltas.expenses}
              deltaLabel="vs prev period"
            />
            <KpiCard
              label="Profit"
              value={formatCurrency(data?.total_profit ?? 0, currency)}
              icon={Wallet}
              accent={(data?.total_profit ?? 0) >= 0 ? "blue" : "red"}
              delta={deltas.profit}
              deltaLabel="vs prev period"
            />
            <KpiCard
              label="Paying plans"
              value={payingUsers != null ? formatCount(payingUsers) : "\u2014"}
              icon={Users}
              accent="purple"
              subText={`${formatCount(totalPayments)} payment${
                totalPayments === 1 ? "" : "s"
              } in range`}
            />
          </>
        )}
      </div>

      {/* ── Row 2: Timeline chart ──────────────────────────────────────────── */}
      <div className="card-neon rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Revenue vs Expenses</h3>
            <p className="text-[11px] text-slate-500">
              Bars show revenue and expenses per {granularity}; line overlay is profit
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-slate-400">Expenses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-slate-400">Profit</span>
            </div>
          </div>
        </div>
        <div className="p-5">
          {overviewQuery.isLoading ? (
            <div className="flex h-[300px] items-end gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 bg-white/[0.04]"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          ) : (
            <TimelineChart
              data={data?.timeline ?? []}
              granularity={granularity}
              currency={currency}
            />
          )}
        </div>
      </div>

      {/* ── Row 3: Two half-width breakdowns ───────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by plan */}
        <div className="card-neon rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Revenue by plan</h3>
              <p className="text-[11px] text-slate-500">
                Distribution of subscription revenue in range
              </p>
            </div>
            {!overviewQuery.isLoading && planEntries.length > 0 && (
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                {planEntries.length} plan{planEntries.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="p-5">
            {overviewQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-24 bg-white/[0.06]" />
                      <Skeleton className="h-3 w-16 bg-white/[0.06]" />
                    </div>
                    <Skeleton className="h-1.5 w-full bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : (
              <BreakdownList
                entries={planEntries}
                currency={currency}
                emptyIcon={Users}
                emptyText="No subscription revenue yet"
              />
            )}
          </div>
        </div>

        {/* Expenses by category */}
        <div className="card-neon rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Expenses by category</h3>
              <p className="text-[11px] text-slate-500">
                Manual ledger breakdown for the current range
              </p>
            </div>
            {!overviewQuery.isLoading && categoryEntries.length > 0 && (
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                {categoryEntries.length} categor
                {categoryEntries.length !== 1 ? "ies" : "y"}
              </span>
            )}
          </div>
          <div className="p-5">
            {overviewQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-24 bg-white/[0.06]" />
                      <Skeleton className="h-3 w-16 bg-white/[0.06]" />
                    </div>
                    <Skeleton className="h-1.5 w-full bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : (
              <BreakdownList
                entries={categoryEntries}
                currency={currency}
                emptyIcon={Receipt}
                emptyText="No manual expenses recorded"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Expenses table ──────────────────────────────────────────── */}
      <div className="card-neon rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Manual expenses</h3>
            <p className="text-[11px] text-slate-500">
              Hosting, tools, marketing and other business costs
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!expensesQuery.isLoading && sortedExpenses.length > 0 && (
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-slate-300">
                {sortedExpenses.length} record{sortedExpenses.length !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={() => {
                setShowAddForm((v) => !v);
                setEditingExpense(null);
                createMutation.reset();
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all",
                showAddForm
                  ? "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                  : "btn-primary text-white shadow-blue-500/20"
              )}
            >
              {showAddForm ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  Close
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add expense
                </>
              )}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showAddForm && (
          <ExpenseForm
            submitLabel="Add expense"
            onCancel={() => {
              setShowAddForm(false);
              createMutation.reset();
            }}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
            errorMsg={
              createMutation.isError
                ? createMutation.error instanceof Error
                  ? createMutation.error.message
                  : "Failed to create expense."
                : null
            }
          />
        )}

        {/* Edit form */}
        {editingExpense && (
          <ExpenseForm
            initial={{
              amount: String(editingExpense.amount),
              currency: editingExpense.currency || "EUR",
              description: editingExpense.description,
              category: (EXPENSE_CATEGORIES.includes(
                editingExpense.category as ExpenseCategory
              )
                ? editingExpense.category
                : "other") as ExpenseCategory,
              expense_date: editingExpense.expense_date.slice(0, 10),
              notes: editingExpense.notes || "",
            }}
            submitLabel="Save changes"
            onCancel={() => {
              setEditingExpense(null);
              updateMutation.reset();
            }}
            onSubmit={(data) =>
              updateMutation.mutate({ id: editingExpense.id, data })
            }
            isPending={updateMutation.isPending}
            errorMsg={
              updateMutation.isError
                ? updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : "Failed to update expense."
                : null
            }
          />
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Date", "Category", "Description", "Amount", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500",
                      h === "Amount" || h === "Actions" ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expensesQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <Skeleton className="h-4 w-full bg-white/[0.04]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : expensesQuery.isError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <p className="text-sm text-red-400">
                        {expensesQuery.error instanceof Error
                          ? expensesQuery.error.message
                          : "Failed to load expenses."}
                      </p>
                      <button
                        onClick={() => expensesQuery.refetch()}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
                        <Receipt className="h-5 w-5 text-slate-500" />
                      </div>
                      <p className="text-sm text-slate-400">No expenses recorded yet.</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Click &ldquo;Add expense&rdquo; to log your first business cost.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        {new Date(exp.expense_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <CategoryBadge category={exp.category} />
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-200">{exp.description}</p>
                      {exp.notes && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                          {exp.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold tabular-nums text-rose-400">
                        {formatCurrency(exp.amount, exp.currency)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingExpense(exp);
                            setShowAddForm(false);
                            updateMutation.reset();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit expense"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete expense"
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
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          expense={deleteTarget}
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
                : "Failed to delete expense."
              : null
          }
        />
      )}
    </div>
  );
}
