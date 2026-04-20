/**
 * Migrate hardcoded page content → Sanity singleton documents
 * Run: npx tsx --env-file=.env.local scripts/migrate-page-singletons.ts
 */
import "dotenv/config";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "nk7ioy85",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

if (!process.env.SANITY_API_TOKEN) {
  console.error("❌ SANITY_API_TOKEN not set");
  process.exit(1);
}

function ls(en: string) { return { _type: "localeString", en }; }
function lt(en: string) { return { _type: "localeText", en }; }

async function main() {
  console.log("🚀 Migrating page singletons...\n");

  // ── Homepage ──────────────────────────────────────────
  await client.createOrReplace({
    _id: "homepage",
    _type: "homepage",
    accuracyBars: [
      { _key: "ab0", league: "Premier", percentage: 58 },
      { _key: "ab1", league: "La Liga", percentage: 54 },
      { _key: "ab2", league: "Bundes.", percentage: 52 },
      { _key: "ab3", league: "Serie A", percentage: 57 },
      { _key: "ab4", league: "Ligue 1", percentage: 50 },
      { _key: "ab5", league: "Eredivisie", percentage: 55 },
    ],
    comparisonRows: [
      { _key: "cr0", feature: ls("BetsPlug Pulse AI predictions"), betsplug: true, freeTools: false, bookmakers: false, note: ls("Elo, Poisson & Logistic combined via BetsPlug Pulse") },
      { _key: "cr1", feature: ls("Fully transparent public track record"), betsplug: true, freeTools: false, bookmakers: false, note: ls("Every pick logged, nothing hidden") },
      { _key: "cr2", feature: ls("Real-time probability updates"), betsplug: true, freeTools: false, bookmakers: false },
      { _key: "cr3", feature: ls("Free plan with daily value picks"), betsplug: true, freeTools: false, bookmakers: false },
      { _key: "cr4", feature: ls("Strategy backtesting tools"), betsplug: true, freeTools: false, bookmakers: false, note: ls("Test your edge before committing") },
      { _key: "cr5", feature: ls("No hidden fees or lock-in contracts"), betsplug: true, freeTools: false, bookmakers: false },
      { _key: "cr6", feature: ls("Data-first - zero hype, zero guessing"), betsplug: true, freeTools: false, bookmakers: false },
      { _key: "cr7", feature: ls("Coverage of 16+ global leagues"), betsplug: true, freeTools: false, bookmakers: false },
    ],
    trackRecordStats: [
      { _key: "tr0", value: "1,284", label: ls("Predictions") },
      { _key: "tr1", value: "4", label: ls("Models") },
      { _key: "tr2", value: "15+", label: ls("Leagues") },
    ],
    seoFaqs: [
      { _key: "sf0", _type: "localeFaq", question: ls("What is an AI football prediction platform?"), answer: lt("An AI football prediction platform uses machine learning models, historical data, and statistical engines (like Elo and Poisson) to forecast the most likely outcome of football matches. BetsPlug is built as a pure analytics tool - we show you the numbers, probabilities and expected value, so you can decide which bets to place with a bookmaker of your choice.") },
      { _key: "sf1", _type: "localeFaq", question: ls("How do I get started with BetsPlug?"), answer: lt("Start with our Bronze plan - a symbolic €0.01 trial that unlocks 7 days of full Gold-level access: daily AI football picks, upcoming match predictions, our verified track record and every model output. We charge one cent through Stripe so we can verify the card is real. Upgrade to Silver, Gold or Platinum when you're ready.") },
      { _key: "sf2", _type: "localeFaq", question: ls("Which football leagues does the AI predictor cover?"), answer: lt("Our AI predictor is focused exclusively on football, covering the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Champions League and more. New football leagues are added regularly as our models are trained and validated.") },
      { _key: "sf3", _type: "localeFaq", question: ls("How accurate are AI football betting predictions?"), answer: lt("Accuracy depends on the league, the market and the model. Our AI betting predictions are continuously benchmarked against closing lines and logged in our public track record. You can see the exact hit-rate, ROI and confidence distribution of every model we run - no cherry-picking, no hidden losses.") },
      { _key: "sf4", _type: "localeFaq", question: ls("Which models power BetsPlug predictions?"), answer: lt("We combine Elo ratings, Poisson goal models, and machine-learning classifiers trained on hundreds of thousands of historical matches. Each prediction includes win probability, expected goals, confidence score, and edge over the current bookmaker line.") },
      { _key: "sf5", _type: "localeFaq", question: ls("Can I use AI for football betting research?"), answer: lt("Absolutely. Thousands of data-driven bettors use BetsPlug as their research layer: compare our AI predictions against bookmaker odds, filter by confidence, backtest strategies, and identify value bets before the market corrects.") },
      { _key: "sf6", _type: "localeFaq", question: ls("Do I need a subscription to see AI picks?"), answer: lt("We offer a free tier with daily AI football picks so you can try the platform. For full access to live probabilities, strategy backtesting and the complete track record, check our subscription plans.") },
      { _key: "sf7", _type: "localeFaq", question: ls("Can I cancel my subscription anytime?"), answer: lt("Yes. All plans are month-to-month with no long-term commitment. You can cancel anytime from your account dashboard and keep access until the end of your current billing period.") },
      { _key: "sf8", _type: "localeFaq", question: ls("Do you offer refunds?"), answer: lt("We offer a 14-day money-back guarantee on all paid plans under EU consumer law. If BetsPlug isn't right for you, contact support within the first 14 days and we'll issue a full refund - no questions asked. Platinum Lifetime is final-sale after the 14-day window.") },
      { _key: "sf9", _type: "localeFaq", question: ls("Is BetsPlug a betting or gambling website?"), answer: lt("No. BetsPlug is a data analytics platform for football fans, traders and researchers. We provide AI football predictions, statistics and insights. You cannot gamble, deposit or place bets on BetsPlug - we exist to inform your decisions, not to take them.") },
      { _key: "sfa", _type: "localeFaq", question: ls("How is my data protected?"), answer: lt("Your data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never sell or share personal information, and we process payments through PCI-compliant providers so we never store your card details on our servers.") },
      { _key: "sfb", _type: "localeFaq", question: ls("Where does your football data come from?"), answer: lt("We aggregate data from licensed football data providers, official league feeds, and public statistical sources. Every data point feeding our models is verified and timestamped for full reproducibility in our track record.") },
    ],
  });
  console.log("✅ Homepage");

  // ── Pricing Config ────────────────────────────────────
  await client.createOrReplace({
    _id: "pricingConfig",
    _type: "pricingConfig",
    plans: [
      {
        _key: "bronze",
        planId: "bronze",
        name: ls("Bronze"),
        monthlyPrice: 0.01,
        yearlyPrice: 0.01,
        features: [
          { _key: "bf1", ...ls("3 daily AI picks") },
          { _key: "bf2", ...ls("Public track record access") },
          { _key: "bf3", ...ls("Community access") },
          { _key: "bf4", ...ls("Weekly digest email") },
          { _key: "bf5", ...ls("7-day Gold trial included") },
        ],
        highlighted: false,
      },
      {
        _key: "silver",
        planId: "silver",
        name: ls("Silver"),
        monthlyPrice: 9.99,
        yearlyPrice: 7.99,
        features: [
          { _key: "sf1", ...ls("Full prediction feed") },
          { _key: "sf2", ...ls("ROI dashboard") },
          { _key: "sf3", ...ls("Value alerts") },
          { _key: "sf4", ...ls("All Bronze features") },
          { _key: "sf5", ...ls("Priority email support") },
        ],
        highlighted: false,
      },
      {
        _key: "gold",
        planId: "gold",
        name: ls("Gold"),
        monthlyPrice: 14.99,
        yearlyPrice: 11.99,
        badge: ls("Most Popular"),
        features: [
          { _key: "gf1", ...ls("Premium high-confidence picks") },
          { _key: "gf2", ...ls("Full analytics suite") },
          { _key: "gf3", ...ls("Strategy backtesting") },
          { _key: "gf4", ...ls("Telegram alerts") },
          { _key: "gf5", ...ls("All Silver features") },
          { _key: "gf6", ...ls("Priority support") },
        ],
        highlighted: true,
      },
      {
        _key: "platinum",
        planId: "platinum",
        name: ls("Platinum Lifetime"),
        monthlyPrice: 199,
        yearlyPrice: 199,
        features: [
          { _key: "pf1", ...ls("Lifetime access to everything") },
          { _key: "pf2", ...ls("Every current and future feature") },
          { _key: "pf3", ...ls("Founding member perks") },
          { _key: "pf4", ...ls("Private community channel") },
          { _key: "pf5", ...ls("Direct line to founders") },
        ],
        highlighted: false,
      },
    ],
  });
  console.log("✅ Pricing Config");

  // ── About Page ────────────────────────────────────────
  await client.createOrReplace({
    _id: "aboutPage",
    _type: "aboutPage",
    founders: [
      { _key: "f1", name: "Cas", initial: "C", role: ls("Co-founder · Product & Growth"), bio: lt("Lifelong football fan with an entrepreneurial background, a knack for new ideas and solid marketing + IT skills. Keeps BetsPlug running and makes sure match data flows cleanly from the source all the way to your screen.") },
      { _key: "f2", name: "Dennis", initial: "D", role: ls("Co-founder · Data & Modelling"), bio: lt("Football enthusiast and data-driven thinker with years of accountancy experience, where numbers and evidence call the shots. Turns probabilities, models and statistics into insights you can actually use.") },
    ],
    stats: [
      { _key: "s1", value: "70,000+", label: ls("Historical matches the models are trained on") },
      { _key: "s2", value: "450+", label: ls("Matches analyzed every week") },
      { _key: "s3", value: "1,200+", label: ls("Data points evaluated per match") },
      { _key: "s4", value: "4", label: ls("AI models running in production") },
    ],
    values: [
      { _key: "v1", title: ls("Data over gut feeling"), description: lt("Every prediction is backed by statistical models, not opinions."), icon: "Brain" },
      { _key: "v2", title: ls("Full transparency"), description: lt("Our track record is public. Every pick logged, nothing hidden."), icon: "Eye" },
      { _key: "v3", title: ls("Continuous improvement"), description: lt("Models are retrained and recalibrated after every matchday."), icon: "RefreshCw" },
      { _key: "v4", title: ls("Fair and honest"), description: lt("No hype, no fake guarantees. Just probabilities and expected value."), icon: "Scale" },
    ],
  });
  console.log("✅ About Page");

  // ── Thank You Page ────────────────────────────────────
  await client.createOrReplace({
    _id: "thankYouPage",
    _type: "thankYouPage",
    planFeatures: [
      {
        _key: "bronze",
        planId: "bronze",
        features: [
          { _key: "bf1", title: ls("Daily free picks"), body: lt("Get our top 3 value picks each morning, hand-picked and graded by our models.") },
          { _key: "bf2", title: ls("Community access"), body: lt("Join thousands of members discussing picks and swapping insights in real time.") },
          { _key: "bf3", title: ls("Weekly digest"), body: lt("A clean summary of last week's ROI, hit rate and best segments - straight to your inbox.") },
        ],
      },
      {
        _key: "silver",
        planId: "silver",
        features: [
          { _key: "sf1", title: ls("Full prediction feed"), body: lt("Unlimited access to every tip, across every league - updated multiple times per day.") },
          { _key: "sf2", title: ls("ROI dashboard"), body: lt("Track your profit curve, bankroll and per-league performance with pro-grade analytics.") },
          { _key: "sf3", title: ls("Value alerts"), body: lt("Get notified the moment a pick with +EV drops so you can lock in the best odds.") },
        ],
      },
      {
        _key: "gold",
        planId: "gold",
        features: [
          { _key: "gf1", title: ls("Premium picks"), body: lt("Our highest-confidence plays - smaller list, bigger edge. Every pick is model-backed.") },
          { _key: "gf2", title: ls("Full analytics suite"), body: lt("Deep calibration, segment ROI, bankroll planning and backtests. No feature locked.") },
          { _key: "gf3", title: ls("Priority support"), body: lt("Direct line to the team, plus early access to new models and betting tools.") },
        ],
      },
      {
        _key: "platinum",
        planId: "platinum",
        features: [
          { _key: "pf1", title: ls("Lifetime access"), body: lt("Pay once, win forever. Every current and future BetsPlug feature included, always.") },
          { _key: "pf2", title: ls("Every add-on included"), body: lt("Telegram alerts, Tip of the Day, premium reports - nothing to upgrade, ever.") },
          { _key: "pf3", title: ls("Founding member perks"), body: lt("Name on the wall of legends, private community channel and direct line to the founders.") },
        ],
      },
    ],
  });
  console.log("✅ Thank You Page");

  // ── B2B Page (USP values only) ────────────────────────
  await client.createOrReplace({
    _id: "b2bPage",
    _type: "b2bPage",
    usps: [
      { _key: "u1", value: "4", label: ls("AI models in production") },
      { _key: "u2", value: "15+", label: ls("Football leagues covered") },
      { _key: "u3", value: "1,500+", label: ls("Active subscribers") },
      { _key: "u4", value: "100%", label: ls("Transparent track record") },
    ],
  });
  console.log("✅ B2B Page");

  // ── Empty singletons (content comes from i18n, schema ready for future) ──
  for (const [id, type, label] of [
    ["howItWorksPage", "howItWorksPage", "How It Works"],
    ["contactPage", "contactPage", "Contact"],
    ["welcomePage", "welcomePage", "Welcome"],
    ["checkoutPage", "checkoutPage", "Checkout"],
    ["trackRecordPage", "trackRecordPage", "Track Record"],
  ] as const) {
    await client.createOrReplace({ _id: id, _type: type });
    console.log(`✅ ${label} (empty shell — content in i18n)`);
  }

  console.log("\n🎉 All page singletons migrated!");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
