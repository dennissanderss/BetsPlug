/**
 * Server-rendered FAQ section with schema.org markup
 * ────────────────────────────────────────────────────────────
 * Renders an accessible, collapsible FAQ block and its
 * companion FAQPage JSON-LD for Google rich results.
 * Uses native <details>/<summary> — zero client JS.
 */

import { FaqJsonLd, type FaqItem } from "./json-ld";

interface FaqSectionProps {
  title?: string;
  subtitle?: string;
  items: FaqItem[];
  className?: string;
}

export function FaqSection({
  title = "Frequently Asked Questions",
  subtitle,
  items,
  className = "",
}: FaqSectionProps) {
  return (
    <section className={`py-16 md:py-20 ${className}`}>
      <FaqJsonLd items={items} />

      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-base text-slate-400">{subtitle}</p>
          )}
        </div>

        <div className="space-y-3">
          {items.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-slate-100 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <svg
                  className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-45"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </summary>
              <div className="border-t border-white/[0.06] px-6 py-5 text-sm leading-relaxed text-slate-400">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
