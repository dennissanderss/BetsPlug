import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GlassPanel — translucent dark surface with backdrop blur and a
 * subtle inner gloss highlight. The foundation of every card and
 * panel in NOCTURNE.
 *
 * Variants:
 *   - default : standard card surface
 *   - lifted  : slightly higher contrast, hoverable
 *   - raised  : topmost layer (modals, popovers, sticky CTAs)
 *
 * Glow backdrops add an atmospheric coloured bleed behind the
 * panel. Use sparingly — feature tiles only.
 */

type GlassVariant = "default" | "lifted" | "raised";
type GlassGlow = "none" | "green" | "purple" | "blue";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  glow?: GlassGlow;
  /** Adds a vertical feature-tile light column inside (Bankers/Upcoming/SuccessRate). */
  featureTile?: GlassGlow;
  children?: React.ReactNode;
}

const VARIANT_CLASS: Record<GlassVariant, string> = {
  default: "glass-panel",
  lifted: "glass-panel-lifted",
  raised: "glass-panel-raised",
};

const GLOW_CLASS: Record<GlassGlow, string> = {
  none: "",
  green: "glow-backdrop-green",
  purple: "glow-backdrop-purple",
  blue: "glow-backdrop-blue",
};

const FEATURE_CLASS: Record<GlassGlow, string> = {
  none: "",
  green: "feature-tile feature-tile-green",
  purple: "feature-tile feature-tile-purple",
  blue: "feature-tile feature-tile-blue",
};

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ variant = "default", glow = "none", featureTile = "none", className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          VARIANT_CLASS[variant],
          GLOW_CLASS[glow],
          FEATURE_CLASS[featureTile],
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

export default GlassPanel;
