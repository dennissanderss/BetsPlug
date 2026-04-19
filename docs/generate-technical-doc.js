const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, TabStopType, TabStopPosition,
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
      new TextRun({ text: "Note: ", bold: true, size: 20, font: "Arial", color: BLUE }),
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
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [
        new Paragraph({ spacing: { before: 4000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } },
          children: [new TextRun({ text: "BetsPlug", size: 72, bold: true, font: "Arial", color: BLUE })],
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "Technical Framework", size: 40, font: "Arial", color: "444444" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
          children: [new TextRun({ text: "Prediction Engine Architecture & Validation", size: 24, font: "Arial", color: "666666", italics: true })] }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "CONFIDENTIAL", size: 20, bold: true, font: "Arial", color: "cc0000" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "For Technical Stakeholders Only", size: 20, font: "Arial", color: "666666" })] }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Version 8.1  |  April 2026", size: 22, font: "Arial", color: "444444" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "BetsPlug B.V.", size: 22, bold: true, font: "Arial", color: BLUE })] }),
      ],
    },

    // ── MAIN CONTENT ──
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: {
        default: new Header({ children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
          children: [
            new TextRun({ text: "BetsPlug \u2014 Technical Framework", size: 18, font: "Arial", color: "999999", italics: true }),
            new TextRun({ text: "\tv8.1", size: 18, font: "Arial", color: "999999" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: "cccccc", space: 4 } },
          children: [
            new TextRun({ text: "Confidential \u2014 BetsPlug B.V.", size: 16, font: "Arial", color: "999999" }),
            new TextRun({ text: "\tPage " }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })] }),
      },
      children: [
        // 1. Executive Summary
        h1("1. Executive Summary"),
        p("This document describes the technical architecture, validation methodology, and operational standards of the BetsPlug prediction engine. It is intended for technical stakeholders: engineers, data scientists, auditors, and operations teams."),
        p("The engine is a stacked ensemble of four machine learning models (Elo, Logistic Regression, XGBoost, Poisson) trained on 55,656 historical football matches across 30 leagues and 6 seasons (August 2020 \u2014 April 2026). All training data comes from a single licensed source: API-Football Pro."),
        p("On premium picks (confidence \u2265 75%), walk-forward validation on 28,838 out-of-sample test picks yields 78.2% accuracy. This is consistent with professional state-of-the-art football prediction systems.", { bold: true }),

        // 2. System Architecture
        h1("2. System Architecture"),

        h2("2.1 Technology Stack"),
        table2col([
          ["Layer", "Technology"],
          ["Backend", "FastAPI (Python 3.11+), SQLAlchemy 2.0 async"],
          ["Database", "PostgreSQL 18.3, 5 GB persistent volume"],
          ["Cache / Queue", "Redis 7 (Celery broker + result backend)"],
          ["Frontend", "Next.js 15, React 19, TypeScript, Tailwind"],
          ["Deployment", "Railway (backend + database + Redis) + Vercel (frontend)"],
          ["Data source", "API-Football Pro (licensed, 7,500 req/day)"],
          ["Payments", "Stripe (SaaS subscription)"],
          ["ML stack", "scikit-learn 1.8, XGBoost 2.1, NumPy 2.2, joblib 1.5"],
        ]),

        h2("2.2 Data Pipeline"),
        p("Data flows through a one-directional pipeline from API-Football Pro to the prediction database:"),
        bullet("Ingestion: Celery task every 5 minutes calls API-Football for upcoming matches, results, and standings"),
        bullet("Storage: PostgreSQL relational schema (42 tables) normalised for fast lookups"),
        bullet("Feature extraction: ForecastService builds 39 point-in-time features per prediction request"),
        bullet("Inference: ProductionV8Model loads pre-trained models from disk (xgboost_model.ubj, logistic_model.pkl)"),
        bullet("Persistence: Predictions written with full feature snapshot, raw submodel outputs, and timestamp proof"),

        h2("2.3 Database Schema Highlights"),
        table2col([
          ["Table", "Purpose"],
          ["matches (55,656 rows)", "Core fixture entity: home/away teams, league, season, scheduled_at"],
          ["match_results", "Final scores + half-time + winner (home/draw/away)"],
          ["predictions (~growing)", "Model output with confidence, probabilities, features snapshot"],
          ["prediction_evaluations", "Correctness + Brier score + log-loss after match ends"],
          ["team_elo_history (111,310)", "Walked-forward Elo snapshots per team per effective_at"],
          ["model_versions", "Ensemble configuration, weights, hyperparameters"],
          ["odds_history", "Pre-match bookmaker odds (when available) for honest P/L calculation"],
        ]),

        // 3. Prediction Engine
        h1("3. Prediction Engine"),

        h2("3.1 Ensemble Architecture"),
        p("The engine blends four complementary sub-models. Final probability is a weighted average of individual model outputs:"),
        table2col([
          ["Model", "Weight", "What it captures"],
          ["Elo Rating", "1.2", "Pairwise team strength, walked-forward from 55k matches"],
          ["Logistic Regression", "~1.2 (via production)", "Linear combinations of 39 features"],
          ["XGBoost", "~1.8 (via production)", "Non-linear interactions among 39 features"],
          ["Poisson (Dixon-Coles)", "0.3", "Goal distribution for exact score forecasting"],
        ]),
        p("The Logistic + XGBoost are combined in ProductionV8Model (internal blend 0.4 / 0.6 based on walk-forward tuning). The combined ProductionV8 weight in the outer ensemble is 3.0 (= 1.2 logistic + 1.8 xgboost equivalent)."),

        h2("3.2 Feature Set (39 features)"),
        p("All features are strictly point-in-time \u2014 only data from before the match kickoff is used:"),
        bullet("Team ratings (3): home_elo, away_elo, elo_diff"),
        bullet("Recent form last 5 (8): ppg, goals_for, goals_against, win_rate for both teams"),
        bullet("Longer form last 10 (4): ppg, goal_diff for both teams"),
        bullet("Momentum last 3 (2): ppg for both teams"),
        bullet("Venue-specific form (4): home-form at home, away-form away"),
        bullet("Head-to-head (3): win rate, total meetings, draw percentage"),
        bullet("Season statistics (6): matches played, goal diff, season win rate"),
        bullet("Scoring consistency (2): standard deviation of goals over last 10"),
        bullet("Clean sheets (2): percentage of clean sheets last 10"),
        bullet("Rest days (2): days since last match"),
        bullet("Derived deltas (3): form_diff, venue_form_diff, goal_diff_diff"),

        h2("3.3 Anti-Leakage Protection"),
        p("Feature leakage is the primary failure mode of sports prediction systems. BetsPlug applies three independent defences:"),
        bullet("Strict temporal filtering: all SQL queries include Match.scheduled_at < kickoff_at"),
        bullet("Elo walked-forward: ratings are stored per effective_at and read with strict < before_date"),
        bullet("FeatureLeakageError tripwire: raises exception if any rating has effective_at >= kickoff; aborts prediction"),
        p("Validated by three control tests (see section 4.2)."),

        // 4. Validation
        h1("4. Validation Methodology"),

        h2("4.1 Walk-Forward Validation"),
        p("The gold standard for time-dependent data. Five sequential train/test folds, each retraining from scratch on expanding historical data:"),
        table2col([
          ["Fold", "Training window", "Test window", "Samples"],
          ["1", "< 2021-12", "2021-12 to 2022-09", "7,209"],
          ["2", "< 2022-09", "2022-09 to 2023-07", "7,209"],
          ["3", "< 2023-07", "2023-07 to 2024-04", "7,209"],
          ["4", "< 2024-04", "2024-04 to 2026-04", "7,211"],
          ["Total", "", "", "28,838 test picks"],
        ]),

        h2("4.2 Leakage Control Tests"),
        p("Three independent tests run to prove the pipeline is clean:"),
        table2col([
          ["Test", "Result", "Interpretation"],
          ["Shuffled labels", "43.5%", "= majority class baseline \u2014 no leakage"],
          ["Random features", "43.5%", "= baseline \u2014 no leakage"],
          ["Real model", "49.9%", "+6.4pp above baseline \u2014 genuine learning"],
        ]),
        p("If leakage were present, shuffled labels or random features would score above the majority class baseline. They do not."),

        h2("4.3 Performance Metrics"),
        p("Walk-forward results on 28,838 out-of-sample test picks (honest temporal validation):"),
        table2col([
          ["Confidence threshold", "Picks", "Accuracy"],
          ["All (no filter)", "28,838", "49.2%"],
          ["\u2265 50%", "12,735", "58.9%"],
          ["\u2265 55%", "8,951", "63.0%"],
          ["\u2265 60%", "6,060", "67.4%"],
          ["\u2265 65%", "3,942", "70.6%"],
          ["\u2265 70%", "2,473", "74.4%"],
          ["\u2265 75% (Premium)", "1,497", "78.2%"],
        ]),
        p("Live v8.1 per-tier accuracy on the post-deploy evaluated set (updated continuously via /api/pricing/comparison):"),
        table2col([
          ["Tier", "League scope", "Confidence floor", "Sample", "Accuracy"],
          ["Platinum", "Top 5 elite", "\u2265 0.75", "840", "82.5%"],
          ["Gold", "Top 10",      "\u2265 0.70", "1,650", "71.7%"],
          ["Silver", "Top 14",    "\u2265 0.65", "3,004", "60%+"],
          ["Free", "Top 14",      "\u2265 0.55", "3,763", "48.4%"],
        ]),
        p("Interpretation: raw accuracy is modest because football 1X2 is hard (33% random baseline, ~50% best-case for all picks). Real value lies in confidence filtering \u2014 the model correctly abstains on uncertain matches. At \u2265 75% confidence, 78.2% walk-forward / 82.5% live-v8.1 accuracy represents a genuine edge."),

        // 5. Deployment & Operations
        h1("5. Deployment & Operations"),

        h2("5.1 Model Deployment Pattern"),
        p("Models are trained offline (via train_and_save.py) and shipped in the repository as binary artifacts. Railway backend loads them at container startup:"),
        bullet("File location: backend/models/{xgboost_model.ubj, logistic_model.pkl, feature_scaler.pkl, feature_names.json}"),
        bullet("Total artifact size: ~2.1 MB"),
        bullet("Loading time at startup: < 1 second"),
        bullet("Models survive container restarts (no in-memory cache to rebuild)"),
        bullet("Version-stable format: XGBoost Booster save_model + joblib for sklearn components"),

        h2("5.2 Automated Prediction Generation"),
        p("APScheduler (running in-process with FastAPI on Railway) generates predictions continuously:"),
        bullet("Every 6 hours: job_sync_data (upcoming + results + standings, 7 leagues per cycle)"),
        bullet("Every 10 minutes: job_generate_predictions (v8.1 forecast for upcoming matches without one)"),
        bullet("Every 20 minutes: job_evaluate_predictions (score finished matches)"),
        bullet("Every 5 minutes: job_generate_historical_predictions (backtest backfill, 100 per batch)"),
        bullet("Immediately after sync: chained generate_predictions so new fixtures never wait a full cycle"),
        p("No manual intervention required. New matches receive v8.1 predictions within 10 minutes of ingestion."),

        h2("5.3 Monitoring"),
        bullet("Health endpoint: GET /api/health returns DB, Redis, API-Football status + row counts"),
        bullet("Structured logging via structlog \u2014 every prediction logs model_version, confidence, features"),
        bullet("Admin dashboard: /admin shows data source health, ingestion runs, API usage"),

        // 6. Data Quality
        h1("6. Data Quality & Validation"),
        p("BetsPlug applies strict standards for data integrity. All data comes from a single source to prevent inconsistencies:"),
        table2col([
          ["Quality aspect", "Status"],
          ["Data source", "API-Football Pro (licensed, paid subscription)"],
          ["Number of matches", "55,656 finished matches"],
          ["Number of competitions", "30 worldwide"],
          ["Historical depth", "5.5 years (Aug 2020 \u2014 Apr 2026)"],
          ["Number of teams", "1,076 unique teams"],
          ["Number of Elo ratings", "111,310 walked-forward ratings"],
          ["Point-in-time correctness", "Enforced by FeatureLeakageError tripwire"],
          ["Reproducibility", "100% \u2014 fixed random seed (42) for all training"],
        ]),

        // 7. Quality Requirements
        h1("7. Engineering Quality Requirements"),
        p("Every engine change must meet these requirements before going live."),

        h2("7.1 Training data requirements"),
        qualityBox("Data comes exclusively from one licensed paid source (API-Football Pro). No data from free or external sources."),
        qualityBox("At least 20,000 matches in training data across at least 3 seasons."),
        qualityBox("All results must have a winner field (home/draw/away) consistent with the scores."),
        qualityBox("Matches with missing scores are excluded from training."),

        h2("7.2 Feature engineering requirements"),
        qualityBox("All features must be point-in-time: only data from before kickoff."),
        qualityBox("The FeatureLeakageError tripwire must be active."),
        qualityBox("At least 30 features in the model, each documented."),
        qualityBox("Deterministic: same input gives same output."),

        h2("7.3 Model training requirements"),
        qualityBox("Train/test split must be temporal (chronological), never random."),
        qualityBox("Minimum 4 walk-forward validation folds."),
        qualityBox("Control tests (shuffled labels, random features) must return majority baseline."),
        qualityBox("The model must score at least 2 percentage points better than majority class baseline."),
        qualityBox("No hyperparameter tuning on the test set."),

        h2("7.4 Production deployment requirements"),
        qualityBox("New model versions may only go live after successful walk-forward validation."),
        qualityBox("All predictions logged with timestamp, model_version_id, feature snapshot."),
        qualityBox("Predictions made before kickoff are tagged source='live', all others source='backtest'."),
        qualityBox("The model must gracefully degrade (fallback to defaults) if files are missing."),

        h2("7.5 Performance thresholds"),
        p("If performance drops below these thresholds, the model is reviewed:"),
        table2col([
          ["Metric", "Minimum threshold"],
          ["Overall accuracy (all picks)", "\u2265 47%"],
          ["Accuracy at confidence \u2265 60%", "\u2265 60%"],
          ["Accuracy at confidence \u2265 70%", "\u2265 65%"],
          ["Brier score (calibration)", "\u2264 0.22"],
          ["Backtest vs live difference", "\u2264 5 percentage points"],
        ]),

        // 8. Auditability
        h1("8. Auditability & Reproducibility"),
        p("Every prediction is reconstructible from source. Key mechanisms:"),
        bullet("Timestamp: predicted_at (when model ran) + locked_at (when prediction was frozen pre-match)"),
        bullet("Model version: foreign key to model_versions.id"),
        bullet("Feature snapshot: full 39-feature vector stored as JSONB"),
        bullet("Raw output: individual submodel outputs (Elo, Logistic, XGBoost, Poisson) stored as JSONB"),
        bullet("Evaluation record: is_correct, brier_score, log_loss after match ends"),
        p("All code changes tracked in git with signed commits. Training scripts + data source + random seed are reproducible."),

        // 9. Contact
        h1("9. Technical Contact"),
        table2col([
          ["Item", "Details"],
          ["Legal entity", "BetsPlug B.V."],
          ["Website", "https://betsplug.com"],
          ["Technical contact", "Via contact page on website"],
          ["Document version", "8.1 (April 2026)"],
          ["Last validation", "April 2026 (walk-forward on 28,838 picks)"],
        ]),

        new Paragraph({ spacing: { before: 600 } }),
        p("\u2014 End of document \u2014", { italics: true, color: "999999" }),
      ],
    },
  ],
});

const OUTPUT = "C:\\Users\\denni\\Documents\\Claude coding\\Sportbetting\\docs\\BetsPlug-Technical-Framework (ENG).docx";
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Created: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}).catch(err => { console.error("Error:", err.message); process.exit(1); });
