import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/terms"]?.[locale] ?? PAGE_META["/terms"].en;
  const alternates = getLocalizedAlternates("/terms");

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
    },
  };
}

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The agreement between you and BetsPlug. Plain language where possible, legal clarity where it matters — read before you create an account."
      lastUpdated="April 16, 2026"
      breadcrumb="Terms"
    >
      <h2>1. Who we are</h2>
      <p>
        BetsPlug is operated from the Netherlands. References to &quot;we&quot;,
        &quot;us&quot; and &quot;our&quot; mean BetsPlug. References to
        &quot;you&quot; mean the person using the service. By creating an
        account or otherwise using BetsPlug you agree to be bound by these
        terms.
      </p>

      <h2>2. What BetsPlug is - and what it isn&apos;t</h2>
      <p>
        BetsPlug is an AI-driven football analytics platform. We use statistical
        models to surface probability-weighted predictions for football
        competitions worldwide.
      </p>
      <p>
        <strong>BetsPlug is not a bookmaker.</strong> We do not accept bets, we
        do not handle any betting funds, and we are not affiliated with any
        sportsbook. Our predictions are informational only - they are not
        financial advice and they are not a guarantee of any outcome.
      </p>
      <p>
        Football outcomes are inherently uncertain. Past performance of our
        models does not guarantee future results. Any decision to place a
        wager based on our content is yours alone, and you accept full
        responsibility for it.
      </p>

      <h2>3. Eligibility</h2>
      <ul>
        <li>You must be at least 18 years old (or the legal age of majority in your jurisdiction).</li>
        <li>You must use BetsPlug only where it is legal to do so in your country of residence.</li>
        <li>You must provide accurate, current and complete information when you create your account.</li>
      </ul>

      <h2>4. Account &amp; security</h2>
      <p>
        You are responsible for keeping your password confidential and for any
        activity that happens under your account. Please notify us immediately
        at{" "}
        <a href="mailto:support@betsplug.com">support@betsplug.com</a> if you
        suspect any unauthorised access. We may suspend or terminate accounts
        that violate these terms or that we reasonably believe are being used
        for fraud.
      </p>

      <h2>5. Subscriptions, billing &amp; trials</h2>
      <h3>Plans and pricing</h3>
      <p>
        BetsPlug offers monthly and yearly subscription plans. The price you
        pay is the price displayed on the pricing page at the moment of
        checkout. We may change prices for new subscriptions at any time;
        existing subscribers will keep their current price for the remainder of
        their billing cycle.
      </p>
      <h3>Free trials</h3>
      <p>
        Some plans offer a free trial. To start a trial we charge a symbolic{" "}
        <strong>€0.01</strong> to verify your card is valid - this is a
        fraud-prevention measure, not a real charge of the plan price. The
        full subscription price is only charged when the trial ends, unless
        you cancel before then.
      </p>
      <h3>Recurring billing</h3>
      <p>
        Subscriptions renew automatically at the end of each billing cycle
        until you cancel. You authorise us to charge your payment method on
        each renewal. You can cancel at any time from your account settings - 
        cancellation takes effect at the end of the current billing cycle.
      </p>
      <h3>Refunds</h3>
      <p>
        EU consumers have a 14-day right of withdrawal under Directive
        2011/83/EU. By starting to use the predictions content during the
        14-day period, you expressly waive this right (as permitted by the
        Directive for digital content). Outside that exception, refunds are
        handled case by case - contact support if you have a problem.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Share your account credentials with anyone else.</li>
        <li>Scrape, copy, redistribute or resell our predictions or content without our written permission.</li>
        <li>Reverse engineer the platform or any of its models.</li>
        <li>Use BetsPlug for any unlawful purpose, including fraud or money laundering.</li>
        <li>Attempt to interfere with the security or integrity of our systems.</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        All content on BetsPlug - including the models, the website, the
        articles and the predictions - is owned by BetsPlug or its licensors
        and is protected by copyright, trademark and other intellectual
        property laws. We grant you a limited, personal, non-transferable,
        revocable licence to use the service for your own non-commercial
        purposes during an active subscription. Nothing in these terms grants
        you any other rights.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        BetsPlug is provided &quot;as is&quot; and &quot;as available&quot;.
        To the maximum extent permitted by law, we disclaim all warranties,
        whether express or implied, including (without limitation) implied
        warranties of merchantability, fitness for a particular purpose, and
        non-infringement.
      </p>
      <p>
        We do not warrant that the predictions will be accurate, that the
        service will be uninterrupted, or that defects will be corrected
        immediately.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, BetsPlug is not liable for any
        indirect, incidental, special, consequential or punitive damages - 
        including any losses incurred from wagers placed based on our content.
        Our total aggregate liability to you for any claim arising out of or
        relating to these terms or the service is limited to the amount you
        paid us in the twelve (12) months preceding the claim.
      </p>

      <h2>10. Termination</h2>
      <p>
        You can cancel your subscription at any time from your account
        settings. We may suspend or terminate your account if you breach these
        terms, if required by law, or if we reasonably believe that your use
        of the service exposes us or other users to risk. Sections that by
        their nature should survive termination (e.g. intellectual property,
        disclaimers, limitation of liability) will continue to apply.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. When we do, we will
        update the &quot;Last updated&quot; date at the top of this page. For
        material changes we will also notify you by email at least 30 days in
        advance. Continued use of the service after the changes take effect
        means you accept the new terms.
      </p>

      <h2>12. Governing law &amp; disputes</h2>
      <p>
        These terms are governed by the laws of the Netherlands. Any disputes
        arising out of or in connection with these terms will be subject to
        the exclusive jurisdiction of the Dutch courts, unless mandatory
        consumer protection law in your country of residence provides otherwise.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:support@betsplug.com">support@betsplug.com</a>.
      </p>
    </LegalPage>
  );
}
