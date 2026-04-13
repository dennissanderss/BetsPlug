import React from "react";

/**
 * Wrap a lucide-react (or any) icon so Sanity renders it at the
 * correct size in the desk-structure sidebar.
 *
 * Sanity's StyledText CSS uses:
 *   [data-sanity-icon] { font-size: calc(25/16 * 1rem) }
 * and sanity icons use width="1em" height="1em".
 *
 * Without this wrapper lucide icons render at a fixed 24×24 which
 * gets squashed to ~9×9 by the sidebar container.
 */
export function sanityIcon(Icon: React.ComponentType<any>) {
  const Wrapped = () => (
    <Icon size="1em" data-sanity-icon="custom" strokeWidth={2} />
  );
  Wrapped.displayName = `SanityIcon(${Icon.displayName || Icon.name || "Icon"})`;
  return Wrapped;
}
