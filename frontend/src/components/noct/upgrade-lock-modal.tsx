"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Lock, Sparkles, X, Crown, ArrowRight } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import type { Tier } from "@/hooks/use-tier";

interface UpgradeLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  requiredTier: Exclude<Tier, "free">;
  /** Short one-line teaser shown above the benefit list. */
  blurb?: string;
  /** 3–5 short benefit lines shown as a checklist. */
  benefits?: string[];
}

const TIER_COPY: Record<
  Exclude<Tier, "free">,
  { label: string; hexVariant: "green" | "purple" | "blue"; cta: string; plan: string }
> = {
  silver: {
    label: "Silver",
    hexVariant: "blue",
    cta: "Upgrade to Silver",
    plan: "silver",
  },
  gold: {
    label: "Gold",
    hexVariant: "green",
    cta: "Upgrade to Gold",
    plan: "gold",
  },
  platinum: {
    label: "Platinum",
    hexVariant: "purple",
    cta: "Upgrade to Platinum",
    plan: "platinum",
  },
};

export function UpgradeLockModal({
  open,
  onOpenChange,
  feature,
  requiredTier,
  blurb,
  benefits,
}: UpgradeLockModalProps) {
  const copy = TIER_COPY[requiredTier];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] animate-fade-in bg-black/60 backdrop-blur-sm" />

        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[61] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 animate-fade-in"
          aria-describedby={undefined}
        >
          <div
            className={`card-neon card-neon-${copy.hexVariant} halo-${copy.hexVariant} relative overflow-hidden p-7`}
          >
            {/* Close */}
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="btn-ghost absolute right-3 top-3 h-8 w-8 !p-0 inline-flex items-center justify-center rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>

            {/* Ambient glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
              style={{
                background: `hsl(var(--accent-${copy.hexVariant}) / 0.22)`,
              }}
            />

            <div className="relative flex flex-col items-center text-center">
              <HexBadge variant={copy.hexVariant} size="lg">
                <Lock className="h-6 w-6" strokeWidth={2} />
              </HexBadge>

              <Dialog.Title asChild>
                <h2 className="text-heading mt-5 text-xl text-[#ededed] sm:text-2xl">
                  {feature}
                </h2>
              </Dialog.Title>

              <p className="mt-2 text-sm text-[#a3a9b8]">
                {blurb ??
                  `This feature is part of ${copy.label} and higher plans.`}
              </p>

              {benefits && benefits.length > 0 && (
                <ul className="mt-5 w-full space-y-2 text-left">
                  {benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2.5 text-sm text-[#cbd1dc]"
                    >
                      <Sparkles
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{
                          color: `hsl(var(--accent-${copy.hexVariant}))`,
                        }}
                      />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-7 flex w-full flex-col gap-2">
                <Link
                  href={`/checkout?plan=${copy.plan}`}
                  onClick={() => onOpenChange(false)}
                  className="btn-primary inline-flex items-center justify-center gap-1.5"
                >
                  <Crown className="h-4 w-4" />
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/subscription"
                  onClick={() => onOpenChange(false)}
                  className="btn-ghost text-xs"
                >
                  Compare all plans
                </Link>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
