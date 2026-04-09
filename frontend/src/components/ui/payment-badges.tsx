/* ─────────────────────────────────────────────────────────────────
   Brand SVG payment badges (inline, no external assets)

   These are the site-wide dark-tile payment badges used in both the
   footer and the checkout page. Keep them in one place so the two
   surfaces can never visually drift apart.
   ───────────────────────────────────────────────────────────────── */

export function PayPalBadge() {
  return (
    <div
      className="flex h-10 w-16 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-colors hover:border-green-500/30 hover:bg-white/[0.06]"
      aria-label="PayPal"
    >
      <svg viewBox="0 0 80 20" className="h-4 w-auto" aria-hidden="true">
        <text
          x="0"
          y="15"
          fontFamily="var(--font-brand), Arial, sans-serif"
          fontWeight="900"
          fontSize="16"
          letterSpacing="-0.5"
        >
          <tspan fill="#60a5fa">Pay</tspan>
          <tspan fill="#3b82f6">Pal</tspan>
        </text>
      </svg>
    </div>
  );
}

export function StripeBadge() {
  return (
    <div
      className="flex h-10 w-16 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-colors hover:border-green-500/30 hover:bg-white/[0.06]"
      aria-label="Stripe"
    >
      <svg viewBox="0 0 80 20" className="h-4 w-auto" aria-hidden="true">
        <text
          x="0"
          y="15"
          fontFamily="var(--font-brand), Arial, sans-serif"
          fontWeight="900"
          fontSize="16"
          letterSpacing="-0.5"
          fill="#a78bfa"
        >
          stripe
        </text>
      </svg>
    </div>
  );
}

export function VisaBadge() {
  return (
    <div
      className="flex h-10 w-16 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-colors hover:border-green-500/30 hover:bg-white/[0.06]"
      aria-label="Visa"
    >
      <svg viewBox="0 0 80 20" className="h-4 w-auto" aria-hidden="true">
        <text
          x="0"
          y="15"
          fontFamily="var(--font-brand), Arial, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="16"
          letterSpacing="-0.5"
          fill="#f1f5f9"
        >
          VISA
        </text>
      </svg>
    </div>
  );
}

export function MastercardBadge() {
  return (
    <div
      className="flex h-10 w-16 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-colors hover:border-green-500/30 hover:bg-white/[0.06]"
      aria-label="Mastercard"
    >
      <svg viewBox="0 0 40 24" className="h-5 w-auto" aria-hidden="true">
        <circle cx="15" cy="12" r="8" fill="#ef4444" opacity="0.9" />
        <circle cx="25" cy="12" r="8" fill="#f59e0b" opacity="0.9" />
        <path
          d="M20 6.5a8 8 0 0 0 0 11 8 8 0 0 0 0-11z"
          fill="#fb923c"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}

/** Convenience row with all four badges in the canonical order. */
export function PaymentBadgeRow({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
      <PayPalBadge />
      <StripeBadge />
      <VisaBadge />
      <MastercardBadge />
    </div>
  );
}
