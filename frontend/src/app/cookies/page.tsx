import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy - BetsPlug",
  description:
    "Which cookies BetsPlug uses, why we use them, and how you can manage your preferences.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    title: "Cookie Policy - BetsPlug",
    description:
      "Which cookies BetsPlug uses, why we use them, and how you can manage your preferences.",
    type: "website",
  },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="A short, honest overview of the cookies BetsPlug uses, what they do, and how you can control them."
      lastUpdated="April 9, 2026"
      breadcrumb="Cookies"
    >
      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files that websites store on your device.
        They&apos;re used to remember your preferences, keep you signed in, and
        understand how the site is used. Some cookies are essential - without
        them the site simply wouldn&apos;t work - and others are optional.
      </p>

      <h2>2. The cookies we use</h2>
      <h3>Strictly necessary cookies</h3>
      <p>
        These cookies are required for BetsPlug to function. They cannot be
        switched off in our systems. They are usually only set in response to
        actions you take, such as logging in or filling out forms.
      </p>
      <ul>
        <li>
          <strong>session</strong> - keeps you signed in across pages
        </li>
        <li>
          <strong>csrf_token</strong> - protects against cross-site request forgery
        </li>
        <li>
          <strong>locale</strong> - remembers your selected language
        </li>
        <li>
          <strong>cookie_consent</strong> - remembers your cookie preferences
        </li>
      </ul>

      <h3>Performance cookies</h3>
      <p>
        These help us understand which pages are popular, which features get
        used, and where we can make BetsPlug faster. All data is aggregated and
        anonymised.
      </p>
      <ul>
        <li>
          <strong>_va_*</strong> - Vercel Analytics (privacy-friendly, no
          fingerprinting, no third-party sharing)
        </li>
        <li>
          <strong>_perf_*</strong> - Speed Insights (Core Web Vitals)
        </li>
      </ul>

      <h3>Functional cookies</h3>
      <p>
        These remember choices you make so we don&apos;t have to ask twice.
      </p>
      <ul>
        <li>
          <strong>theme</strong> - your dark/light mode preference
        </li>
        <li>
          <strong>onboarding_seen</strong> - hides the welcome tour after you&apos;ve
          completed it
        </li>
      </ul>

      <h3>Marketing cookies</h3>
      <p>
        We currently <strong>do not</strong> use third-party marketing cookies
        (no Google Ads, no Facebook Pixel, no retargeting). If we ever add
        them, we will update this page and ask for your explicit consent first.
      </p>

      <h2>3. Third-party services</h2>
      <p>
        Some of our partners may set their own cookies when you interact with
        them on our site:
      </p>
      <ul>
        <li>
          <strong>Stripe</strong> - fraud prevention and payment processing on
          the checkout page only
        </li>
        <li>
          <strong>PayPal</strong> - fraud prevention and payment processing on
          the checkout page only
        </li>
      </ul>
      <p>
        These cookies are governed by the respective providers&apos; privacy
        policies and are only set when you actually use their checkout flows.
      </p>

      <h2>4. How long they last</h2>
      <ul>
        <li>
          <strong>Session cookies</strong> - deleted when you close your browser
        </li>
        <li>
          <strong>Functional cookies</strong> - up to 12 months
        </li>
        <li>
          <strong>Analytics cookies</strong> - up to 24 months
        </li>
      </ul>

      <h2>5. Managing your preferences</h2>
      <p>
        You can change your cookie preferences at any time:
      </p>
      <ol>
        <li>
          Use your browser&apos;s built-in cookie controls to block or delete
          cookies on a per-site basis.
        </li>
        <li>
          Most browsers also support a &quot;Do Not Track&quot; header which we
          honour for analytics cookies.
        </li>
        <li>
          Disabling strictly necessary cookies will likely break parts of the
          site, including login.
        </li>
      </ol>

      <h2>6. Changes to this policy</h2>
      <p>
        If we add new cookies or change existing ones, we will update this page
        and the &quot;Last updated&quot; date at the top.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about cookies or how to disable them? Email{" "}
        <a href="mailto:support@betsplug.com">support@betsplug.com</a>.
      </p>
    </LegalPage>
  );
}
