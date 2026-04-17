/**
 * Dev-only visual preview for PickTierBadge component.
 *
 * Visit /preview-pick-tier-badge to see every tier × size × state combination
 * rendered against the real NOCTURNE background so we can eyeball the look
 * before wiring the badge into BOTD / Predictions / Dashboard.
 *
 * Safe to remove once Fase B is signed off (it's just a design surface).
 */

import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import type { PickTierSlug } from "@/types/api";

const TIERS: PickTierSlug[] = ["platinum", "gold", "silver", "free"];

export default function PreviewPickTierBadge() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a10] via-[#0a1420] to-[#050a10] p-10 text-white">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">PickTierBadge — visual preview</h1>
          <p className="text-sm text-slate-400">
            Four tiers × three sizes × two states. All rendered from{" "}
            <code className="rounded bg-slate-800 px-1">
              src/components/noct/pick-tier-badge.tsx
            </code>
            . SVG-based, no emoji.
          </p>
        </header>

        {/* ── Row 1: full with label + accuracy ─────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">
            Default (md, label + accuracy)
          </h2>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
            {TIERS.map((t) => (
              <PickTierBadge key={t} tier={t} />
            ))}
          </div>
        </section>

        {/* ── Row 2: small, shield-only ─────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">
            Small (shield-only — for dense lists)
          </h2>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
            {TIERS.map((t) => (
              <PickTierBadge key={t} tier={t} size="sm" showLabel={false} />
            ))}
          </div>
        </section>

        {/* ── Row 3: large, full context ────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">
            Large (for hero cards / BOTD)
          </h2>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
            {TIERS.map((t) => (
              <PickTierBadge key={t} tier={t} size="lg" />
            ))}
          </div>
        </section>

        {/* ── Row 4: locked state ───────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">
            Locked state (visible to users without tier access)
          </h2>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
            {TIERS.map((t) => (
              <PickTierBadge key={t} tier={t} locked />
            ))}
          </div>
        </section>

        {/* ── Row 5: label only (no accuracy) ───────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">
            Label only (no accuracy claim)
          </h2>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
            {TIERS.map((t) => (
              <PickTierBadge key={t} tier={t} showAccuracy={false} />
            ))}
          </div>
        </section>

        {/* ── Row 6: API override data ──────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">
            With API-provided label/accuracy override
          </h2>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
            <PickTierBadge
              tier="platinum"
              label="Elite Pick"
              accuracy="86.9%"
            />
            <PickTierBadge
              tier="gold"
              label="Top Pick"
              accuracy="71.7%"
            />
            <PickTierBadge
              tier="silver"
              label="Solid Pick"
              accuracy="63.2%"
            />
          </div>
        </section>

        {/* ── Row 7: mock card context ──────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">
            In a mock pick-card context
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {TIERS.map((t) => (
              <div
                key={t}
                className="flex items-start justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-4"
              >
                <div>
                  <div className="text-lg font-semibold">Man City vs Arsenal</div>
                  <div className="text-sm text-slate-400">
                    Premier League · Tomorrow 20:00
                  </div>
                  <div className="mt-3 text-2xl font-bold text-emerald-300">
                    Home Win
                  </div>
                  <div className="text-xs text-slate-500">82% confidence</div>
                </div>
                <PickTierBadge tier={t} size="sm" showLabel={false} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
