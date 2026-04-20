"use client";

/**
 * System Info tab — self-documenting overview of the BetsPlug stack.
 *
 * Lives on the admin panel so the team (and Dennis specifically — who
 * asked "I don't even remember what I built") has a single page that
 * explains the website, which technologies power each layer, and what
 * the data flow looks like. No secrets exposed — only generic stack
 * names and public architecture choices.
 */

import * as React from "react";
import {
  Activity,
  Boxes,
  Brain,
  Cloud,
  Code2,
  Database,
  Globe,
  Layers,
  MessageSquare,
  Shield,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

interface LiveCounts {
  total_forecasts: number;
  evaluated_count: number;
  pending_count: number;
  accuracy: number;
}

async function fetchLiveCounts(): Promise<LiveCounts | null> {
  try {
    const API =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const res = await fetch(`${API}/dashboard/metrics`);
    if (!res.ok) return null;
    return (await res.json()) as LiveCounts;
  } catch {
    return null;
  }
}

function Row({
  label,
  value,
  pill,
}: {
  label: string;
  value: string;
  pill?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="text-sm text-[#a3a9b8]">{label}</span>
      <span className="text-right text-sm text-[#ededed]">
        {value}
        {pill && (
          <span className="ml-2 inline-block rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-[#4ade80]">
            {pill}
          </span>
        )}
      </span>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <HexBadge variant="green" size="sm">
          {icon}
        </HexBadge>
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#ededed]">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

export default function SystemInfoTab() {
  const [live, setLive] = React.useState<LiveCounts | null>(null);

  React.useEffect(() => {
    fetchLiveCounts().then(setLive);
  }, []);

  const accuracyPct =
    live && typeof live.accuracy === "number"
      ? `${Math.round(live.accuracy * 100)}%`
      : "—";

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="glass-panel p-5">
        <p className="section-label mb-2">
          <Sparkles className="h-3 w-3" /> Wat is BetsPlug?
        </p>
        <p className="text-sm leading-relaxed text-[#a3a9b8]">
          Een AI-voetbalvoorspellingsplatform met publiek trackrecord.
          Eigen ingestion-pipeline haalt fixtures + odds binnen, vier
          modellen (Elo, Poisson, Logistic, XGBoost) produceren kansen,
          een calibratie-laag zet die om in eerlijke winkansen. Elke
          voorspelling krijgt een tier-label (Bronze/Silver/Gold/Platinum)
          en wordt pre-match vastgelegd — na aftrap kan niets meer
          wijzigen. Gebruikers zien hun tier-scope via Stripe-subscription
          op een Next.js dashboard.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
              Total forecasts
            </p>
            <p className="mt-0.5 text-stat tabular-nums text-[#ededed]">
              {live?.total_forecasts ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
              Evaluated
            </p>
            <p className="mt-0.5 text-stat tabular-nums text-[#60a5fa]">
              {live?.evaluated_count ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
              Pending
            </p>
            <p className="mt-0.5 text-stat tabular-nums text-amber-300">
              {live?.pending_count ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
              Accuracy (Free)
            </p>
            <p className="mt-0.5 text-stat tabular-nums text-[#4ade80]">
              {accuracyPct}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: frontend + backend stack */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon={<Code2 className="h-4 w-4" />} title="Frontend">
          <Row label="Framework" value="Next.js" pill="14 App Router" />
          <Row label="UI library" value="React" pill="18" />
          <Row label="Taal" value="TypeScript" pill="5.x" />
          <Row label="Styling" value="Tailwind CSS + Radix UI" />
          <Row label="Data-fetching" value="TanStack Query" pill="v5" />
          <Row label="CMS" value="Sanity Studio" pill="embedded /studio" />
          <Row label="Animation" value="Motion (Framer)" />
          <Row label="Deploy" value="Vercel" pill="auto op push" />
          <Row label="Locales" value="Nederlands + Engels (alleen)" />
        </Card>

        <Card icon={<Layers className="h-4 w-4" />} title="Backend">
          <Row label="Framework" value="FastAPI" pill="0.115" />
          <Row label="Taal" value="Python" pill="3.12" />
          <Row label="ORM" value="async SQLAlchemy 2 + asyncpg" />
          <Row label="Migraties" value="Alembic" />
          <Row label="Task queue" value="Celery 5" pill="celery + emails" />
          <Row label="Caching" value="Redis 7" />
          <Row label="Database" value="PostgreSQL" pill="16" />
          <Row label="Deploy" value="Railway" pill="auto op push" />
          <Row label="Scheduler" value="APScheduler + Celery beat" />
        </Card>
      </div>

      {/* ML + ingestion */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon={<Brain className="h-4 w-4" />} title="Machine learning">
          <Row label="Actieve engine" value="v8.1" pill="XGBoost + calibrated logistic" />
          <Row label="Frameworks" value="XGBoost 2.1 · scikit-learn 1.8" />
          <Row label="Training-set" value="70.000+ historische wedstrijden" />
          <Row label="Validatie" value="Walk-forward, 28.838 OOS matches" />
          <Row label="Models (stemgerechtigd)" value="Elo · Poisson · Logistic · XGBoost" />
          <Row label="Ensemble" value="gewogen gemiddelde van de 4" />
          <Row label="Calibratie" value="separate logistic head" />
          <Row label="Feature-set" value="40+ signalen per wedstrijd" />
          <Row label="Artifacts" value="backend/models/*.ubj + *.pkl (boot-load)" />
        </Card>

        <Card icon={<Workflow className="h-4 w-4" />} title="Ingestion + data">
          <Row label="Upstream" value="api-football.com" />
          <Row label="Competities" value="30 leagues (top-5 + europa + regional)" />
          <Row label="Sync-cadens" value="elke 6 uur (02/08/14/20 UTC)" />
          <Row label="Forecast-cadens" value="elke 3 minuten op nieuwe fixtures" />
          <Row label="Live tracking" value="elke 2 minuten tijdens kickoff-window" />
          <Row label="Result-sweep" value="dagelijks, auto-grading" />
          <Row label="Tier-label" value="pick_tier_expression() SQL CASE" />
          <Row label="Pre-match lock" value="locked_at + prediction_source='live'" />
        </Card>
      </div>

      {/* Tier + billing */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon={<Shield className="h-4 w-4" />} title="Tier-systeem">
          <Row label="Bronze / Free" value="45%+ · conf ≥0.55 · alle 30 leagues" />
          <Row label="Silver" value="60%+ · conf ≥0.65 · top 14 leagues" />
          <Row label="Gold" value="70%+ · conf ≥0.70 · top 10 leagues" />
          <Row label="Platinum" value="80%+ · conf ≥0.75 · top 5 elite" />
          <Row label="Feature flag" value="TIER_SYSTEM_ENABLED (env var)" />
          <Row label="Access-filter" value="backend/app/core/tier_system.py" />
          <Row label="Admin-override" value="?tier= query param (admin only)" />
        </Card>

        <Card icon={<Database className="h-4 w-4" />} title="Billing + auth">
          <Row label="Betalingen" value="Stripe Checkout + webhooks" />
          <Row label="Plannen" value="Silver · Gold · Platinum lifetime" />
          <Row label="Bronze trial" value="€0,01 kaartverificatie · 7 dagen" />
          <Row label="Opzeggen" value="/subscription · cancel_at_period_end" />
          <Row label="Cancel-bevestiging" value="email, EN+NL bilingual" />
          <Row label="Auth" value="JWT bearer · HTTPOnly refresh" />
          <Row label="Wachtwoord-reset" value="token-based · email" />
          <Row label="Account-verificatie" value="email-link · verplicht" />
        </Card>
      </div>

      {/* Third-party + channels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon={<Cloud className="h-4 w-4" />} title="Third-party services">
          <Row label="api-football.com" value="ingestion · fixtures + odds + teams" />
          <Row label="Stripe" value="subscription + one-time payment" />
          <Row label="Sanity CMS" value="blog + about + pricing content" />
          <Row label="Railway" value="backend hosting + Postgres + Redis" />
          <Row label="Vercel" value="frontend CDN + ISR" />
          <Row label="Resend / SMTP" value="transactional email" />
          <Row label="Telegram Bot API" value="auto-poster @BetsPluggs" />
        </Card>

        <Card icon={<MessageSquare className="h-4 w-4" />} title="Telegram auto-poster">
          <Row label="Bot" value="@BetsPlugPosterBot" />
          <Row label="Free kanaal" value="@BetsPluggs" pill="primary" />
          <Row label="Pick slots (CET)" value="11:00 · 15:00 · 19:00" />
          <Row label="Daily summary (CET)" value="23:00" />
          <Row label="Result sweep" value="elke 15 min · reply onder pick" />
          <Row label="Admin UI" value="/admin · Telegram tab" />
          <Row label="Database tabel" value="telegram_posts (audit trail)" />
          <Row label="Toekomst" value="Gold + Platinum kanaal (in aanbouw)" />
        </Card>
      </div>

      {/* Key architectural invariants */}
      <Card icon={<Activity className="h-4 w-4" />} title="Integriteits-regels (niet aanpassen zonder nadenken)">
        <Row
          label="Pre-match lock"
          value="Voorspellingen zijn immutable na aftrap"
          pill="locked_at"
        />
        <Row
          label="Honest ROI"
          value="Pre-match vs live-recorded wordt altijd gescheiden gerapporteerd"
        />
        <Row
          label="No cherry-picking"
          value="Elke verliezende pick blijft publiek zichtbaar (geen soft-delete)"
        />
        <Row
          label="Plausibility-gate"
          value="Strategies met implausibele winrate/ROI worden geclampt naar 0"
        />
        <Row
          label="Tier-label drift"
          value="pick_tier_expression() is single source of truth"
        />
        <Row
          label="Simulatie-disclaimer"
          value="Alle output gelabeld 'simulated / educational only'"
        />
      </Card>

      {/* Admin-only meta */}
      <div className="glass-panel p-4">
        <p className="section-label mb-2">
          <Boxes className="h-3 w-3" /> Repo & docs
        </p>
        <div className="space-y-1 text-sm text-[#a3a9b8]">
          <div>
            <span className="text-[#ededed]">Repo:</span>{" "}
            <code className="text-xs">github.com/dennissanderss/BetsPlug</code>
          </div>
          <div>
            <span className="text-[#ededed]">Session handoff:</span>{" "}
            <code className="text-xs">docs/SESSION_HANDOFF.md</code>
          </div>
          <div>
            <span className="text-[#ededed]">Design system:</span>{" "}
            <code className="text-xs">frontend/NOCTURNE.md</code>
          </div>
          <div>
            <span className="text-[#ededed]">API contract:</span>{" "}
            <code className="text-xs">backend/API_CONTRACT.md</code>
          </div>
          <div>
            <span className="text-[#ededed]">Launch-readiness:</span>{" "}
            <code className="text-xs">docs/final_launch_readiness_v2.md</code>{" "}
            <Pill tone="win" className="!text-[10px]">🟢 GO</Pill>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#6b7280]">
        Deze tab is read-only — puur informatief. Live cijfers (bovenaan)
        komen uit <code>/api/dashboard/metrics</code> en verversen bij
        page-load. Stack-info is hard-coded uit CLAUDE.md en
        package.json — update de tekst als de stack wijzigt.
      </p>
    </div>
  );
}
