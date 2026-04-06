import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        /* ── Base variants ── */
        default:
          "border-transparent bg-blue-500/20 text-blue-300 hover:bg-blue-500/30",
        secondary:
          "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
        destructive:
          "border-transparent bg-red-500/20 text-red-300 hover:bg-red-500/30",
        outline:
          "border-white/15 text-slate-300 bg-transparent hover:bg-white/5",

        /* ── Semantic status variants ── */
        success:
          "border-transparent bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30",
        warning:
          "border-transparent bg-amber-500/20 text-amber-300 hover:bg-amber-500/30",

        /* ── Sport-specific variants ── */
        live:
          "border-red-500/30 bg-red-500/15 text-red-300 pr-2.5",
        win:
          "border-transparent bg-emerald-500/20 text-emerald-300",
        loss:
          "border-transparent bg-red-500/20 text-red-300",
        draw:
          "border-transparent bg-amber-500/20 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  const isLive = variant === "live";

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {isLive && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse-slow"
          style={{ boxShadow: "0 0 5px rgba(239,68,68,0.8)" }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
