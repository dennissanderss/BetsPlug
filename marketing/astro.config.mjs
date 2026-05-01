// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Safety-net redirects — paths that belong on the authed surface
  // (app.betsplug.com) but might still be hit on the marketing
  // domain because of stale Stripe Customer Portal redirects, old
  // emails, or browser cache. Each of these is 308'd to the
  // equivalent path on app.betsplug.com so a returning subscriber
  // never sees a Vercel 404 mid-flow.
  redirects: {
    "/subscription": {
      status: 308,
      destination: "https://app.betsplug.com/subscription",
    },
    "/myaccount": {
      status: 308,
      destination: "https://app.betsplug.com/myaccount",
    },
    "/dashboard": {
      status: 308,
      destination: "https://app.betsplug.com/dashboard",
    },
    "/predictions": {
      status: 308,
      destination: "https://app.betsplug.com/predictions",
    },
    "/trackrecord": {
      status: 308,
      destination: "https://app.betsplug.com/trackrecord",
    },
    "/bet-of-the-day": {
      status: 308,
      destination: "https://app.betsplug.com/bet-of-the-day",
    },
    "/results": {
      status: 308,
      destination: "https://app.betsplug.com/results",
    },
    "/login": {
      status: 308,
      destination: "https://app.betsplug.com/login",
    },
    "/register": {
      status: 308,
      destination: "https://app.betsplug.com/register",
    },
    "/checkout": {
      status: 308,
      destination: "https://app.betsplug.com/checkout",
    },
    "/admin": {
      status: 308,
      destination: "https://app.betsplug.com/admin",
    },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
