const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition,
} = require("docx");

const BLUE = "1a365d";
const LIGHT_BLUE = "e8f0fe";
const GRAY_BG = "f5f5f5";
const GREEN_BG = "e6f4ea";
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
    spacing: { after: 140, line: 320 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80, line: 320 },
    children: [new TextRun({ text, size: 22, font: "Arial" })],
  });
}
function explainBox(text) {
  return new Paragraph({
    spacing: { before: 80, after: 160, line: 320 },
    shading: { fill: GRAY_BG, type: ShadingType.CLEAR },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: "What does this mean? ", bold: true, size: 20, font: "Arial", color: BLUE }),
      new TextRun({ text, size: 20, font: "Arial", color: "444444" }),
    ],
  });
}
function qualityBox(text) {
  return new Paragraph({
    spacing: { before: 80, after: 160, line: 320 },
    shading: { fill: GREEN_BG, type: ShadingType.CLEAR },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: "Quality requirement: ", bold: true, size: 20, font: "Arial", color: "1e6b3a" }),
      new TextRun({ text, size: 20, font: "Arial", color: "444444" }),
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
    // ── COVER ──
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
          children: [new TextRun({ text: "Version 8.0  |  April 2026", size: 22, font: "Arial", color: "444444" })],
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
              new TextRun({ text: "\tv8.0", size: 18, font: "Arial", color: "999999" }),
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
        p("BetsPlug is an online platform that uses artificial intelligence (AI) to predict the outcomes of football matches. The platform is intended exclusively for educational and informational purposes. BetsPlug does not organise gambling activities, accept wagers, or process any betting transactions."),
        p("The system has been trained on 43,257 real matches from 30 different competitions, collected over 5.5 years (August 2020 \u2014 April 2026). All data comes from a single licensed professional data source (API-Football Pro). No external or random data is used."),
        p("To prove reliability, the system has been tested via \u201Cwalk-forward validation\u201D: the model is trained on past data and tested on matches it has never seen before. This test was performed on 28,838 matches across 4 separate periods. Results are consistent and honest \u2014 no data leakage, no use of future information."),
        p("On high-confidence predictions (confidence \u2265 70%), the model achieves 74.4% accuracy on 2,473 test picks \u2014 a professional level by international benchmarks.", { bold: true }),

        // 2. Platform Overview
        h1("2. What is BetsPlug?"),
        p("BetsPlug is a web application where users log in to view AI-generated football predictions. The platform operates as a subscription service with multiple tiers:"),
        table2col([
          ["Component", "Description"],
          ["Free tier", "Limited access: daily Pick of the Day, basic statistics"],
          ["Silver / Gold / Platinum", "Extended access: confidence-based filtering, full track record, exports"],
          ["Competitions", "30 football leagues worldwide, including Eredivisie, Premier League, Champions League, Saudi Pro League"],
          ["Data source", "API-Football Pro exclusively (licensed, paid subscription)"],
          ["Payments", "Via Stripe \u2014 BetsPlug does not store credit card data"],
        ]),
        explainBox("BetsPlug is comparable to a weather station that forecasts the weather: it provides estimates based on data, but cannot guarantee the weather. Similarly, BetsPlug estimates match outcomes but does not guarantee results."),

        // 3. How prediction works
        h1("3. How does the prediction work?"),

        h2("3.1 The models \u2014 how is a prediction made?"),
        p("The system combines multiple mathematical models, each looking at match data from a different angle. By merging these perspectives, a more accurate prediction emerges than any single model could produce."),

        p("Model 1: Elo Rating System", { bold: true }),
        p("Each team receives an \u201CElo score\u201D \u2014 a number indicating team strength. The more matches a team wins (especially against strong opponents), the higher the score. The system compares Elo scores of both teams to determine the favourite. All Elo scores are built chronologically from 43,257 historical matches."),

        p("Model 2: Logistic Regression", { bold: true }),
        p("This model looks at 39 different factors simultaneously: last 5 matches form, home/away specific performance, head-to-head record, season statistics, rest days between matches, scoring consistency. The model has learned from thousands of historical matches which combination of factors best predicts outcomes."),

        p("Model 3: XGBoost (Gradient Boosting)", { bold: true }),
        p("An advanced machine learning model that can find non-linear patterns among the 39 factors. While Logistic Regression only sees linear relationships, XGBoost detects complex interactions (e.g., \u201Ca strong home team against a tired away side with short rest\u201D)."),

        p("The three models are merged using weights. The ratio (Elo 1.2, Logistic 2.0, XGBoost 1.0) was determined through scientific validation on the historical dataset."),

        explainBox("Imagine asking three experts who will win a match. Expert 1 (Elo) only looks at overall team strength. Expert 2 (Logistic) looks at 39 details. Expert 3 (XGBoost) searches for complex patterns. You listen to all three but give Expert 2 more weight because they\u2019re most often right. That\u2019s what BetsPlug does."),

        h2("3.2 Anti-leakage protection"),
        p("A major risk in prediction systems is accidentally using information that was not available at the time of prediction. For example: if the system knew the outcome of a match while predicting it, that would be cheating."),
        p("BetsPlug has multiple layers of protection against this:"),
        bullet("Team strengths (Elo scores) are only calculated up to the moment BEFORE kickoff \u2014 never after"),
        bullet("Team form (last 5/10 matches) only includes matches played before the target match"),
        bullet("Head-to-head data contains only previous encounters, never the match itself"),
        bullet("Season statistics (goals, win rate) are calculated \u201Cpoint-in-time\u201D: only from matches before kickoff"),
        bullet("The system has a built-in \u201Ctripwire\u201D: if future data is accidentally used, it stops with an error (FeatureLeakageError)"),
        p("The absence of leakage is proven via three independent control tests (see section 9, Quality Requirements)."),
        explainBox("This is comparable to a school test: if a student already knows the answers, the test isn\u2019t fair. BetsPlug ensures the system can never see the \u201Canswers\u201D (match outcome) before making its prediction."),

        h2("3.3 Walk-forward validation"),
        p("The model is tested via \u201Cwalk-forward validation\u201D, the gold standard in statistics for time-dependent data:"),
        bullet("Period 1: train on matches before Dec 2021, test on Dec 2021 \u2014 Sep 2022"),
        bullet("Period 2: train on all before Sep 2022, test on Sep 2022 \u2014 Jul 2023"),
        bullet("Period 3: train on all before Jul 2023, test on Jul 2023 \u2014 Apr 2024"),
        bullet("Period 4: train on all before Apr 2024, test on Apr 2024 \u2014 Apr 2026"),
        p("For each period, the model is completely retrained without access to test data. Results from all 4 periods are combined into one total score."),
        explainBox("Instead of one big test, we give the system four separate tests over 2.5 years. This proves the system doesn\u2019t just get lucky once \u2014 it performs consistently across different time periods."),

        h2("3.4 How well does the system perform?"),
        p("The system has been tested on 28,838 matches it had never seen. Results:"),
        table2col([
          ["Metric", "Result"],
          ["Total test picks (walk-forward)", "28,838 matches across 4 periods"],
          ["Random guessing (home/draw/away)", "33.3%"],
          ["Always predict \u201Chome\u201D", "43.5% (most common outcome)"],
          ["All predictions included", "49.2%"],
          ["Confidence \u2265 50%", "58.9% on 12,735 picks"],
          ["Confidence \u2265 55%", "63.0% on 8,951 picks"],
          ["Confidence \u2265 60%", "67.4% on 6,060 picks"],
          ["Confidence \u2265 65%", "70.6% on 3,942 picks"],
          ["Confidence \u2265 70%", "74.4% on 2,473 picks"],
          ["Confidence \u2265 75% (Premium picks)", "78.2% on 1,497 picks"],
        ]),
        p("The system uses a \u201Cconfidence filter\u201D: only predictions the model is very sure about are shown as premium picks. The higher the threshold, the more accurate the prediction, but fewer matches qualify."),
        explainBox("In football there are three possible outcomes: home win, draw, or away win. Random guessing gives you 33%. BetsPlug scores 74.4% on high-confidence predictions (\u2265 70%) \u2014 more than twice as good as guessing. This is comparable to professional prediction services at international level."),

        // 4. Fairness & Transparency
        h1("4. Fairness & Transparency"),

        h2("4.1 Two separate track records"),
        p("BetsPlug maintains two separate scoreboards:"),
        bullet("Live track record: only predictions demonstrably made BEFORE the match, with timestamp proof"),
        bullet("Backtest track record: historical simulations from walk-forward validation, clearly labelled as such"),
        p("Users can filter via the website which type they want to see. CSV exports always include the source (live or backtest), hours before kickoff, and all evaluation data."),

        h2("4.2 Honest financial calculations"),
        p("Win/loss calculations are made exclusively using real bookmaker odds from licensed data sources. The system does NOT calculate fake profit based on its own probability estimates \u2014 that would amount to self-grading."),
        bullet("When real odds are available: P/L is calculated using those odds"),
        bullet("When real odds are unavailable: P/L is reported as \u201Cunknown\u201D, not estimated"),
        bullet("Every metric notes what percentage of picks had real odds"),
        explainBox("Suppose the model says \u201C60% chance home win\u201D. If we then compute odds ourselves (1/0.60 = 1.67) and say \u201Cwe made a profit!\u201D, the model is grading itself. BetsPlug doesn\u2019t do this \u2014 we only use real bookmaker odds."),

        h2("4.3 Mandatory disclaimers"),
        p("Every prediction BetsPlug displays includes the following disclaimer:"),
        p("\u201CSIMULATION / EDUCATIONAL USE ONLY. These probability estimates are generated by a statistical model for research and educational purposes. They do NOT constitute financial, gambling, or investment advice. Past performance does not guarantee future results. Always gamble responsibly and within applicable law.\u201D", { italics: true, size: 20 }),

        // 5. Legal Framework
        h1("5. Legal Framework"),

        h2("5.1 What BetsPlug IS and IS NOT"),
        p("BetsPlug is an information service offering statistical analyses. It is important to understand what the platform IS and IS NOT:"),
        table2col([
          ["BetsPlug IS", "BetsPlug IS NOT"],
          ["An information platform with AI analyses", "A gambling company or casino"],
          ["An educational service on sports statistics", "A tipster service guaranteeing profits"],
          ["A subscription service for data insights", "Financial or investment advice"],
        ]),
        p("BetsPlug does not accept bets, does not organise wagers, and does not facilitate gambling activities in any way. The platform falls under the EU Digital Services Act as an information service."),

        h2("5.2 Responsible gambling"),
        p("Although BetsPlug is not itself a gambling service, the platform acknowledges that some users may use the information in combination with gambling activities. BetsPlug therefore takes the following measures:"),
        bullet("Mandatory disclaimer on every prediction"),
        bullet("Clear notice that accuracy is not guaranteed"),
        bullet("The message \u201CPast performance does not guarantee future results\u201D"),
        bullet("Age verification (18+) when taking out a subscription"),
        bullet("Self-exclusion option: users can fully delete their account"),

        h2("5.3 Privacy and data protection (GDPR)"),
        p("BetsPlug processes as few personal data as possible, in full compliance with the General Data Protection Regulation (GDPR):"),
        table2col([
          ["What we store", "Why"],
          ["Email address and username", "Required for login and account management"],
          ["Subscription status", "To determine which content is accessible"],
          ["Payment data (credit card, IBAN)", "NOT stored by BetsPlug \u2014 Stripe processes all payments"],
          ["Prediction history", "To show track record and deliver the service"],
        ]),
        bullet("Right to erasure: users can have their account and all data deleted via settings or a GDPR request"),
        bullet("Data processing on European servers (Railway EU, Vercel EU)"),
        bullet("No profiling or automated decision-making that affects users"),

        h2("5.4 Intellectual property and licences"),
        p("The prediction system has been fully developed in-house. The data the system runs on is licensed from one professional data provider:"),
        bullet("API-Football (Pro licence): provides match data, results, team statistics, standings for 30 leagues"),
        p("All data is used within the terms of the licence. No data from unreliable or free sources is used to prevent inconsistencies in the model."),

        // 6. Risk Information
        h1("6. Risk Information"),
        p("It is essential that users and stakeholders understand the limitations of the system:"),
        bullet("Predictions are estimates based on historical patterns \u2014 not certainties. Football is unpredictable and surprises are inevitable."),
        bullet("The fact that the system scored 74% on premium picks in the past does not mean it will do the same in the future. Circumstances change."),
        bullet("The model may underperform in unusual situations, such as pandemics, strikes, or drastic rule changes."),
        bullet("Accuracy differs per competition: some leagues (like the Premier League) are harder to predict than others."),
        bullet("Never use BetsPlug information as the sole basis for financial decisions. Never wager money you cannot afford to lose."),
        bullet("BetsPlug accepts no liability for financial losses arising from the use of its predictions."),
        explainBox("Compare it to a weather forecast: 70% chance of rain means in 3 out of 10 cases it does NOT rain. Even the best prediction is not a guarantee. BetsPlug works the same way \u2014 it provides probabilities, not certainties."),

        // 7. Auditability
        h1("7. Auditability & Traceability"),
        p("Every prediction BetsPlug makes is permanently stored with all underlying data. This allows later verification of exactly how a prediction came about:"),
        bullet("Timestamp: when the prediction was made (proof it was before the match)"),
        bullet("Model version: which version of the system made the prediction"),
        bullet("Feature snapshot: all 39 data points used at that moment"),
        bullet("Raw model output: exact calculations of each submodel (Elo, Logistic, XGBoost)"),
        bullet("Evaluation record: comparison with the actual match result"),
        p("All this data is reproducible: if you provide the same input, you get the same output. All system changes are tracked in a version control system (git)."),

        // 8. Data Quality
        h1("8. Data Quality & Validation"),
        p("BetsPlug applies strict standards for data going into the model. All data comes from a single source (API-Football Pro) to prevent inconsistencies."),
        table2col([
          ["Quality aspect", "Status"],
          ["Data source", "API-Football Pro (licensed, paid subscription)"],
          ["Number of matches", "43,257 finished matches"],
          ["Number of competitions", "30 worldwide"],
          ["Historical depth", "5.5 years (Aug 2020 \u2014 Apr 2026)"],
          ["Number of teams", "1,082 unique teams"],
          ["Point-in-time correctness", "Enforced by FeatureLeakageError tripwire"],
          ["Reproducibility", "100% \u2014 fixed seed for all training"],
        ]),

        // 9. Quality Requirements
        h1("9. Quality Requirements for the Prediction Engine"),
        p("To safeguard the quality and reliability of BetsPlug, the platform applies the following quality requirements. Every future engine change must meet these requirements before going live."),

        h2("9.1 Training data requirements"),
        qualityBox("Data comes exclusively from one licensed paid source (API-Football Pro). No data from free or external sources."),
        qualityBox("At least 20,000 matches in training data across at least 3 seasons."),
        qualityBox("All results must have a \u201Cwinner\u201D field (home/draw/away) matching the scores."),
        qualityBox("Matches with missing scores are excluded from training."),

        h2("9.2 Feature engineering requirements"),
        qualityBox("All features must be \u201Cpoint-in-time\u201D: only data from before kickoff."),
        qualityBox("The FeatureLeakageError tripwire must be active and raise errors on future-data usage attempts."),
        qualityBox("At least 30 features in the model, documented with explanation of what each measures."),
        qualityBox("All features must be deterministic: same input gives same output."),

        h2("9.3 Model training requirements"),
        qualityBox("Train/test split must be temporal (training before test), never random."),
        qualityBox("Minimum 4 walk-forward validation folds."),
        qualityBox("Control tests (shuffled labels, random features) must return majority baseline, not higher."),
        qualityBox("The model must score at least 2 percentage points better than majority class baseline."),
        qualityBox("No hyperparameter tuning on test set (data leakage)."),

        h2("9.4 Production deployment requirements"),
        qualityBox("New model versions may only go live after successful walk-forward validation with sufficient samples."),
        qualityBox("All predictions must be logged with timestamp, model version, and feature snapshot."),
        qualityBox("A prediction made before kickoff is \u201Clive\u201D, all others are \u201Cbacktest\u201D."),
        qualityBox("The model must automatically disable if the health check fails."),

        h2("9.5 User transparency requirements"),
        qualityBox("Every prediction displays the confidence level clearly."),
        qualityBox("The track record page separates live from backtest data."),
        qualityBox("No ROI claims without real bookmaker odds (no fake odds assumption)."),
        qualityBox("Mandatory disclaimer on every prediction."),
        qualityBox("Sample size always mentioned with every accuracy claim."),

        h2("9.6 Auditability requirements"),
        qualityBox("All code changes tracked in git with descriptive commit messages."),
        qualityBox("Every release has an associated validation report."),
        qualityBox("Training data, features, and model parameters always reconstructible."),
        qualityBox("External audit must be possible via read access to database and codebase."),

        h2("9.7 Performance thresholds"),
        p("If performance drops below these values, the model is reviewed:"),
        table2col([
          ["Metric", "Minimum threshold"],
          ["Overall accuracy (all picks)", "\u2265 47%"],
          ["Accuracy at confidence \u2265 60%", "\u2265 60%"],
          ["Accuracy at confidence \u2265 70%", "\u2265 65%"],
          ["Brier score (calibration)", "\u2264 0.22"],
          ["Backtest vs live difference", "\u2264 5 percentage points"],
        ]),

        // 10. Contact
        h1("10. Contact & Organisation"),
        table2col([
          ["Item", "Details"],
          ["Legal entity", "BetsPlug B.V."],
          ["Website", "https://betsplug.com"],
          ["Technical contact", "Via the contact page on the website"],
          ["Privacy requests", "GDPR requests via the contact page"],
          ["Document version", "8.0 (April 2026)"],
          ["Last validation", "15 April 2026 (walk-forward on 28,838 picks)"],
        ]),

        new Paragraph({ spacing: { before: 600 } }),
        p("\u2014 End of document \u2014", { italics: true, color: "999999" }),
      ],
    },
  ],
});

const OUTPUT = "C:\\Users\\denni\\Documents\\Claude coding\\Sportbetting\\docs\\BetsPlug-Technical-Legal-Framework (ENG).docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Created: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}).catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
