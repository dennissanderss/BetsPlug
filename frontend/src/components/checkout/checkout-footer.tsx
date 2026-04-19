"use client";

import { ShieldCheck, BadgeCheck, Mail } from "lucide-react";
import { useTranslations } from "@/i18n/locale-provider";

/**
 * CheckoutFooter — minimal footer for the checkout flow. Shows the
 * three most conversion-relevant trust signals (SSL, guarantee,
 * support) plus a small copyright line. No nav links — keeps the
 * visitor in the checkout funnel.
 */
export function CheckoutFooter() {
  const { t } = useTranslations();
  const year = new Date().getFullYear();
  const copy = t("checkout.footer.copy").replace("{year}", String(year));

  return (
    <footer
      className="border-t border-white/[0.1] backdrop-blur-sm"
      style={{ background: "hsl(230 16% 9% / 0.7)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-[#cbd3e0]">
            {/* Checkout-footer trust row — the "14-day money-back
                guarantee" chip used to sit between secure + support,
                but was dropped for consistency with the rest of the
                site (probability-model deliverables do not fit a
                satisfaction-guarantee framing). The statutory
                withdrawal right is still honoured via the FAQ /
                contact flow. */}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#4ade80]" />
              <span>{t("checkout.footer.secure")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#4ade80]" />
              <span>{t("checkout.footer.support")}</span>
            </div>
          </div>
          <p className="text-[11px] text-[#a3a9b8]">{copy}</p>
        </div>
      </div>
    </footer>
  );
}

export default CheckoutFooter;
