import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { getServerLocale, getLocalizedAlternates,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta =
    PAGE_META["/responsible-gambling"]?.[locale] ??
    PAGE_META["/responsible-gambling"].en;
  const alternates = getLocalizedAlternates("/responsible-gambling");
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

export default function ResponsibleGamblingPage() {
  return (
    <LegalPage
      title="18+ Play Responsibly"
      intro="BetsPlug is a data-analytics platform, not a gambling site. Our AI football predictions are educational — and we take problem gambling seriously. Read this before you place a single bet on any external bookmaker."
      lastUpdated="April 28, 2026"
      breadcrumb="Responsible Gambling"
    >
      <h2>1. What BetsPlug is — and what it is not</h2>
      <p>
        BetsPlug is an{" "}
        <strong>AI-driven sports data-analytics platform</strong> for
        educational and research purposes, operated by Sanders Capital
        (KvK 96286008, the Netherlands). We use multiple AI models to
        analyse team data and generate match predictions and probability
        estimates.
      </p>
      <p>
        <strong>BetsPlug is not a gambling site.</strong> We do not accept
        bets, process wagers, hold customer funds, or operate as a
        bookmaker or licensed gambling operator in any jurisdiction. We
        sell access to data and analysis — nothing else.
      </p>
      <p>
        Our predictions are provided for{" "}
        <strong>informational, educational, and entertainment purposes
        only</strong>. If you choose to act on them by placing a bet with
        an external licensed bookmaker, that decision is entirely your own
        responsibility — which is why this page exists.
      </p>

      <h2>2. Age restriction — 18+</h2>
      <p>
        You must be <strong>at least 18 years old</strong> (or the legal
        gambling age in your country, whichever is higher) to use BetsPlug.
        By creating an account you confirm that you meet this age requirement.
        We reserve the right to request proof of age and to suspend accounts
        where we have reason to believe the user is underage.
      </p>

      <h2>3. No guarantee of profit</h2>
      <p>
        Past performance does not guarantee future results. While our models
        are trained on large historical datasets and our track record is
        publicly verifiable, <strong>no prediction system can guarantee
        winning outcomes</strong>. Sports events are inherently unpredictable,
        and any form of betting carries the risk of losing money.
      </p>
      <ul>
        <li>Never bet more than you can afford to lose.</li>
        <li>Never chase losses by increasing your stake.</li>
        <li>Never borrow money to place predictions.</li>
        <li>Treat betting as entertainment, not as a source of income.</li>
      </ul>

      <h2>4. Signs of problem gambling</h2>
      <p>
        Gambling should be enjoyable and never cause stress, financial hardship,
        or relationship problems. If you recognise any of the following signs in
        yourself or someone you know, we strongly encourage you to seek help:
      </p>
      <ul>
        <li>Spending more money or time on gambling than you intended.</li>
        <li>Feeling anxious, irritable, or restless when not gambling.</li>
        <li>Lying to family or friends about how much you gamble.</li>
        <li>Neglecting work, studies, or personal relationships due to gambling.</li>
        <li>Chasing losses — betting more to try to win back money you have lost.</li>
        <li>Borrowing money or selling possessions to fund gambling.</li>
      </ul>

      <h2>5. Tips for responsible gambling</h2>
      <ul>
        <li>
          <strong>Set a budget.</strong> Decide in advance how much you are
          willing to spend each week or month, and stick to it.
        </li>
        <li>
          <strong>Set a time limit.</strong> Keep track of how long you spend
          on betting-related activities.
        </li>
        <li>
          <strong>Don&apos;t gamble under the influence.</strong> Alcohol and
          drugs impair judgement and can lead to reckless decisions.
        </li>
        <li>
          <strong>Take breaks.</strong> Step away regularly to keep perspective.
        </li>
        <li>
          <strong>Use bookmaker tools.</strong> Most licensed bookmakers offer
          deposit limits, loss limits, cool-off periods, and self-exclusion
          options. Use them.
        </li>
      </ul>

      <h2>6. Where to get help</h2>
      <p>
        If you or someone you know is struggling with problem gambling, please
        reach out to one of the following organisations:
      </p>
      <ul>
        <li>
          <strong>AGOG (Netherlands)</strong> —{" "}
          <a href="https://www.agog.nl" target="_blank" rel="noopener noreferrer">
            agog.nl
          </a>{" "}
          — Free, anonymous help for gambling addiction.
        </li>
        <li>
          <strong>GamCare (UK)</strong> —{" "}
          <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer">
            gamcare.org.uk
          </a>{" "}
          — 0808 8020 133 (24/7 helpline).
        </li>
        <li>
          <strong>Gamblers Anonymous</strong> —{" "}
          <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer">
            gamblersanonymous.org
          </a>{" "}
          — Peer support groups worldwide.
        </li>
        <li>
          <strong>National Council on Problem Gambling (US)</strong> —{" "}
          <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer">
            ncpgambling.org
          </a>{" "}
          — 1-800-522-4700.
        </li>
        <li>
          <strong>Spielsuchthilfe (Germany / Austria)</strong> —{" "}
          <a href="https://www.spielsuchthilfe.de" target="_blank" rel="noopener noreferrer">
            spielsuchthilfe.de
          </a>
        </li>
      </ul>

      <h2>7. Our commitment</h2>
      <p>
        BetsPlug is committed to promoting responsible use of our platform. We
        will never encourage irresponsible gambling, and we will never market
        our services to minors. If you believe that our content is being used
        in a way that promotes irresponsible gambling, please contact us at{" "}
        <a href="mailto:support@betsplug.com">support@betsplug.com</a>.
      </p>
      <p>
        By using BetsPlug, you acknowledge that you have read and understood
        this policy, and that you accept full responsibility for any betting
        decisions you make based on information provided on our platform.
      </p>
    </LegalPage>
  );
}
