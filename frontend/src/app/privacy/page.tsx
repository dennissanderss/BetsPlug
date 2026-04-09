import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — BetsPlug",
  description:
    "How BetsPlug collects, uses and protects your personal data. GDPR-compliant privacy policy for our AI sports analytics platform.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — BetsPlug",
    description:
      "How BetsPlug collects, uses and protects your personal data.",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="We take your privacy seriously. This policy explains what data we collect, why we collect it, and what rights you have under the GDPR."
      lastUpdated="April 9, 2026"
      breadcrumb="Privacy Policy"
    >
      <h2>1. Who we are</h2>
      <p>
        BetsPlug (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an AI-driven sports analytics
        platform operated from the Netherlands. We are the data controller for
        the personal information described in this policy. You can reach us at{" "}
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
          Payment is handled by <strong>Stripe</strong> and{" "}
          <strong>PayPal</strong>. We never see or store your full card number,
          CVC or bank details — these go directly to our payment processors.
        </li>
        <li>
          We do store the last four digits of your card, the card brand, and a
          tokenised reference so we can show your saved method and process
          recurring charges.
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
          <strong>To deliver the service</strong> — your account, predictions,
          notifications, customer support.
        </li>
        <li>
          <strong>To process payments</strong> — recurring subscription billing
          via Stripe and PayPal.
        </li>
        <li>
          <strong>To improve the product</strong> — anonymised analytics on
          which features get used so we know what to build next.
        </li>
        <li>
          <strong>To meet legal obligations</strong> — tax records, fraud
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
          <strong>Stripe</strong> &amp; <strong>PayPal</strong> — payment
          processing
        </li>
        <li>
          <strong>Vercel</strong> — hosting and edge delivery (data center in
          Frankfurt, EU)
        </li>
        <li>
          <strong>Cloudflare</strong> — DDoS protection and CDN
        </li>
        <li>
          <strong>Sendgrid / Postmark</strong> — transactional email (account
          confirmations, receipts)
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
