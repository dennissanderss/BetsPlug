"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Zap,
  Star,
  Building2,
  Users,
  Gift,
  ArrowRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  regularPrice: string;
  memberPrice: string | null;
  saving: string | null;
  isCustom?: boolean;
  features: string[];
  cta: string;
  ctaVariant: "primary" | "glass" | "ghost";
  icon: React.ElementType;
  highlight?: boolean;
  accent: "green" | "purple" | "blue";
}

// ─── Referral link box ────────────────────────────────────────────────────────

function ReferralLinkBox({ link }: { link: string }) {
  const { t } = useTranslations();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // no-op
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="glass-panel flex items-stretch overflow-hidden rounded-xl"
      style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}
    >
      <div className="flex min-w-0 flex-1 items-center truncate px-4 py-2.5 font-mono text-sm text-[#ededed]">
        {link}
      </div>
      <button
        onClick={handleCopy}
        className={cn(
          "flex shrink-0 items-center gap-1.5 border-l px-4 py-2.5 text-xs font-semibold transition-all",
          copied
            ? "bg-[#4ade80]/20 text-[#4ade80]"
            : "bg-white/[0.06] text-[#ededed] hover:bg-white/[0.1]"
        )}
        style={{ borderColor: "hsl(0 0% 100% / 0.1)" }}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            {t("deals.copied")}
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            {t("deals.copy")}
          </>
        )}
      </button>
    </div>
  );
}

// ─── Feature list ────────────────────────────────────────────────────────────

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {features.map((f) => (
        <li
          key={f}
          className="flex items-center gap-2.5 text-sm text-[#ededed]"
        >
          <Check className="h-3.5 w-3.5 shrink-0 text-[#4ade80]" />
          {f}
        </li>
      ))}
    </ul>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({ plan }: { plan: PricingPlan }) {
  const { t } = useTranslations();
  const Icon = plan.icon;
  const cardClass = plan.highlight ? "card-neon-green halo-green" : "card-neon";

  return (
    <div className={cn(cardClass, "relative rounded-2xl")}>
      <div className="relative flex h-full flex-col p-6">
        {/* Popular badge */}
        {plan.highlight && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Pill tone="win">
              <Star className="h-3 w-3" />
              {t("deals.mostPopular")}
            </Pill>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <HexBadge variant={plan.accent} size="md">
            <Icon className="h-5 w-5" />
          </HexBadge>
          {plan.badge && <Pill tone="purple">{plan.badge}</Pill>}
        </div>

        <h3 className="mt-3 text-heading text-base text-[#ededed]">
          {plan.name}
        </h3>

        {/* Pricing */}
        <div className="mt-3">
          {plan.isCustom ? (
            <p className="text-stat text-2xl gradient-text-green">
              {t("deals.customPricing")}
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <p className="text-stat text-2xl gradient-text-green">
                {plan.memberPrice}
              </p>
              <p className="mb-0.5 text-sm text-[#a3a9b8] line-through">
                {plan.regularPrice}
              </p>
            </div>
          )}
          {!plan.isCustom && (
            <p className="mt-0.5 text-xs text-[#a3a9b8]">
              {t("deals.perMonth")}
            </p>
          )}
          {plan.saving && (
            <div className="mt-2">
              <Pill tone="win">{plan.saving}</Pill>
            </div>
          )}
        </div>

        <FeatureList features={plan.features} />

        <div className="mt-6 flex flex-1 items-end">
          <button
            className={cn(
              "w-full justify-center",
              plan.ctaVariant === "primary" && "btn-primary",
              plan.ctaVariant === "glass" && "btn-glass",
              plan.ctaVariant === "ghost" && "btn-ghost"
            )}
          >
            {plan.cta}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Referral step ────────────────────────────────────────────────────────────

function ReferralStep({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <HexBadge variant="green" size="lg">
        <span className="text-stat text-lg">{step}</span>
      </HexBadge>
      <div>
        <p className="text-sm font-semibold text-[#ededed]">{title}</p>
        <p className="mt-0.5 text-xs text-[#a3a9b8]">{description}</p>
      </div>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "green" | "purple" | "blue";
}) {
  return (
    <div className="card-neon rounded-xl">
      <div className="relative flex items-center gap-3 p-4">
        <HexBadge variant={variant} size="sm">
          <Gift className="h-3.5 w-3.5" />
        </HexBadge>
        <div>
          <p className="text-stat text-xl text-[#ededed]">{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Plans data ───────────────────────────────────────────────────────────────

function getPlans(t: (key: any) => string): PricingPlan[] {
  return [
    {
      id: "annual",
      name: "BetsPlug Pro - Annual",
      badge: t("deals.bestValue"),
      regularPrice: "$29.99/mo",
      memberPrice: "$23.99/mo",
      saving: t("deals.saveAnnual"),
      features: [
        t("deals.featureUnlimitedPredictions"),
        t("deals.featureAllStrategies"),
        t("deals.featurePriorityAlerts"),
        t("deals.featureFullApi"),
        t("deals.featureAdvancedAnalytics"),
        t("deals.featurePrioritySupport"),
      ],
      cta: t("deals.claimDiscount"),
      ctaVariant: "primary",
      icon: Zap,
      highlight: true,
      accent: "green",
    },
    {
      id: "monthly",
      name: "BetsPlug Pro - Monthly",
      regularPrice: "$39.99/mo",
      memberPrice: "$31.99/mo",
      saving: t("deals.saveMonthly"),
      features: [
        t("deals.featureUnlimitedPredictions"),
        t("deals.featureAllStrategies"),
        t("deals.featurePriorityAlerts"),
        t("deals.featureAdvancedAnalytics"),
        t("deals.featurePrioritySupport"),
      ],
      cta: t("deals.claimDiscount"),
      ctaVariant: "glass",
      icon: Star,
      highlight: false,
      accent: "purple",
    },
    {
      id: "enterprise",
      name: "BetsPlug Enterprise",
      regularPrice: " - ",
      memberPrice: null,
      saving: null,
      isCustom: true,
      features: [
        t("deals.featureCustomModels"),
        t("deals.featureDedicatedSupport"),
        t("deals.featureWhiteLabel"),
        t("deals.featureBulkApi"),
        t("deals.featureSlaGuarantee"),
        t("deals.featureTeamManagement"),
      ],
      cta: t("deals.contactSales"),
      ctaVariant: "ghost",
      icon: Building2,
      highlight: false,
      accent: "blue",
    },
  ];
}

const REFERRAL_LINK = "https://betsplug.io/ref/DVB_2024";

// ─── Deals page ───────────────────────────────────────────────────────────────

export default function DealsPage() {
  const { t } = useTranslations();
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-green) / 0.12)",
          filter: "blur(140px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-60 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-purple) / 0.1)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="section-label mb-3">
              <Gift className="h-3 w-3" />
              Member deals
            </span>
            <h1 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
              {t("deals.title")}{" "}
              <span className="gradient-text-green">rewards</span>
            </h1>
            <p className="mt-2 text-sm text-[#a3a9b8]">{t("deals.subtitle")}</p>
          </div>
          <Pill tone="purple">
            <Lock className="h-3 w-3" />
            {t("deals.membersOnly")}
          </Pill>
        </div>

        {/* Hero referral banner */}
        <div className="card-neon-green halo-green rounded-2xl">
          <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Pill tone="win">
                <Gift className="h-3 w-3" />
                {t("deals.memberReward")}
              </Pill>
              <h2 className="text-heading text-2xl text-[#ededed]">
                {t("deals.heroTitle")}
              </h2>
              <p className="max-w-md text-sm text-[#a3a9b8]">
                {t("deals.heroDescription")}
              </p>
            </div>

            <div className="w-full shrink-0 space-y-2 sm:max-w-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                {t("deals.yourReferralLink")}
              </p>
              <ReferralLinkBox link={REFERRAL_LINK} />
              <p className="text-[11px] text-[#a3a9b8]">
                {t("deals.bothGetFreeMonth")}
              </p>
            </div>
          </div>
        </div>

        {/* Partner deals */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <HexBadge variant="purple" size="sm">
              <Star className="h-4 w-4" />
            </HexBadge>
            <div>
              <h2 className="text-heading text-base text-[#ededed]">
                {t("deals.partnerDeals")}
              </h2>
              <p className="mt-0.5 text-xs text-[#a3a9b8]">
                {t("deals.partnerDealsDescription")}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {getPlans(t).map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>

        {/* Referral Program */}
        <div className="card-neon rounded-2xl">
          <div className="relative p-6">
            <div className="mb-6 flex items-start gap-3 border-b border-white/[0.06] pb-5">
              <HexBadge variant="blue" size="md">
                <Users className="h-5 w-5" />
              </HexBadge>
              <div>
                <h2 className="text-heading text-base text-[#ededed]">
                  {t("deals.referralProgram")}
                </h2>
                <p className="mt-0.5 text-xs text-[#a3a9b8]">
                  {t("deals.referralProgramDescription")}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                {t("deals.howItWorks")}
              </p>
              <div className="grid gap-8 sm:grid-cols-3">
                <ReferralStep
                  step={1}
                  title={t("deals.step1Title")}
                  description={t("deals.step1Description")}
                />
                <ReferralStep
                  step={2}
                  title={t("deals.step2Title")}
                  description={t("deals.step2Description")}
                />
                <ReferralStep
                  step={3}
                  title={t("deals.step3Title")}
                  description={t("deals.step3Description")}
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                {t("deals.yourReferralStats")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile
                  label={t("deals.totalReferrals")}
                  value="3"
                  variant="blue"
                />
                <StatTile
                  label={t("deals.active")}
                  value="2"
                  variant="green"
                />
                <StatTile
                  label={t("deals.creditsEarned")}
                  value="$47.98"
                  variant="purple"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                {t("deals.yourReferralLink")}
              </p>
              <ReferralLinkBox link={REFERRAL_LINK} />
            </div>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="glass-panel flex items-start gap-3 rounded-xl p-5">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#a3a9b8]" />
          <p className="text-xs leading-relaxed text-[#a3a9b8]">
            <span className="font-medium text-[#ededed]">
              {t("deals.disclaimer")}:{" "}
            </span>
            {t("deals.disclaimerText")}
          </p>
        </div>
      </div>
    </div>
  );
}
