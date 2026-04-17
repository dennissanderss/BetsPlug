import type { MetadataRoute } from "next";

/**
 * PWA manifest — served at /manifest.webmanifest
 * ────────────────────────────────────────────────────────────
 * Ships the Android home-screen install prompt data and
 * provides the 192/512 icon variants Google Chrome / Edge need
 * for install dialogs and SERP favicon display.
 *
 * Kept intentionally minimal — we don't ship as a standalone
 * PWA (no service worker), but Chrome still uses the manifest
 * for "Add to Home screen" and richer favicon handling.
 */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BetsPlug — AI football predictions",
    short_name: "BetsPlug",
    description:
      "AI-powered football predictions with a verified, pre-match locked track record.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0d14",
    theme_color: "#4ade80",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
