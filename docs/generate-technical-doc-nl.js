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

function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: BLUE })] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: BLUE })] }); }
function p(text, opts = {}) { return new Paragraph({ spacing: { after: 140, line: 320 }, children: [new TextRun({ text, size: 22, font: "Arial", ...opts })] }); }
function bullet(text) { return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80, line: 320 }, children: [new TextRun({ text, size: 22, font: "Arial" })] }); }
function qualityBox(text) {
  return new Paragraph({
    spacing: { before: 80, after: 160, line: 320 },
    shading: { fill: GREEN_BG, type: ShadingType.CLEAR },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: "Kwaliteitseis: ", bold: true, size: 20, font: "Arial", color: "1e6b3a" }),
      new TextRun({ text, size: 20, font: "Arial", color: "444444" }),
    ],
  });
}

function makeRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map((text, i) => new TableCell({
      borders, width: { size: i === 0 ? 4500 : 4526, type: WidthType.DXA },
      shading: { fill: isHeader ? LIGHT_BLUE : "ffffff", type: ShadingType.CLEAR }, margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20, font: "Arial", bold: isHeader })] })],
    })),
  });
}

function table2col(rows) {
  return new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: [4500, 4526], rows: rows.map((r, i) => makeRow(r, i === 0)) });
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
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [
        new Paragraph({ spacing: { before: 4000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } },
          children: [new TextRun({ text: "BetsPlug", size: 72, bold: true, font: "Arial", color: BLUE })],
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "Technisch Kader", size: 40, font: "Arial", color: "444444" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
          children: [new TextRun({ text: "Architectuur & Validatie van de Voorspellingsengine", size: 24, font: "Arial", color: "666666", italics: true })] }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "VERTROUWELIJK", size: 20, bold: true, font: "Arial", color: "cc0000" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "Uitsluitend voor technische belanghebbenden", size: 20, font: "Arial", color: "666666" })] }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Versie 8.1  |  April 2026", size: 22, font: "Arial", color: "444444" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "BetsPlug B.V.", size: 22, bold: true, font: "Arial", color: BLUE })] }),
      ],
    },
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
        children: [
          new TextRun({ text: "BetsPlug \u2014 Technisch Kader", size: 18, font: "Arial", color: "999999", italics: true }),
          new TextRun({ text: "\tv8.1", size: 18, font: "Arial", color: "999999" }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      })] }) },
      footers: { default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "cccccc", space: 4 } },
        children: [
          new TextRun({ text: "Vertrouwelijk \u2014 BetsPlug B.V.", size: 16, font: "Arial", color: "999999" }),
          new TextRun({ text: "\tPagina " }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      })] }) },
      children: [
        h1("1. Samenvatting"),
        p("Dit document beschrijft de technische architectuur, validatiemethodologie en operationele normen van de BetsPlug voorspellingsengine. Het is bedoeld voor technische belanghebbenden: engineers, data scientists, auditors en operationele teams."),
        p("De engine is een gestackt ensemble van vier machine learning-modellen (Elo, Logistische Regressie, XGBoost, Poisson) getraind op 55.656 historische voetbalwedstrijden uit 30 competities en 6 seizoenen (augustus 2020 \u2014 april 2026). Alle trainingsdata komt uit \u00E9\u00E9n gelicentieerde bron: API-Football Pro."),
        p("Op premium picks (confidence \u2265 75%) behaalt walk-forward validatie op 28.838 out-of-sample test picks 78,2% nauwkeurigheid. Dit is consistent met professionele state-of-the-art voetbalvoorspelsystemen.", { bold: true }),

        h1("2. Systeemarchitectuur"),

        h2("2.1 Technology Stack"),
        table2col([
          ["Laag", "Technologie"],
          ["Backend", "FastAPI 0.115 (Python 3.12), SQLAlchemy 2 async (asyncpg)"],
          ["Database", "PostgreSQL 16, 5 GB persistent volume"],
          ["Cache / Queue", "Redis 7 (Celery 5 broker + result backend)"],
          ["Frontend", "Next.js 14, React 18, TypeScript, Tailwind"],
          ["Deployment", "Railway (backend + DB + Redis) + Vercel (frontend)"],
          ["Databron", "API-Football Pro (gelicentieerd, 7.500 req/dag)"],
          ["Betalingen", "Stripe (SaaS abonnement)"],
          ["ML stack", "scikit-learn 1.8, XGBoost 2.1, NumPy 2.2, joblib 1.5"],
        ]),

        h2("2.2 Datapipeline"),
        p("Data stroomt door een eenrichtingspijplijn van API-Football Pro naar de voorspellingsdatabase:"),
        bullet("Ingestie: Celery-taak elke 5 minuten haalt aankomende wedstrijden, uitslagen en standen op"),
        bullet("Opslag: PostgreSQL relationele schema (42 tabellen) genormaliseerd voor snelle lookups"),
        bullet("Feature extractie: ForecastService bouwt 39 point-in-time features per voorspelling"),
        bullet("Inferentie: ProductionV8Model laadt voorgetrainde modellen van schijf (xgboost_model.ubj, logistic_model.pkl)"),
        bullet("Persistentie: voorspellingen opgeslagen met feature snapshot, ruwe submodel outputs en tijdstempel"),

        h2("2.3 Database schema highlights"),
        table2col([
          ["Tabel", "Doel"],
          ["matches (55.656 rijen)", "Kern wedstrijd entiteit: home/away teams, league, season, scheduled_at"],
          ["match_results", "Eindscore + rust + winnaar (home/draw/away)"],
          ["predictions (groeit)", "Model output met confidence, kansen, features snapshot"],
          ["prediction_evaluations", "Juistheid + Brier score + log-loss na de wedstrijd"],
          ["team_elo_history (111.310)", "Walked-forward Elo snapshots per team per effective_at"],
          ["model_versions", "Ensemble configuratie, gewichten, hyperparameters"],
          ["odds_history", "Pre-match bookmaker odds voor eerlijke W/V berekening"],
        ]),

        h1("3. Voorspellingsengine"),

        h2("3.1 Ensemble architectuur"),
        p("De engine combineert vier complementaire submodellen. De eindkans is een gewogen gemiddelde:"),
        table2col([
          ["Model", "Gewicht", "Wat het vangt"],
          ["Elo Rating", "1.2", "Teamsterkte per paar, walked-forward uit 55k wedstrijden"],
          ["Logistische Regressie", "~1.2 (via production)", "Lineaire combinaties van 39 features"],
          ["XGBoost", "~1.8 (via production)", "Niet-lineaire interacties tussen 39 features"],
          ["Poisson (Dixon-Coles)", "0.3", "Doelpuntenverdeling voor exacte score-voorspelling"],
        ]),
        p("Logistic + XGBoost zijn gecombineerd in ProductionV8Model (interne mix 0.4 / 0.6 gebaseerd op walk-forward tuning). Het gecombineerde ProductionV8 gewicht in het buiten-ensemble is 3.0."),

        h2("3.2 Feature set (39 features)"),
        p("Alle features zijn strikt point-in-time \u2014 alleen data van v\u00F3\u00F3r de kickoff wordt gebruikt:"),
        bullet("Team ratings (3): home_elo, away_elo, elo_diff"),
        bullet("Recente vorm laatste 5 (8): ppg, doelpunten voor/tegen, winst-rate"),
        bullet("Langere vorm laatste 10 (4): ppg, doelsaldo"),
        bullet("Momentum laatste 3 (2): ppg"),
        bullet("Venue-specifieke vorm (4): thuis-vorm thuis, uit-vorm uit"),
        bullet("Head-to-head (3): win rate, aantal ontmoetingen, gelijkspel percentage"),
        bullet("Seizoensstatistieken (6): gespeeld, doelsaldo, seizoen win-rate"),
        bullet("Scoring consistentie (2): standaarddeviatie goals laatste 10"),
        bullet("Clean sheets (2): percentage nulbeurten laatste 10"),
        bullet("Rust dagen (2): dagen sinds laatste wedstrijd"),
        bullet("Afgeleide verschillen (3): form_diff, venue_form_diff, gd_diff"),

        h2("3.3 Anti-leakage beveiliging"),
        p("Feature leakage is de belangrijkste faalmode van sportvoorspelsystemen. BetsPlug past drie onafhankelijke verdedigingen toe:"),
        bullet("Strikte temporele filtering: alle SQL queries bevatten Match.scheduled_at < kickoff_at"),
        bullet("Elo walked-forward: ratings opgeslagen per effective_at en gelezen met strict < before_date"),
        bullet("FeatureLeakageError tripwire: gooit exception als rating effective_at >= kickoff heeft; stopt voorspelling"),

        h1("4. Validatie methodologie"),

        h2("4.1 Walk-forward validatie"),
        p("De gouden standaard voor tijdsafhankelijke data. Vier sequenti\u00EBle train/test folds:"),
        table2col([
          ["Fold", "Training periode", "Test periode", "Samples"],
          ["1", "< 2021-12", "2021-12 tot 2022-09", "7.209"],
          ["2", "< 2022-09", "2022-09 tot 2023-07", "7.209"],
          ["3", "< 2023-07", "2023-07 tot 2024-04", "7.209"],
          ["4", "< 2024-04", "2024-04 tot 2026-04", "7.211"],
          ["Totaal", "", "", "28.838 test picks"],
        ]),

        h2("4.2 Leakage controle-tests"),
        p("Drie onafhankelijke tests bewijzen dat de pipeline eerlijk is:"),
        table2col([
          ["Test", "Resultaat", "Interpretatie"],
          ["Shuffled labels", "43,5%", "= majority class baseline \u2014 geen leakage"],
          ["Random features", "43,5%", "= baseline \u2014 geen leakage"],
          ["Echt model", "49,9%", "+6,4pp boven baseline \u2014 echt leren"],
        ]),

        h2("4.3 Prestatiemetrieken"),
        p("Walk-forward resultaten op 28.838 out-of-sample test picks (eerlijke temporele validatie):"),
        table2col([
          ["Confidence drempel", "Picks", "Nauwkeurigheid"],
          ["Alle (geen filter)", "28.838", "49,2%"],
          ["\u2265 50%", "12.735", "58,9%"],
          ["\u2265 55%", "8.951", "63,0%"],
          ["\u2265 60%", "6.060", "67,4%"],
          ["\u2265 65%", "3.942", "70,6%"],
          ["\u2265 70%", "2.473", "74,4%"],
          ["\u2265 75% (Premium)", "1.497", "78,2%"],
        ]),
        p("Live v8.1 nauwkeurigheid per tier op de post-deploy ge\u00ebvalueerde set (continu bijgewerkt via /api/pricing/comparison):"),
        table2col([
          ["Tier", "Competities", "Confidence floor", "Steekproef", "Nauwkeurigheid"],
          ["Platinum", "Top 5 elite", "\u2265 0,75", "840", "82,5%"],
          ["Gold", "Top 10",       "\u2265 0,70", "1.650", "71,7%"],
          ["Silver", "Top 14",     "\u2265 0,65", "3.004", "60%+"],
          ["Bronze (Free)", "Top 14", "\u2265 0,55", "3.763", "48,4%"],
        ]),
        p("Interpretatie: ruwe nauwkeurigheid is bescheiden omdat voetbal 1X2 moeilijk is (33% willekeurig, ~50% best case). Echte waarde ligt in confidence filtering \u2014 het model onthoudt zich bij onzekere wedstrijden. Bij \u2265 75% confidence levert 78,2% walk-forward / 82,5% live-v8.1 nauwkeurigheid een echte edge op."),

        h1("5. Deployment & Operations"),

        h2("5.1 Model deployment patroon"),
        p("Modellen worden offline getraind (via train_and_save.py) en als binaire artifacten meegeleverd in de repo. Railway backend laadt ze bij container startup:"),
        bullet("Bestandslocatie: backend/models/{xgboost_model.ubj, logistic_model.pkl, feature_scaler.pkl, feature_names.json}"),
        bullet("Totale artifact grootte: ~2,1 MB"),
        bullet("Laadtijd bij opstart: < 1 seconde"),
        bullet("Modellen overleven container restarts (geen in-memory cache opnieuw opbouwen)"),

        h2("5.2 Automatische voorspellingsgeneratie"),
        p("APScheduler (draait in-process met FastAPI op Railway) genereert continu voorspellingen:"),
        bullet("Elke 6 uur: job_sync_data (upcoming + uitslagen + standings, 7 competities per cycle)"),
        bullet("Elke 10 min: job_generate_predictions (v8.1 voorspelling voor upcoming matches zonder)"),
        bullet("Elke 20 min: job_evaluate_predictions (score finished matches)"),
        bullet("Elke 5 min: job_generate_historical_predictions (backtest backfill, 100 per batch)"),
        bullet("Direct na sync: geketend generate_predictions zodat nieuwe fixtures geen hele cycle wachten"),
        p("Geen handmatige interventie nodig. Nieuwe matches krijgen v8.1 voorspellingen binnen 10 minuten na ingestion."),

        h2("5.3 Monitoring"),
        bullet("Health endpoint: GET /api/health retourneert DB, Redis, API-Football status + row counts"),
        bullet("Structured logging via structlog \u2014 elke voorspelling logt model_version, confidence, features"),
        bullet("Admin dashboard: /admin toont data bron gezondheid, ingestion runs, API gebruik"),

        h1("6. Datakwaliteit & Validatie"),
        p("BetsPlug past strikte normen toe voor data integriteit:"),
        table2col([
          ["Kwaliteitsaspect", "Status"],
          ["Databron", "API-Football Pro (gelicentieerd, betaald abonnement)"],
          ["Aantal wedstrijden", "55.656 finished matches"],
          ["Aantal competities", "30 wereldwijd"],
          ["Historische diepte", "5,5 jaar (aug 2020 \u2014 apr 2026)"],
          ["Aantal teams", "1.076 unieke teams"],
          ["Aantal Elo ratings", "111.310 walked-forward ratings"],
          ["Point-in-time correctheid", "Afgedwongen door FeatureLeakageError tripwire"],
          ["Reproduceerbaarheid", "100% \u2014 vaste random seed (42) voor alle training"],
        ]),

        h1("7. Engineering Kwaliteitseisen"),
        p("Elke engine wijziging moet aan deze eisen voldoen voordat het live gaat."),

        h2("7.1 Trainingsdata eisen"),
        qualityBox("Data komt uitsluitend uit \u00E9\u00E9n gelicentieerde betaalde bron (API-Football Pro)."),
        qualityBox("Minimaal 20.000 wedstrijden over minimaal 3 seizoenen."),
        qualityBox("Alle uitslagen hebben een winner veld (home/draw/away) consistent met scores."),
        qualityBox("Wedstrijden met ontbrekende scores worden uitgesloten van training."),

        h2("7.2 Feature engineering eisen"),
        qualityBox("Alle features moeten point-in-time zijn: alleen data van v\u00F3\u00F3r kickoff."),
        qualityBox("De FeatureLeakageError tripwire moet actief zijn."),
        qualityBox("Minimaal 30 features in het model, elk gedocumenteerd."),
        qualityBox("Deterministisch: dezelfde input geeft dezelfde output."),

        h2("7.3 Modeltraining eisen"),
        qualityBox("Train/test split moet temporeel zijn (chronologisch), nooit random."),
        qualityBox("Minimaal 4 walk-forward validatie folds."),
        qualityBox("Controle tests (shuffled labels, random features) moeten bij de majority baseline uitkomen."),
        qualityBox("Het model moet minimaal 2 procentpunten beter scoren dan majority class baseline."),
        qualityBox("Geen hyperparameter tuning op de test set."),

        h2("7.4 Productie deployment eisen"),
        qualityBox("Nieuwe modelversies mogen pas live na succesvolle walk-forward validatie."),
        qualityBox("Alle voorspellingen gelogd met timestamp, model_version_id, feature snapshot."),
        qualityBox("Voorspellingen gemaakt v\u00F3\u00F3r kickoff zijn source='live', alle andere 'backtest'."),
        qualityBox("Het model moet gracefully degraderen (fallback naar defaults) als files ontbreken."),

        h2("7.5 Prestatiedrempels"),
        p("Als de prestatie onder deze drempels zakt, wordt het model herzien:"),
        table2col([
          ["Metriek", "Minimum drempel"],
          ["Overall accuracy (alle picks)", "\u2265 47%"],
          ["Accuracy bij confidence \u2265 60%", "\u2265 60%"],
          ["Accuracy bij confidence \u2265 70%", "\u2265 65%"],
          ["Brier score (calibration)", "\u2264 0,22"],
          ["Backtest \u2194 live verschil", "\u2264 5 procentpunten"],
        ]),

        h1("8. Auditeerbaarheid & Reproduceerbaarheid"),
        p("Elke voorspelling is reconstrueerbaar vanuit de bron. Belangrijkste mechanismen:"),
        bullet("Tijdstempel: predicted_at (wanneer model draaide) + locked_at (wanneer pre-match vastgezet)"),
        bullet("Modelversie: foreign key naar model_versions.id"),
        bullet("Feature snapshot: volledige 39-feature vector opgeslagen als JSONB"),
        bullet("Ruwe output: individuele submodel outputs opgeslagen als JSONB"),
        bullet("Evaluatie record: is_correct, brier_score, log_loss na wedstrijd"),
        p("Alle code-wijzigingen bijgehouden in git met getekende commits. Training scripts + databron + random seed zijn reproduceerbaar."),

        h1("9. Technisch Contact"),
        table2col([
          ["Onderdeel", "Details"],
          ["Rechtspersoon", "BetsPlug B.V."],
          ["Website", "https://betsplug.com"],
          ["Technisch contact", "Via de contactpagina op de website"],
          ["Documentversie", "8.1 (april 2026)"],
          ["Laatste validatie", "April 2026 (walk-forward op 28.838 picks)"],
        ]),

        new Paragraph({ spacing: { before: 600 } }),
        p("\u2014 Einde document \u2014", { italics: true, color: "999999" }),
      ],
    },
  ],
});

const OUTPUT = "C:\\Users\\denni\\Documents\\Claude coding\\Sportbetting\\docs\\BetsPlug-Technisch-Kader-NL.docx";
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Created: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}).catch(err => { console.error("Error:", err.message); process.exit(1); });
