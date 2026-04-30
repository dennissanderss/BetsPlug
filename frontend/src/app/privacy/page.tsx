import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { getServerLocale, getLocalizedAlternates,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/privacy"]?.[locale] ?? PAGE_META["/privacy"].en;
  const alternates = getLocalizedAlternates("/privacy");
const og = getOpenGraphLocales();
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      type: "website",
      locale: og.locale,
      alternateLocale: og.alternateLocales,
    },
  };
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Plain-English explanation of what BetsPlug collects, why, and the GDPR rights you have over it. No dark patterns, no ad trackers, no selling your data."
      lastUpdated="April 28, 2026"
      breadcrumb="Privacy Policy"
    >
      <h2>1. Who we are</h2>
      <p>
        BetsPlug is an AI-driven football data-analytics platform operated by{" "}
        <strong>Sanders Capital</strong>, a sole proprietorship
        (eenmanszaak) registered with the Dutch Chamber of Commerce
        (KvK number <strong>96286008</strong>, establishment number
        000061622141), based in the Netherlands. Sanders Capital, trading
        as BetsPlug, is the <strong>data controller</strong> for the
        personal information described in this policy. You can reach us at{" "}
        <a href="mailto:support@betsplug.com">support@betsplug.com</a>.
      </p>

      <h2>2. What data we collect</h2>
      <p>
        We only collect the data we genuinely need to operate the service, bill
        your subscription and improve our product.
      </p>
      <h3>Account data</h3>
      <ul>
        <li>Name and email address (when you create an account)</li>
        <li>Country of residence (for tax and compliance reasons)</li>
        <li>Hashed password (we never store your password in plain text)</li>
        <li>Subscription tier and plan history</li>
      </ul>
      <h3>Payment data</h3>
      <ul>
        <li>
          All payments are handled exclusively by{" "}
          <strong>Stripe Payments Europe, Ltd.</strong> Stripe is PCI-DSS
          Level 1 certified. We never see or store your full card number,
          CVC, or bank details — those fields are entered directly into
          Stripe&apos;s secure environment and never reach our servers.
        </li>
        <li>
          From Stripe we receive only a tokenised reference plus the last
          four digits of the card and the card brand, so we can show your
          saved method on your subscription page and process recurring
          charges or refunds.
        </li>
        <li>
          For accounting and tax purposes we keep the invoice metadata
          (amount, plan, currency, country, VAT, transaction ID) for the
          retention period required by Dutch tax law.
        </li>
      </ul>
      <h3>Usage data</h3>
      <ul>
        <li>Pages visited, features used, predictions viewed</li>
        <li>Device type, browser, approximate location (city level, derived from IP)</li>
        <li>Anonymised performance metrics (load time, errors)</li>
      </ul>

      <h2>3. Why we collect it</h2>
      <ol>
        <li>
          <strong>To deliver the service</strong> - your account, predictions,
          notifications, customer support.
        </li>
        <li>
          <strong>To process payments</strong> — subscription billing and
          one-off lifetime purchases via Stripe.
        </li>
        <li>
          <strong>To improve the product</strong> - anonymised analytics on
          which features get used so we know what to build next.
        </li>
        <li>
          <strong>To meet legal obligations</strong> - tax records, fraud
          prevention, regulatory requests.
        </li>
      </ol>

      <h2>4. Who we share it with</h2>
      <p>
        We share data only with carefully selected processors who help us run
        BetsPlug. Each of them is bound by a data processing agreement.
      </p>
      <ul>
        <li>
          <strong>Stripe Payments Europe, Ltd.</strong> — payment
          processing for subscriptions and lifetime purchases
        </li>
        <li>
          <strong>Vercel</strong> — frontend hosting and edge delivery
          (EU region)
        </li>
        <li>
          <strong>Railway</strong> — backend, database and Redis hosting
          (EU region)
        </li>
        <li>
          <strong>Resend</strong> — transactional email (account
          verification, password reset, billing receipts)
        </li>
        <li>
          <strong>API-Football Pro</strong> — sports fixtures, results and
          standings data feed (no personal data shared)
        </li>
      </ul>
      <p>
        We <strong>never sell</strong> your personal data to advertisers or
        data brokers. Full stop.
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li>Account data: as long as your account is active, plus 30 days after deletion.</li>
        <li>Billing records: 7 years (legally required by Dutch tax law).</li>
        <li>Usage analytics: anonymised after 90 days.</li>
        <li>Server logs: 30 days.</li>
      </ul>

      <h2>6. Your rights under the GDPR</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data (&quot;right to be forgotten&quot;)</li>
        <li>Export your data in a portable format</li>
        <li>Object to processing or restrict it</li>
        <li>
          File a complaint with the Dutch Data Protection Authority
          (Autoriteit Persoonsgegevens)
        </li>
      </ul>
      <p>
        To exercise any of these rights, email{" "}
        <a href="mailto:support@betsplug.com">support@betsplug.com</a>. We will
        respond within 30 days.
      </p>

      <h2>7. Security</h2>
      <p>
        We use TLS encryption for all data in transit, encrypted storage at
        rest, hashed passwords (bcrypt), and strict role-based access controls.
        We are PCI DSS compliant via our payment processors. If we ever
        experience a data breach affecting your account, we will notify you and
        the relevant authority within 72 hours, as required by the GDPR.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. When we do, we will update
        the &quot;Last updated&quot; date at the top and, for material changes,
        notify you by email.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy or your data? Email us at{" "}
        <a href="mailto:support@betsplug.com">support@betsplug.com</a>.
      </p>
    </LegalPage>
  );
}
