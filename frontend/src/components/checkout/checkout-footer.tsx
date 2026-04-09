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
    <footer className="border-t border-white/[0.06] bg-[#060912]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              {t("checkout.footer.secure")}
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-green-400" />
              {t("checkout.footer.guarantee")}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-400" />
              {t("checkout.footer.support")}
            </div>
          </div>
          <p className="text-[11px] text-slate-600">{copy}</p>
        </div>
      </div>
    </footer>
  );
}

export default CheckoutFooter;
