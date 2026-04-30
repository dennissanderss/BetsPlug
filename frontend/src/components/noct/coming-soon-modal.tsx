"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Construction, X, Hourglass } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Headline of the locked feature (e.g. "Combi of the Day"). */
  feature: string;
  /** One- or two-line teaser shown below the headline. */
  body: string;
  /** Optional small pill — e.g. translated "In development". */
  badge?: string;
  /** Localized "Got it" / "Sluiten" close-button label. */
  closeLabel: string;
}

export function ComingSoonModal({
  open,
  onOpenChange,
  feature,
  body,
  badge,
  closeLabel,
}: ComingSoonModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] animate-fade-in bg-black/60 backdrop-blur-sm" />

        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[61] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 animate-fade-in"
          aria-describedby={undefined}
        >
          <div className="card-neon card-neon-purple halo-purple relative overflow-hidden p-7">
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="btn-ghost absolute right-3 top-3 h-8 w-8 !p-0 inline-flex items-center justify-center rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>

            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
              style={{ background: "hsl(var(--accent-purple) / 0.22)" }}
            />

            <div className="relative flex flex-col items-center text-center">
              <HexBadge variant="purple" size="lg">
                <Construction className="h-6 w-6" strokeWidth={2} />
              </HexBadge>

              <Dialog.Title asChild>
                <h2 className="text-heading mt-5 text-xl text-[#ededed] sm:text-2xl">
                  {feature}
                </h2>
              </Dialog.Title>

              <p className="mt-2 text-sm text-[#a3a9b8] leading-relaxed">
                {body}
              </p>

              {badge && (
                <Pill tone="info" className="mt-4 inline-flex items-center gap-1.5">
                  <Hourglass className="h-3 w-3" /> {badge}
                </Pill>
              )}

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="btn-ghost mt-6 text-sm"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
