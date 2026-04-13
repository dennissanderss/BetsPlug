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
      new TextRun({ text: "In plain terms: ", bold: true, size: 20, font: "Arial", color: BLUE }),
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
        p("BetsPlug is an online platform that uses artificial intelligence (AI) to predict the outcomes of football matches. The platform is designed exclusively for educational and informational purposes. BetsPlug does not organise gambling activities, accept wagers, or process any betting transactions."),
        p("The system analyses years of match data \u2014 including results, team form, head-to-head records, and league standings \u2014 to estimate the most likely outcome of upcoming matches. Every prediction is accompanied by a clear notice that it is a simulation and does not guarantee any profit."),
        p("To demonstrate the system\u2019s reliability, it has been extensively tested: 1,295 different configurations were evaluated on over 6,500 historical matches. The results on data the system had never seen before (the year 2026) closely match the results on training data \u2014 confirming the system works reliably and is not \u201Coverfitted\u201D (too specifically tuned to historical data)."),

        // 2. What is BetsPlug?
        h1("2. What is BetsPlug?"),
        p("BetsPlug is a web application where users can log in to view AI-generated football predictions. The platform operates as a subscription service with different tiers:"),
        table2col([
          ["Component", "Explanation"],
          ["Free tier", "Limited access: 3 daily predictions, basic statistics"],
          ["Silver / Gold / Platinum", "Full access: all predictions, track record, exports, Pick of the Day"],
          ["League coverage", "24 football leagues worldwide, including Premier League, Champions League, Eredivisie"],
          ["Data sources", "Professional sports data APIs (API-Football, Football-Data.org, The Odds API)"],
          ["Payments", "Via Stripe \u2014 BetsPlug does not store any credit card information"],
        ]),
        explainBox("BetsPlug is similar to a weather station that forecasts the weather: it provides an estimate based on data, but cannot guarantee the weather. Similarly, BetsPlug estimates match outcomes but does not guarantee results."),

        // 3. How does the prediction work?
        h1("3. How Does the Prediction Work?"),

        h2("3.1 The Models \u2014 How a Prediction is Made"),
        p("The system combines two mathematical models that each look at match data from a different angle. By merging these two perspectives, the prediction becomes more accurate than either model alone."),

        p("Model 1: Elo Rating System", { bold: true }),
        p("Every team receives an \u201CElo score\u201D \u2014 a number indicating how strong the team is. The more matches a team wins (especially against strong opponents), the higher the score. The system compares the Elo scores of both teams to determine who is the favourite. Think of it like a ranking system in tennis or chess."),

        p("Model 2: Logistic Regression", { bold: true }),
        p("This model examines 43 different factors simultaneously, for example: how has the team performed in their last 5 matches? How often did they win at home? What is the head-to-head record? What is the difference in league standing? The model has learned from thousands of historical matches which combination of factors best predicts the outcome."),

        p("The two models are combined with a weight: the Logistic model counts twice as much as the Elo model, because testing showed this produces the best results."),

        explainBox("Imagine asking two experts who will win a match. Expert 1 (Elo) only looks at the overall strength of teams. Expert 2 (Logistic) looks at 43 details. You listen to both, but give Expert 2 more weight because they are right more often. That is what BetsPlug does."),

        h2("3.2 Safeguards Against Data Cheating"),
        p("A major risk with prediction systems is that they accidentally use information that was not available at the time of the prediction. For example: if the system knew the result of a match while trying to predict it, it would be cheating."),
        p("BetsPlug has built in multiple safeguards to prevent this:"),
        bullet("Team strengths (Elo scores) are only retrieved up to the moment BEFORE kickoff \u2014 never after"),
        bullet("Team form (last 5 matches) only includes matches already played before the match being predicted"),
        bullet("Head-to-head records only include previous encounters, never the match itself"),
        bullet("If the system detects that future data is accidentally being used, it automatically stops with an error"),
        explainBox("This is like a school exam: if a student already knows the answers, the test is not fair. BetsPlug ensures the system can never see the \u201Canswers\u201D (the match result) before making its prediction."),

        h2("3.3 Live vs. Backtest \u2014 Two Types of Predictions"),
        p("BetsPlug distinguishes between two types of predictions:"),
        table2col([
          ["Type", "Explanation"],
          ["Live prediction", "Made BEFORE the match starts. Locked with a timestamp as proof. This is the \u201Creal\u201D prediction."],
          ["Backtest prediction", "Made after the fact on historical data to test the system. Clearly labelled as \u201Csimulation\u201D."],
        ]),
        p("This distinction is crucial for honesty. Many prediction platforms do not show this difference, making it appear they perform better than they actually do. BetsPlug always reports separately how well live predictions and backtests perform."),
        explainBox("Compare it to a doctor who says after the fact \u201CI knew it all along\u201D versus a doctor who makes a diagnosis beforehand. Only the diagnosis made in advance truly counts. BetsPlug always shows which predictions were genuinely made in advance."),

        h2("3.4 How Well Does the System Perform?"),
        p("The system has been extensively tested to measure its reliability. Here are the results:"),
        table2col([
          ["Metric", "Result"],
          ["Configurations tested", "1,295 different settings compared"],
          ["Total matches evaluated", "6,502 matches"],
          ["Accuracy on training data (2024\u20132025)", "50.4% correct (3,743 matches)"],
          ["Accuracy on new data (2026)", "48.9% correct (2,759 matches)"],
          ["Pick of the Day on training data", "70.1% correct (432 picks)"],
          ["Pick of the Day on new data", "71.1% correct (232 picks)"],
          ["Random guessing (home/draw/away)", "33.3% correct"],
        ]),
        p("The difference between training and test results is small (1.5 percentage points), demonstrating the system is not \u201Coverfitted\u201D \u2014 it works reliably even on data it has never seen before."),
        explainBox("In football there are three possible outcomes: home win, draw, or away win. Random guessing gives you a 33% chance of being right. BetsPlug scores an average of 49% \u2014 that is 48% better than random guessing. The \u201CPick of the Day\u201D (the best daily prediction) scores an impressive 71%."),

        // 4. Honesty and Transparency
        h1("4. Honesty & Transparency"),

        h2("4.1 Two Separate Track Records"),
        p("BetsPlug maintains two separate scorecards:"),
        bullet("Live track record: only predictions demonstrably made BEFORE the match, with timestamp proof"),
        bullet("Backtest track record: historical simulations, clearly labelled as such"),
        p("Users can filter which type they want to see via the API and website. CSV exports always include the source (live or backtest), hours before kickoff, and all evaluation data."),

        h2("4.2 Honest Financial Calculations"),
        p("Profit and loss calculations are made exclusively using real bookmaker odds from licensed data sources (such as Bet365, Pinnacle). The system does NOT calculate fake profits based on its own probability estimates \u2014 that would amount to self-assessment."),
        bullet("When real odds are available: P/L is calculated based on those odds"),
        bullet("When no real odds are available: P/L is reported as \u201Cunknown\u201D, not estimated"),
        bullet("Every metric discloses what percentage of picks had real odds data"),
        explainBox("Say the model predicts \u201C60% chance of home win.\u201D If we then calculate odds ourselves (1/0.60 = 1.67) and claim \u201Cwe made a profit!\u201D then the model is grading its own homework. BetsPlug does not do this \u2014 we only use real bookmaker odds."),

        h2("4.3 Mandatory Disclaimers"),
        p("Every prediction shown by BetsPlug includes the following disclaimer:"),
        p("\u201CSIMULATION / EDUCATIONAL USE ONLY. These probability estimates are generated by a statistical model for research and educational purposes. They do NOT constitute financial, betting, or investment advice. Past model performance is not indicative of future results. Always gamble responsibly and within applicable laws.\u201D", { italics: true, size: 20 }),

        // 5. Legal Framework
        h1("5. Legal Framework"),

        h2("5.1 What BetsPlug IS and IS NOT"),
        p("BetsPlug is an information service offering statistical analysis. It is important to understand what the platform IS and IS NOT:"),
        table2col([
          ["BetsPlug IS", "BetsPlug IS NOT"],
          ["An information platform with AI analyses", "A gambling company or casino"],
          ["An educational service about sports statistics", "A tipster service guaranteeing profits"],
          ["A subscription service for data insights", "Financial or investment advice"],
        ]),
        p("BetsPlug does not accept wagers, organise bets, or facilitate gambling activities in any way. The platform falls under the EU Digital Services Act as an information service."),

        h2("5.2 Responsible Gambling"),
        p("Although BetsPlug is not a gambling service itself, the platform acknowledges that some users may use the information in combination with gambling activities. Therefore, BetsPlug takes the following measures:"),
        bullet("Mandatory disclaimer on every prediction"),
        bullet("Clear statement that accuracy is not guaranteed"),
        bullet("The message \u201CPast results do not guarantee future performance\u201D"),
        bullet("Age verification (18+) required when purchasing a subscription"),
        bullet("Self-exclusion option: users can completely delete their account"),

        h2("5.3 Privacy and Data Protection (GDPR)"),
        p("BetsPlug processes as little personal data as possible, in full compliance with the General Data Protection Regulation (GDPR):"),
        table2col([
          ["What we store", "Why"],
          ["Email address and username", "Required to log in and manage the account"],
          ["Subscription status", "To determine which content is accessible"],
          ["Payment details (credit card, IBAN)", "NOT stored by BetsPlug \u2014 Stripe processes all payments"],
          ["Prediction history", "To display the track record and deliver the service"],
        ]),
        bullet("Right to erasure: you can have your account and all data deleted via settings or a GDPR request"),
        bullet("Data processing takes place on European servers (Railway EU, Vercel EU)"),
        bullet("No profiling or automated decision-making affecting users takes place"),
        explainBox("In simple terms: BetsPlug knows your email address and what subscription you have. Your credit card details are processed by Stripe \u2014 BetsPlug never sees or stores them. You can have all your data deleted at any time."),

        h2("5.4 Intellectual Property and Licences"),
        p("The prediction system is entirely developed in-house. The data on which the system runs is licensed from professional data providers:"),
        bullet("API-Football (Pro licence): provides match data, results, team statistics"),
        bullet("Football-Data.org: supplementary league data"),
        bullet("The Odds API: provides bookmaker odds from 40+ providers"),
        p("All data is used within the terms of the respective licences."),

        // 6. Risk Disclosure
        h1("6. Risk Disclosure"),
        p("It is essential that users and stakeholders understand the system\u2019s limitations:"),
        bullet("Predictions are estimates based on historical patterns \u2014 not certainties. Football is unpredictable and surprises are inevitable."),
        bullet("The system scoring 49% in the past does not mean it will score the same in the future. Circumstances change."),
        bullet("The model may underperform during unusual situations, such as pandemics, strikes, or drastic rule changes."),
        bullet("Accuracy varies by league: top-6 European leagues score around 50%, while smaller leagues score around 40%."),
        bullet("Never use information from BetsPlug as the sole basis for financial decisions. Never stake money you cannot afford to lose."),
        bullet("BetsPlug accepts no liability whatsoever for financial losses arising from the use of its predictions."),
        explainBox("Compare it to a weather forecast: 70% chance of rain means it does NOT rain in 3 out of 10 cases. Even the best forecast is not a guarantee. BetsPlug works the same way \u2014 it provides probabilities, not certainties."),

        // 7. Audit Trail
        h1("7. Audit Trail & Traceability"),
        p("Every prediction BetsPlug makes is permanently stored with all underlying data. This makes it possible to trace exactly how a prediction was made after the fact:"),
        bullet("Timestamp: when the prediction was made (proof it was before the match)"),
        bullet("Model version: which version of the system made the prediction"),
        bullet("Feature snapshot: all 43 data points used at that moment"),
        bullet("Raw model output: the exact calculations from each model"),
        bullet("Evaluation record: the comparison with the actual match outcome"),
        p("All this data is reproducible: given the same input, you get the same output. All changes to the system are tracked in a version control system (git)."),
        explainBox("This means an auditor or regulator can verify at any time: (1) when a prediction was made, (2) based on what data, (3) whether that data was fair, and (4) whether the prediction was correct. Nothing can be altered after the fact."),

        // 8. Contact
        h1("8. Contact & Governance"),
        table2col([
          ["Item", "Details"],
          ["Legal entity", "BetsPlug B.V."],
          ["Website", "https://betsplug.com"],
          ["Technical contact", "Via the contact page on the website"],
          ["Privacy requests", "GDPR requests via the contact page"],
          ["Document version", "7.0 (April 2026)"],
        ]),

        new Paragraph({ spacing: { before: 600 } }),
        p("\u2014 End of document \u2014", { italics: true, color: "999999" }),
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
