"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Save, Tag, Search } from "lucide-react";
import type { SiteSettings } from "@/types/api";

// ─── Shared input style ──────────────────────────────────────────────────────

const darkInputCls =
  "h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors placeholder:text-slate-600";

// ─── Toggle component ────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-green-500" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

// ─── Connection status dot ───────────────────────────────────────────────────

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 rounded-full shadow-sm",
          connected
            ? "bg-green-400 shadow-green-400/50"
            : "bg-slate-500"
        )}
      />
      <span className={cn("text-xs font-medium", connected ? "text-green-400" : "text-slate-500")}>
        {connected ? "Connected" : "Not connected"}
      </span>
    </div>
  );
}

// ─── Analytics Settings ──────────────────────────────────────────────────────

export default function AnalyticsSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["admin-settings"],
    queryFn: () => api.getAdminSettings(),
  });

  // Local state for form fields
  const [ga4Id, setGa4Id] = useState("");
  const [ga4Enabled, setGa4Enabled] = useState(false);
  const [gtmId, setGtmId] = useState("");
  const [gtmEnabled, setGtmEnabled] = useState(false);
  const [gscVerification, setGscVerification] = useState("");

  // Populate form from loaded settings
  useEffect(() => {
    if (settings) {
      setGa4Id(settings.ga4_measurement_id ?? "");
      setGa4Enabled(settings.ga4_enabled === "true");
      setGtmId(settings.gtm_container_id ?? "");
      setGtmEnabled(settings.gtm_enabled === "true");
      setGscVerification(settings.gsc_verification_tag ?? "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.updateAdminSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ga4_measurement_id: ga4Id,
      ga4_enabled: String(ga4Enabled),
      gtm_container_id: gtmId,
      gtm_enabled: String(gtmEnabled),
      gsc_verification_tag: gscVerification,
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-neon rounded-xl p-6 space-y-4">
            <Skeleton className="h-5 w-3/4 bg-white/[0.06]" />
            <Skeleton className="h-9 w-full bg-white/[0.04]" />
            <Skeleton className="h-4 w-1/2 bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  const ga4Connected = ga4Enabled && ga4Id.trim().length > 0;
  const gtmConnected = gtmEnabled && gtmId.trim().length > 0;
  const gscConnected = gscVerification.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Google Analytics 4 */}
        <div className="card-neon rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <BarChart3 className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Google Analytics 4</p>
                <p className="text-xs text-slate-500">Track website traffic and behavior</p>
              </div>
            </div>
            <ConnectionDot connected={ga4Connected} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Measurement ID</label>
            <input
              value={ga4Id}
              onChange={(e) => setGa4Id(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className={darkInputCls}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">Enable tracking</label>
            <Toggle checked={ga4Enabled} onChange={setGa4Enabled} />
          </div>
        </div>

        {/* Google Tag Manager */}
        <div className="card-neon rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Tag className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Google Tag Manager</p>
                <p className="text-xs text-slate-500">Manage marketing and analytics tags</p>
              </div>
            </div>
            <ConnectionDot connected={gtmConnected} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Container ID</label>
            <input
              value={gtmId}
              onChange={(e) => setGtmId(e.target.value)}
              placeholder="GTM-XXXXXXX"
              className={darkInputCls}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">Enable GTM</label>
            <Toggle checked={gtmEnabled} onChange={setGtmEnabled} />
          </div>
        </div>

        {/* Google Search Console */}
        <div className="card-neon rounded-xl p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Search className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Google Search Console</p>
                <p className="text-xs text-slate-500">Monitor search performance and indexing</p>
              </div>
            </div>
            <ConnectionDot connected={gscConnected} />
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
            <p className="text-xs text-slate-400">
              To verify your site with Google Search Console:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-500">
              <li>Go to Google Search Console and add your property</li>
              <li>Choose &quot;HTML tag&quot; verification method</li>
              <li>Copy the meta tag content value and paste it below</li>
              <li>Save settings, then click Verify in Search Console</li>
            </ol>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Verification Meta Tag</label>
            <input
              value={gscVerification}
              onChange={(e) => setGscVerification(e.target.value)}
              placeholder="e.g. abc123def456..."
              className={darkInputCls}
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold btn-primary shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save All Settings
            </>
          )}
        </button>
        {saveMutation.isSuccess && (
          <p className="text-xs text-green-400">Settings saved successfully.</p>
        )}
        {saveMutation.isError && (
          <p className="text-xs text-red-400">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Failed to save settings."}
          </p>
        )}
      </div>
    </div>
  );
}
