/**
 * Icon name registry — kept in a plain .ts module because Astro's
 * frontmatter script exports don't reliably expose TypeScript types
 * to importers via `import type { … } from "@/components/ui/Icon.astro"`.
 *
 * Add a new icon here AND in src/components/ui/Icon.astro's ICONS map.
 */
export type IconName =
  | "lock"
  | "shield-check"
  | "shield"
  | "eye"
  | "clock"
  | "brain"
  | "cpu"
  | "globe"
  | "database"
  | "zap"
  | "sliders"
  | "line-chart"
  | "git-branch"
  | "settings"
  | "receipt"
  | "badge-check"
  | "send"
  | "mail"
  | "award"
  | "book-open"
  | "git-compare"
  | "scale"
  | "check"
  | "x"
  | "minus"
  | "trophy"
  | "users"
  | "message-circle"
  | "menu"
  | "chevron-right";
