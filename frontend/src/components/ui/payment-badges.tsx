/* ─────────────────────────────────────────────────────────────────
   Brand SVG payment badges (inline, no external assets)

   White pill design used site-wide (footer + checkout reassurance
   row). Keeps both surfaces visually identical so trust signals
   never drift.
   ───────────────────────────────────────────────────────────────── */

function Pill({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-label={label}
      title={label}
      className="flex h-8 w-12 items-center justify-center rounded-md border border-white/[0.1] bg-white shadow-sm"
    >
      {children}
    </div>
  );
}

export function VisaBadge() {
  return (
    <Pill label="Visa">
      <span className="text-[11px] font-extrabold italic tracking-tight text-blue-700">
        VISA
      </span>
    </Pill>
  );
}

export function MastercardBadge() {
  return (
    <Pill label="Mastercard">
      <span className="flex">
        <span className="h-3.5 w-3.5 rounded-full bg-red-500" />
        <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-amber-400" />
      </span>
    </Pill>
  );
}

export function AmexBadge() {
  return (
    <Pill label="American Express">
      <span className="text-[10px] font-extrabold tracking-tight text-[#2671b9]">
        AMEX
      </span>
    </Pill>
  );
}

export function PayPalBadge() {
  return (
    <Pill label="PayPal">
      <span className="text-[11px] font-extrabold italic">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#009cde]">Pal</span>
      </span>
    </Pill>
  );
}

export function ApplePayBadge() {
  return (
    <Pill label="Apple Pay">
      <span className="flex items-baseline gap-[1px] text-[10px] font-extrabold tracking-tight text-black">
        {/* Apple logo as inline SVG so it renders consistently across
            platforms (the U+F8FF Apple character only renders on macOS). */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[11px] w-[11px] -translate-y-[1px] fill-current"
        >
          <path d="M17.05 12.04c-.03-2.78 2.27-4.12 2.37-4.18-1.29-1.89-3.3-2.15-4.02-2.18-1.7-.17-3.32 1-4.19 1-.86 0-2.2-.98-3.62-.95-1.86.03-3.58 1.08-4.54 2.74-1.94 3.36-.5 8.33 1.39 11.06.93 1.34 2.03 2.84 3.46 2.79 1.39-.05 1.92-.9 3.6-.9 1.68 0 2.16.9 3.62.87 1.5-.03 2.45-1.36 3.37-2.71 1.06-1.55 1.5-3.06 1.52-3.14-.03-.01-2.92-1.12-2.96-4.4zM14.62 4.13c.77-.93 1.29-2.22 1.14-3.51-1.11.05-2.45.74-3.24 1.67-.71.83-1.34 2.15-1.17 3.41 1.23.1 2.5-.63 3.27-1.57z" />
        </svg>
        <span>Pay</span>
      </span>
    </Pill>
  );
}

/** Convenience row with all five badges in the canonical order. */
export function PaymentBadgeRow({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex flex-wrap items-center justify-center gap-2"}>
      <VisaBadge />
      <MastercardBadge />
      <AmexBadge />
      <PayPalBadge />
      <ApplePayBadge />
    </div>
  );
}
