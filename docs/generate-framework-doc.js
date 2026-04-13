const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition,
} = require("docx");

const BLUE = "1a365d";
const LIGHT_BLUE = "e8f0fe";
const GRAY = "f7f7f7";
const border = { style: BorderStyle.SINGLE, size: 1, color: "cccccc" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: BLUE })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: BLUE })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: "Arial" })],
  });
}
function boldP(label, value) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: "Arial" }),
      new TextRun({ text: value, size: 22, font: "Arial" }),
    ],
  });
}

function makeRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: i === 0 ? 4500 : 4526, type: WidthType.DXA },
      shading: { fill: isHeader ? LIGHT_BLUE : "ffffff", type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({
        children: [new TextRun({ text: String(text), size: 20, font: "Arial", bold: isHeader })],
      })],
    })),
  });
}

function table2col(rows) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [4500, 4526],
    rows: rows.map((r, i) => makeRow(r, i === 0)),
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ── COVER PAGE ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 4000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } },
          children: [new TextRun({ text: "BetsPlug", size: 72, bold: true, font: "Arial", color: BLUE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Technical & Legal Framework", size: 40, font: "Arial", color: "444444" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "AI-Powered Football Prediction Platform", size: 24, font: "Arial", color: "666666", italics: true })],
        }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "CONFIDENTIAL", size: 20, bold: true, font: "Arial", color: "cc0000" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "For Authorized Stakeholders Only", size: 20, font: "Arial", color: "666666" })],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Version 7.0  |  April 2026", size: 22, font: "Arial", color: "444444" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "BetsPlug B.V.", size: 22, bold: true, font: "Arial", color: BLUE })],
        }),
      ],
    },

    // ── MAIN CONTENT ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
            children: [
              new TextRun({ text: "BetsPlug \u2014 Technical & Legal Framework", size: 18, font: "Arial", color: "999999", italics: true }),
              new TextRun({ text: "\tv7.0", size: 18, font: "Arial", color: "999999" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: "cccccc", space: 4 } },
            children: [
              new TextRun({ text: "Confidential \u2014 BetsPlug B.V.", size: 16, font: "Arial", color: "999999" }),
              new TextRun({ text: "\tPage " }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      children: [
        // 1. Executive Summary
        h1("1. Executive Summary"),
        p("BetsPlug is an AI-driven football prediction platform designed exclusively for educational and simulation purposes. The platform does NOT facilitate gambling, accept wagers, or process betting transactions. All predictions are clearly labeled as simulations with mandatory disclaimers displayed on every output."),
        p("The prediction engine uses a statistically validated ensemble of mathematical models, rigorously evaluated against historical data with strict temporal separation between training and validation periods. A grid search across 1,295 weight configurations confirmed the optimal model setup, validated on out-of-sample 2026 data."),

        // 2. Platform Overview
        h1("2. Platform Overview"),
        table2col([
          ["Component", "Details"],
          ["Architecture", "Next.js 14 frontend, FastAPI (Python) backend"],
          ["Subscription Tiers", "Free, Silver, Gold, Platinum"],
          ["League Coverage", "24 football leagues worldwide"],
          ["Data Sources", "API-Football (Pro), Football-Data.org, The Odds API"],
          ["Infrastructure", "Railway (backend), Vercel (frontend), PostgreSQL, Redis"],
          ["Payments", "Stripe (PCI-DSS compliant, no card data stored)"],
        ]),

        // 3. Prediction Engine
        h1("3. Prediction Engine \u2014 Technical Specification"),

        h2("3.1 Model Architecture"),
        p("The engine employs a weighted ensemble of two active statistical models:"),
        bullet("Elo Rating System (weight: 1.2) \u2014 Adaptive team strength ratings with 65-point home advantage calibration, point-in-time enforcement, and K-factor of 20."),
        bullet("Logistic Regression (weight: 2.0) \u2014 43-feature classifier trained on historical match data including team form, head-to-head records, league standings, and Elo differentials."),
        p("Two additional models (Poisson and XGBoost) were evaluated but disabled after grid search optimization demonstrated they introduce noise without improving accuracy."),

        h2("3.2 Anti-Leakage Safeguards"),
        p("Data integrity is enforced through multiple safeguards to prevent future information from contaminating predictions:"),
        bullet("Elo ratings: queried with strict effective_at < kickoff temporal filter"),
        bullet("FeatureLeakageError: runtime exception raised if any data integrity violation is detected"),
        bullet("Team form: filtered with before=scheduled_at to ensure only pre-match data"),
        bullet("Head-to-head: restricted to historical encounters only"),
        bullet("All 43 features verified as point-in-time safe through code-level enforcement"),

        h2("3.3 Prediction Source Classification"),
        p("Every prediction is immutably classified at creation time:"),
        table2col([
          ["Field", "Description"],
          ["prediction_source", "'live' (pre-match) or 'backtest' (retroactive simulation)"],
          ["locked_at", "Timestamp proof when live prediction was frozen"],
          ["match_scheduled_at", "Immutable snapshot of kickoff time at prediction moment"],
          ["lead_time_hours", "Hours before kickoff the prediction was generated"],
          ["closing_odds_snapshot", "Bookmaker odds and value analysis at prediction time"],
        ]),

        h2("3.4 Validated Performance Metrics"),
        p("Optimization was performed via exhaustive grid search across 1,295 weight configurations on 6,502 evaluated predictions:"),
        table2col([
          ["Metric", "Value"],
          ["Configurations tested", "1,295"],
          ["Total predictions evaluated", "6,502"],
          ["Backtest accuracy (Aug 2024 \u2013 Dec 2025)", "50.4% (3,743 predictions)"],
          ["Validation accuracy (Jan 2026 \u2013 Apr 2026)", "48.9% (2,759 predictions)"],
          ["BOTD backtest accuracy", "70.1% (432 picks)"],
          ["BOTD validation accuracy", "71.1% (232 picks)"],
          ["Random baseline (3-way)", "33.3%"],
          ["Backtest-validation gap", "1.5 percentage points (no overfitting)"],
        ]),

        // 4. Data Integrity
        h1("4. Data Integrity & Transparency"),

        h2("4.1 Two-Track Record System"),
        bullet("Live track record: only genuine pre-match predictions with timestamp proof"),
        bullet("Backtest track record: historical simulations clearly labeled as such"),
        bullet("API filtering: ?source=live or ?source=backtest for all metrics endpoints"),
        bullet("CSV export: includes prediction source, lead time, and all evaluation metrics"),

        h2("4.2 Financial Calculations"),
        bullet("P/L calculated exclusively with real bookmaker odds from licensed data sources"),
        bullet("No circular implied-odds calculations (model evaluating itself)"),
        bullet("When no real odds are available, P/L is reported as null, not estimated"),
        bullet("Odds coverage percentage disclosed transparently for every metric"),

        h2("4.3 Mandatory Disclaimers"),
        p("Every API response and UI component carrying prediction data includes:", { italics: true }),
        p("\"SIMULATION / EDUCATIONAL USE ONLY. These probability estimates are generated by a statistical model for research and educational purposes. They do NOT constitute financial, betting, or investment advice. Past model performance is not indicative of future results. Always gamble responsibly and within applicable laws.\"", { italics: true, size: 20 }),

        // 5. Legal Framework
        h1("5. Legal Framework"),

        h2("5.1 Regulatory Classification"),
        p("BetsPlug provides statistical analysis and educational content. It is expressly NOT:"),
        bullet("A gambling operator \u2014 no wagers are accepted or facilitated"),
        bullet("A tipster service \u2014 no returns are guaranteed or implied"),
        bullet("Financial advice \u2014 no investment or betting guidance is provided"),
        p("The platform operates as an information and analytics service under applicable EU Digital Services Act provisions and national information service regulations."),

        h2("5.2 Responsible Gambling Compliance"),
        bullet("Mandatory simulation/educational disclaimer on all prediction outputs"),
        bullet("No guarantee of accuracy or profitability \u2014 explicitly disclaimed"),
        bullet("\"Past performance is not indicative of future results\" messaging"),
        bullet("Age verification (18+) required for subscription purchases via Stripe"),
        bullet("Self-exclusion: users can delete accounts and all associated data"),

        h2("5.3 Data Protection (GDPR)"),
        p("The platform processes minimal personal data in compliance with GDPR:"),
        table2col([
          ["Data Category", "Processing Basis"],
          ["Email, username", "Contract performance (account creation)"],
          ["Subscription status", "Contract performance"],
          ["Abandoned checkout email", "Legitimate interest (single reminder)"],
          ["Payment data", "NOT stored \u2014 processed by Stripe (PCI-DSS Level 1)"],
          ["Prediction history", "Contract performance (service delivery)"],
        ]),
        bullet("Right to erasure: users can delete accounts via settings or GDPR request"),
        bullet("Data processing: EU-based infrastructure (Railway EU, Vercel EU edge)"),
        bullet("No profiling for automated decision-making affecting users"),

        h2("5.4 Intellectual Property"),
        bullet("Prediction engine: proprietary ensemble methodology developed in-house"),
        bullet("Training data: licensed from API-Football (Pro tier commercial license)"),
        bullet("Supplementary data: Football-Data.org (attribution license)"),
        bullet("Odds data: licensed from The Odds API (commercial subscription)"),
        bullet("All third-party data used within respective license terms"),

        // 6. Risk Disclosure
        h1("6. Risk Disclosure"),
        p("Users and stakeholders must understand the following inherent limitations:"),
        bullet("Predictions are probabilistic estimates derived from historical patterns, not certainties"),
        bullet("Historical accuracy (48.9% overall, 71.1% BOTD) does not guarantee future performance"),
        bullet("Models may underperform during atypical conditions (e.g., pandemic disruptions, player strikes, rule changes)"),
        bullet("League-level accuracy varies: top-6 European leagues achieve approximately 50%, while lower-tier leagues average approximately 40%"),
        bullet("Users should never stake money they cannot afford to lose"),
        bullet("BetsPlug accepts no liability for financial losses arising from the use of its predictions"),

        // 7. Audit Trail
        h1("7. Audit Trail & Reproducibility"),
        p("The platform maintains a comprehensive audit trail for every prediction:"),
        bullet("Immutable prediction record: timestamp, model version, 43-feature snapshot, raw model output"),
        bullet("Evaluation records: link predictions to actual match outcomes with Brier score and log-loss"),
        bullet("Full reproducibility: given identical features, the model produces identical output"),
        bullet("Version control: all model changes documented in git history with commit messages"),
        bullet("Database migrations: schema changes tracked via Alembic with up/down reversibility"),

        // 8. Contact
        h1("8. Contact & Governance"),
        table2col([
          ["Item", "Details"],
          ["Legal Entity", "BetsPlug B.V."],
          ["Website", "https://betsplug.com"],
          ["Technical Contact", "Via contact page"],
          ["Data Protection", "GDPR requests via contact page"],
          ["Document Version", "7.0 (April 2026)"],
        ]),

        new Paragraph({ spacing: { before: 600 } }),
        p("\u2014 End of Document \u2014", { italics: true, color: "999999" }),
      ],
    },
  ],
});

const OUTPUT = "C:\\Users\\denni\\Documents\\Claude coding\\Sportbetting\\docs\\BetsPlug-Technical-Legal-Framework.docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Created: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}).catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
