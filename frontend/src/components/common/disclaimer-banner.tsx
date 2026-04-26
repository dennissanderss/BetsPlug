"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-provider";

interface DisclaimerBannerProps {
  message?: string;
  className?: string;
}

export function DisclaimerBanner({
  message = "For personal analysis and educational purposes only. Not financial advice.",
  className,
}: DisclaimerBannerProps) {
  const { t } = useTranslations();
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5",
        className
      )}
      style={{
        background: "rgba(17, 14, 5, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(245, 158, 11, 0.2)",
        boxShadow: "0 -4px 20px rgba(245, 158, 11, 0.06)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle
          className="h-3.5 w-3.5 shrink-0 text-amber-500/80"
          style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.5))" }}
        />
        <p className="text-xs font-medium text-amber-400/80">
          {message}
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        aria-label={t("a11y.dismissDisclaimer")}
        className="shrink-0 flex h-5 w-5 items-center justify-center rounded text-amber-600 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
