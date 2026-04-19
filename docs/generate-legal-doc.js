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
const YELLOW_BG = "fff8e1";
const border = { style: BorderStyle.SINGLE, size: 1, color: "cccccc" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: BLUE })] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: BLUE })] }); }
function p(text, opts = {}) { return new Paragraph({ spacing: { after: 140, line: 320 }, children: [new TextRun({ text, size: 22, font: "Arial", ...opts })] }); }
function bullet(text) { return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80, line: 320 }, children: [new TextRun({ text, size: 22, font: "Arial" })] }); }
function warningBox(text) {
  return new Paragraph({
    spacing: { before: 80, after: 160, line: 320 },
    shading: { fill: YELLOW_BG, type: ShadingType.CLEAR },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: "\u26A0 Important: ", bold: true, size: 20, font: "Arial", color: "996600" }),
      new TextRun({ text, size: 20, font: "Arial", color: "444444" }),
    ],
  });
}
function explainBox(text) {
  return new Paragraph({
    spacing: { before: 80, after: 160, line: 320 },
    shading: { fill: GRAY_BG, type: ShadingType.CLEAR },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: "In plain language: ", bold: true, size: 20, font: "Arial", color: BLUE }),
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
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } },
          children: [new TextRun({ text: "BetsPlug", size: 72, bold: true, font: "Arial", color: BLUE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "Legal Framework", size: 40, font: "Arial", color: "444444" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
          children: [new TextRun({ text: "Compliance, Disclaimers & Liability", size: 24, font: "Arial", color: "666666", italics: true })] }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "CONFIDENTIAL", size: 20, bold: true, font: "Arial", color: "cc0000" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "For Legal & Compliance Stakeholders Only", size: 20, font: "Arial", color: "666666" })] }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Version 8.1  |  April 2026", size: 22, font: "Arial", color: "444444" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "BetsPlug B.V.", size: 22, bold: true, font: "Arial", color: BLUE })] }),
      ],
    },
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
        children: [
          new TextRun({ text: "BetsPlug \u2014 Legal Framework", size: 18, font: "Arial", color: "999999", italics: true }),
          new TextRun({ text: "\tv8.1", size: 18, font: "Arial", color: "999999" }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      })] }) },
      footers: { default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "cccccc", space: 4 } },
        children: [
          new TextRun({ text: "Confidential \u2014 BetsPlug B.V.", size: 16, font: "Arial", color: "999999" }),
          new TextRun({ text: "\tPage " }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      })] }) },
      children: [
        h1("1. Executive Summary"),
        p("This document sets out the legal framework under which BetsPlug operates. It is intended for legal counsel, compliance officers, regulators, auditors, and business partners."),
        p("BetsPlug is an information service providing AI-generated football match predictions for educational and research purposes. BetsPlug does not accept wagers, does not organise gambling activities, and does not facilitate betting transactions. The platform qualifies as an information society service under the EU Digital Services Act (DSA)."),
        p("All predictions include a mandatory disclaimer. User data is processed in compliance with GDPR. Payments are handled by Stripe; BetsPlug does not store credit card data."),

        h1("2. Product Classification"),

        h2("2.1 What BetsPlug IS and IS NOT"),
        p("Clear delineation of the service scope:"),
        table2col([
          ["BetsPlug IS", "BetsPlug IS NOT"],
          ["An information platform with AI analyses", "A gambling company or casino"],
          ["An educational service on sports statistics", "A tipster service guaranteeing profits"],
          ["A subscription service for data insights", "Financial or investment advice"],
          ["A software-as-a-service (SaaS) provider", "An intermediary for betting transactions"],
        ]),

        h2("2.2 Regulatory Positioning"),
        bullet("EU Digital Services Act (DSA): BetsPlug is an information society service"),
        bullet("EU GDPR: BetsPlug is a data controller for user account data"),
        bullet("Netherlands Kansspelautoriteit (KSA): BetsPlug is NOT a gambling operator and does not require a gambling licence"),
        bullet("Consumer Protection (ACM): BetsPlug provides subscription-based information services"),
        warningBox("BetsPlug does not enable real-money betting. Users who choose to place bets elsewhere do so at their own risk, using their own judgement, with licensed gambling operators."),

        h1("3. Mandatory Disclaimers"),
        p("Every prediction displayed on the platform includes the following disclaimer:"),
        p("\u201CSIMULATION / EDUCATIONAL USE ONLY. These probability estimates are generated by a statistical model for research and educational purposes. They do NOT constitute financial, gambling, or investment advice. Past performance does not guarantee future results. Always gamble responsibly and within applicable law.\u201D",
          { italics: true, size: 20 }),
        p("This disclaimer appears:"),
        bullet("On every individual prediction card"),
        bullet("In every API response containing prediction data"),
        bullet("In every downloadable report (CSV, PDF)"),
        bullet("In the Terms of Use accepted at registration"),

        h1("4. Responsible Gambling Measures"),
        p("Although BetsPlug is not itself a gambling service, the platform acknowledges that some users may use the information in combination with gambling activities. BetsPlug therefore takes the following measures:"),

        h2("4.1 Age Verification"),
        bullet("Minimum age 18 required at registration"),
        bullet("Date of birth verified via account creation flow"),
        bullet("Under-18 accounts are not permitted"),

        h2("4.2 Mandatory Disclaimers"),
        bullet("Displayed on every prediction"),
        bullet("Cannot be dismissed or hidden"),
        bullet("Included in CSV/PDF exports"),

        h2("4.3 Responsible Gambling Messaging"),
        bullet("\u201CPast performance does not guarantee future results\u201D on every metric display"),
        bullet("Sample size always shown alongside accuracy claims"),
        bullet("Links to responsible gambling resources (loketkansspel.nl, gambleaware.org)"),

        h2("4.4 Self-Exclusion"),
        bullet("Users can delete their account at any time via account settings"),
        bullet("Account deletion removes all user data (GDPR right to erasure)"),
        bullet("Subscription is immediately cancelled upon account deletion"),

        h2("4.5 Prohibited Claims"),
        p("The following claims are expressly forbidden from the platform and marketing materials:"),
        bullet("\u201CGuaranteed profit\u201D"),
        bullet("\u201CWinning system\u201D"),
        bullet("\u201CCan't lose\u201D"),
        bullet("ROI percentages > 10% without clear historical context and sample size"),
        bullet("Winrates > 60% without \u201CBOTD only, N picks\u201D qualifier"),

        h1("5. Privacy & Data Protection (GDPR)"),

        h2("5.1 Data Controller"),
        p("BetsPlug B.V. is the data controller for personal data processed through the platform. Contact: via the contact page on the website."),

        h2("5.2 Data Collected"),
        table2col([
          ["Data category", "Purpose"],
          ["Email address", "Account access and authentication"],
          ["Username", "Profile identification"],
          ["Subscription tier", "Feature gating"],
          ["Prediction history viewed", "Service delivery (track record)"],
          ["Login timestamps", "Security and fraud detection"],
          ["Payment data (card, IBAN)", "NOT stored by BetsPlug \u2014 handled entirely by Stripe"],
        ]),
        explainBox("BetsPlug stores your email, username, and subscription status. Payment data is handled by Stripe; BetsPlug never sees or stores your card details."),

        h2("5.3 Legal Basis for Processing"),
        bullet("Contract (GDPR Art. 6(1)(b)): account data necessary for service delivery"),
        bullet("Legal obligation (GDPR Art. 6(1)(c)): tax and accounting records"),
        bullet("Legitimate interest (GDPR Art. 6(1)(f)): fraud prevention, security logs"),
        bullet("Consent (GDPR Art. 6(1)(a)): marketing communications (opt-in, revocable)"),

        h2("5.4 User Rights Under GDPR"),
        bullet("Right of access: download your data via account settings"),
        bullet("Right to rectification: update profile information any time"),
        bullet("Right to erasure: delete account (all data removed)"),
        bullet("Right to portability: export data in JSON/CSV format"),
        bullet("Right to object: opt out of marketing at any time"),
        bullet("Right to lodge a complaint: with the Dutch Autoriteit Persoonsgegevens"),

        h2("5.5 Data Retention"),
        table2col([
          ["Data type", "Retention period"],
          ["Active account data", "Until account deletion"],
          ["Deleted account data", "Removed within 30 days"],
          ["Financial records (invoices)", "7 years (Dutch legal requirement)"],
          ["Security logs", "90 days"],
          ["Anonymised usage analytics", "Indefinite (no personal data)"],
        ]),

        h2("5.6 Data Location & Transfers"),
        bullet("All data stored on European servers (Railway EU region, Vercel EU edge)"),
        bullet("No transfers outside the EU/EEA"),
        bullet("API-Football Pro is a licensed data source \u2014 BetsPlug only reads match data, no personal data shared"),
        bullet("Stripe (payment processor) is GDPR-compliant with standard contractual clauses"),

        h2("5.7 Automated Decision-Making"),
        p("BetsPlug's prediction algorithms do not make decisions that legally or significantly affect users. Predictions are informational output only. Feature-gating based on subscription tier is a contractual matter, not automated profiling under GDPR Art. 22."),

        h1("6. Intellectual Property"),

        h2("6.1 BetsPlug-owned IP"),
        bullet("Prediction engine source code"),
        bullet("Trained machine learning models (weights, scalers)"),
        bullet("Feature engineering logic"),
        bullet("Website design, branding, logo"),
        bullet("Generated predictions (as output of licensed inputs)"),

        h2("6.2 Licensed Data"),
        bullet("API-Football Pro: match fixtures, results, statistics \u2014 used under commercial licence"),
        bullet("Bookmaker odds (when displayed): used under applicable terms from The Odds API or similar"),
        p("All data is used within the terms of the respective licences. BetsPlug does not scrape or otherwise obtain data from unauthorised sources."),

        h2("6.3 User-Generated Content"),
        p("Users do not generate public content on the platform. Private notes and favourites remain the user's property and are deleted on account deletion."),

        h1("7. Terms of Use"),

        h2("7.1 Subscription Model"),
        bullet("Tiered subscriptions (Bronze, Silver, Gold, Platinum) with different feature access"),
        bullet("Monthly or annual billing via Stripe"),
        bullet("Automatic renewal unless cancelled"),
        bullet("Cancellation: effective at end of current billing period; no refund for unused portion"),
        bullet("Price changes: 30-day notice required"),

        h2("7.2 Acceptable Use"),
        p("Users agree NOT to:"),
        bullet("Scrape or reverse-engineer the prediction engine"),
        bullet("Share account credentials"),
        bullet("Resell or redistribute predictions without a Platinum API licence"),
        bullet("Use the service to circumvent gambling regulations in their jurisdiction"),
        bullet("Use the service under the age of 18"),

        h2("7.3 Liability Limitations"),
        warningBox("BetsPlug accepts NO liability for financial losses arising from the use of its predictions. Predictions are estimates only. Past model performance is not indicative of future results. Users must make their own judgements."),
        p("Specifically:"),
        bullet("BetsPlug's maximum liability is limited to the amount paid in the last 12 months"),
        bullet("BetsPlug is not liable for indirect, consequential, or special damages"),
        bullet("Force majeure events (API outages, data provider failures) do not give rise to claims"),
        bullet("Local gambling losses are the sole responsibility of the user"),

        h2("7.4 Dispute Resolution"),
        bullet("Governing law: Dutch law"),
        bullet("Competent court: Rechtbank Amsterdam"),
        bullet("Consumer users may invoke rights under EU consumer protection directives"),
        bullet("Pre-litigation: users must attempt resolution via the contact page first"),

        h2("7.5 Changes to Terms"),
        p("BetsPlug reserves the right to update Terms of Use. Material changes require 30-day notice; users may cancel their subscription if they disagree with new terms."),

        h1("8. Risk Information"),
        p("Essential limitations users and stakeholders must understand:"),
        bullet("Predictions are statistical estimates, not certainties. Football is inherently unpredictable."),
        bullet("Past performance does not guarantee future results. Market conditions, team rosters, weather, injuries, and countless other factors influence outcomes."),
        bullet("The model may underperform during anomalous periods: pandemics, strikes, or drastic rule changes."),
        bullet("Accuracy varies by league, competition, and confidence level. Users should review per-league accuracy figures before acting on predictions."),
        bullet("BetsPlug information should never be the sole basis for financial decisions. Users must consult their own financial advisors for investment matters."),
        bullet("Never wager money that cannot be afforded to lose."),
        explainBox("Compare this to a weather forecast: a 70% chance of rain means it does NOT rain in 3 out of 10 cases. Even the best prediction is not a guarantee. BetsPlug works similarly \u2014 it provides probabilities, not certainties."),

        h1("9. Contact & Organisation"),
        table2col([
          ["Item", "Details"],
          ["Legal entity", "BetsPlug B.V."],
          ["Registered office", "Netherlands"],
          ["Website", "https://betsplug.com"],
          ["General contact", "Via contact page on website"],
          ["Privacy/GDPR requests", "Via contact page (tag: 'AVG' or 'GDPR')"],
          ["Data Protection Officer", "To be designated when user base exceeds GDPR Art. 37 threshold"],
          ["Competent data authority", "Autoriteit Persoonsgegevens (NL)"],
          ["Document version", "8.1 (April 2026)"],
        ]),

        new Paragraph({ spacing: { before: 600 } }),
        p("\u2014 End of document \u2014", { italics: true, color: "999999" }),
      ],
    },
  ],
});

const OUTPUT = "C:\\Users\\denni\\Documents\\Claude coding\\Sportbetting\\docs\\BetsPlug-Legal-Framework (ENG).docx";
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Created: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}).catch(err => { console.error("Error:", err.message); process.exit(1); });
