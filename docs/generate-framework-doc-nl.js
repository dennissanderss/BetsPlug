const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition,
} = require("docx");

const BLUE = "1a365d";
const LIGHT_BLUE = "e8f0fe";
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
    // ── VOORBLAD ──
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
          children: [new TextRun({ text: "Technisch & Juridisch Kader", size: 40, font: "Arial", color: "444444" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "AI-gestuurd Voetbalvoorspellingsplatform", size: 24, font: "Arial", color: "666666", italics: true })],
        }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "VERTROUWELIJK", size: 20, bold: true, font: "Arial", color: "cc0000" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Uitsluitend voor geautoriseerde belanghebbenden", size: 20, font: "Arial", color: "666666" })],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Versie 7.0  |  April 2026", size: 22, font: "Arial", color: "444444" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "BetsPlug B.V.", size: 22, bold: true, font: "Arial", color: BLUE })],
        }),
      ],
    },

    // ── HOOFDINHOUD ──
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
              new TextRun({ text: "BetsPlug \u2014 Technisch & Juridisch Kader", size: 18, font: "Arial", color: "999999", italics: true }),
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
              new TextRun({ text: "Vertrouwelijk \u2014 BetsPlug B.V.", size: 16, font: "Arial", color: "999999" }),
              new TextRun({ text: "\tPagina " }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      children: [
        // 1. Samenvatting
        h1("1. Samenvatting"),
        p("BetsPlug is een AI-gestuurd voetbalvoorspellingsplatform dat uitsluitend is ontworpen voor educatieve en simulatiedoeleinden. Het platform faciliteert GEEN gokken, accepteert geen inzetten en verwerkt geen weddenschappen. Alle voorspellingen worden duidelijk gelabeld als simulaties met verplichte disclaimers op elke uitvoer."),
        p("De voorspellingsengine maakt gebruik van een statistisch gevalideerd ensemble van wiskundige modellen, rigoureus getoetst aan historische data met strikte temporele scheiding tussen trainings- en validatieperioden. Een grid search over 1.295 gewichtsconfiguraties bevestigde de optimale modelopstelling, gevalideerd op out-of-sample data uit 2026."),

        // 2. Platformoverzicht
        h1("2. Platformoverzicht"),
        table2col([
          ["Component", "Details"],
          ["Architectuur", "Next.js 14 frontend, FastAPI (Python) backend"],
          ["Abonnementsniveaus", "Gratis, Silver, Gold, Platinum"],
          ["Competitiedekking", "24 voetbalcompetities wereldwijd"],
          ["Databronnen", "API-Football (Pro), Football-Data.org, The Odds API"],
          ["Infrastructuur", "Railway (backend), Vercel (frontend), PostgreSQL, Redis"],
          ["Betalingen", "Stripe (PCI-DSS gecertificeerd, geen kaartgegevens opgeslagen)"],
        ]),

        // 3. Voorspellingsengine
        h1("3. Voorspellingsengine \u2014 Technische Specificatie"),

        h2("3.1 Modelarchitectuur"),
        p("De engine gebruikt een gewogen ensemble van twee actieve statistische modellen:"),
        bullet("Elo-ratingsysteem (gewicht: 1,2) \u2014 Adaptieve teamsterkte-ratings met 65-punts thuisvoordeel-calibratie, point-in-time handhaving en K-factor van 20."),
        bullet("Logistische Regressie (gewicht: 2,0) \u2014 Classifier met 43 kenmerken, getraind op historische wedstrijddata inclusief teamvorm, onderlinge resultaten, competitiestanden en Elo-verschil."),
        p("Twee extra modellen (Poisson en XGBoost) zijn getest maar uitgeschakeld na grid search-optimalisatie die aantoonde dat zij ruis toevoegen zonder de nauwkeurigheid te verbeteren."),

        h2("3.2 Anti-Lekkage Waarborgen"),
        p("Data-integriteit wordt afgedwongen via meerdere beveiligingen om te voorkomen dat toekomstige informatie voorspellingen contamineert:"),
        bullet("Elo-ratings: opgevraagd met strikt effective_at < kickoff temporeel filter"),
        bullet("FeatureLeakageError: runtime-exceptie bij elke schending van data-integriteit"),
        bullet("Teamvorm: gefilterd met before=scheduled_at, uitsluitend pre-wedstrijd data"),
        bullet("Onderlinge resultaten: beperkt tot uitsluitend historische ontmoetingen"),
        bullet("Alle 43 kenmerken geverifieerd als point-in-time veilig via code-level handhaving"),

        h2("3.3 Classificatie van Voorspellingsbron"),
        p("Elke voorspelling wordt onveranderlijk geclassificeerd bij aanmaak:"),
        table2col([
          ["Veld", "Beschrijving"],
          ["prediction_source", "'live' (pre-wedstrijd) of 'backtest' (retroactieve simulatie)"],
          ["locked_at", "Tijdstempelbewijs wanneer live-voorspelling is vastgelegd"],
          ["match_scheduled_at", "Onveranderlijke snapshot van aftrap op voorspellingsmoment"],
          ["lead_time_hours", "Uren voor aftrap dat de voorspelling is gegenereerd"],
          ["closing_odds_snapshot", "Bookmaker-odds en waarde-analyse op voorspellingsmoment"],
        ]),

        h2("3.4 Gevalideerde Prestatiemetrieken"),
        p("Optimalisatie is uitgevoerd via uitputtende grid search over 1.295 gewichtsconfiguraties op 6.502 gevalueerde voorspellingen:"),
        table2col([
          ["Metriek", "Waarde"],
          ["Configuraties getest", "1.295"],
          ["Totaal gevalueerde voorspellingen", "6.502"],
          ["Backtest-nauwkeurigheid (aug 2024 \u2013 dec 2025)", "50,4% (3.743 voorspellingen)"],
          ["Validatie-nauwkeurigheid (jan 2026 \u2013 apr 2026)", "48,9% (2.759 voorspellingen)"],
          ["BOTD backtest-nauwkeurigheid", "70,1% (432 picks)"],
          ["BOTD validatie-nauwkeurigheid", "71,1% (232 picks)"],
          ["Willekeurige baseline (3-weg)", "33,3%"],
          ["Backtest-validatie verschil", "1,5 procentpunt (geen overfitting)"],
        ]),

        // 4. Data-integriteit
        h1("4. Data-integriteit & Transparantie"),

        h2("4.1 Twee-Sporen Track Record"),
        bullet("Live track record: uitsluitend authentieke pre-wedstrijd voorspellingen met tijdstempelbewijs"),
        bullet("Backtest track record: historische simulaties duidelijk als zodanig gelabeld"),
        bullet("API-filtering: ?source=live of ?source=backtest voor alle metriek-endpoints"),
        bullet("CSV-export: bevat voorspellingsbron, doorlooptijd en alle evaluatiemetrieken"),

        h2("4.2 Financiele Berekeningen"),
        bullet("W/V uitsluitend berekend met echte bookmaker-odds van gelicentieerde databronnen"),
        bullet("Geen circulaire implied-odds berekeningen (model dat zichzelf beoordeelt)"),
        bullet("Wanneer geen echte odds beschikbaar: W/V wordt gerapporteerd als null, niet geschat"),
        bullet("Dekkingspercentage odds transparant vermeld bij elke metriek"),

        h2("4.3 Verplichte Disclaimers"),
        p("Elke API-respons en UI-component met voorspellingsdata bevat:", { italics: true }),
        p("\"SIMULATIE / UITSLUITEND EDUCATIEF GEBRUIK. Deze kansschattingen zijn gegenereerd door een statistisch model voor onderzoeks- en educatieve doeleinden. Ze vormen GEEN financieel, gok- of beleggingsadvies. Prestaties uit het verleden bieden geen garantie voor toekomstige resultaten. Gok altijd verantwoord en binnen de geldende wetgeving.\"", { italics: true, size: 20 }),

        // 5. Juridisch Kader
        h1("5. Juridisch Kader"),

        h2("5.1 Regelgevende Classificatie"),
        p("BetsPlug biedt statistische analyse en educatieve content. Het platform is uitdrukkelijk NIET:"),
        bullet("Een gokoperator \u2014 er worden geen inzetten geaccepteerd of gefaciliteerd"),
        bullet("Een tipgevendienst \u2014 er worden geen rendementen gegarandeerd of gesuggereerd"),
        bullet("Financieel advies \u2014 er wordt geen beleggings- of gokadvies verstrekt"),
        p("Het platform opereert als een informatie- en analysedienst onder de toepasselijke EU Digital Services Act-bepalingen en nationale regelgeving voor informatiediensten."),

        h2("5.2 Verantwoord Gokken"),
        bullet("Verplichte simulatie/educatieve disclaimer op alle voorspellingsuitvoer"),
        bullet("Geen garantie op nauwkeurigheid of winstgevendheid \u2014 expliciet uitgesloten"),
        bullet("\"Resultaten uit het verleden bieden geen garantie voor de toekomst\" boodschap"),
        bullet("Leeftijdsverificatie (18+) vereist voor abonnementsaankopen via Stripe"),
        bullet("Zelfuitsluiting: gebruikers kunnen hun account en alle bijbehorende gegevens verwijderen"),

        h2("5.3 Gegevensbescherming (AVG/GDPR)"),
        p("Het platform verwerkt minimale persoonsgegevens in overeenstemming met de AVG:"),
        table2col([
          ["Gegevenscategorie", "Verwerkingsgrondslag"],
          ["E-mail, gebruikersnaam", "Uitvoering overeenkomst (accountcreatie)"],
          ["Abonnementsstatus", "Uitvoering overeenkomst"],
          ["Verlaten checkout e-mail", "Gerechtvaardigd belang (eenmalige herinnering)"],
          ["Betaalgegevens", "NIET opgeslagen \u2014 verwerkt door Stripe (PCI-DSS Level 1)"],
          ["Voorspellingsgeschiedenis", "Uitvoering overeenkomst (dienstverlening)"],
        ]),
        bullet("Recht op vergetelheid: gebruikers kunnen hun account verwijderen via instellingen of AVG-verzoek"),
        bullet("Gegevensverwerking: EU-gebaseerde infrastructuur (Railway EU, Vercel EU edge)"),
        bullet("Geen profilering voor geautomatiseerde besluitvorming die gebruikers raakt"),

        h2("5.4 Intellectueel Eigendom"),
        bullet("Voorspellingsengine: eigen ensemble-methodologie, intern ontwikkeld"),
        bullet("Trainingsdata: gelicentieerd van API-Football (Pro-licentie)"),
        bullet("Aanvullende data: Football-Data.org (attributielicentie)"),
        bullet("Oddsdata: gelicentieerd van The Odds API (commercieel abonnement)"),
        bullet("Alle gegevens van derden gebruikt binnen de respectievelijke licentievoorwaarden"),

        // 6. Risico-informatie
        h1("6. Risico-informatie"),
        p("Gebruikers en belanghebbenden dienen de volgende inherente beperkingen te begrijpen:"),
        bullet("Voorspellingen zijn probabilistische schattingen op basis van historische patronen, geen zekerheden"),
        bullet("Historische nauwkeurigheid (48,9% overall, 71,1% BOTD) biedt geen garantie voor toekomstige prestaties"),
        bullet("Modellen kunnen onderpresteren tijdens atypische omstandigheden (bijv. pandemie, stakingen, regelwijzigingen)"),
        bullet("Nauwkeurigheid per competitie varieert: top-6 Europese competities circa 50%, lagere competities circa 40%"),
        bullet("Gebruikers dienen nooit geld in te zetten dat zij niet kunnen missen"),
        bullet("BetsPlug aanvaardt geen aansprakelijkheid voor financiele verliezen door gebruik van haar voorspellingen"),

        // 7. Auditspoor
        h1("7. Auditspoor & Reproduceerbaarheid"),
        p("Het platform onderhoudt een volledig auditspoor voor elke voorspelling:"),
        bullet("Onveranderlijk voorspellingsrecord: tijdstempel, modelversie, 43-kenmerken snapshot, ruwe modeluitvoer"),
        bullet("Evaluatierecords: koppelen voorspellingen aan daadwerkelijke wedstrijduitslagen met Brier score en log-loss"),
        bullet("Volledige reproduceerbaarheid: bij identieke kenmerken produceert het model identieke uitvoer"),
        bullet("Versiebeheer: alle modelwijzigingen gedocumenteerd in git-geschiedenis met commit-berichten"),
        bullet("Databasemigraties: schemawijzigingen bijgehouden via Alembic met up/down omkeerbaarheid"),

        // 8. Contact
        h1("8. Contact & Governance"),
        table2col([
          ["Onderdeel", "Details"],
          ["Rechtspersoon", "BetsPlug B.V."],
          ["Website", "https://betsplug.com"],
          ["Technisch contact", "Via contactpagina"],
          ["Gegevensbescherming", "AVG-verzoeken via contactpagina"],
          ["Documentversie", "7.0 (april 2026)"],
        ]),

        new Paragraph({ spacing: { before: 600 } }),
        p("\u2014 Einde document \u2014", { italics: true, color: "999999" }),
      ],
    },
  ],
});

const OUTPUT = "C:\\Users\\denni\\Documents\\Claude coding\\Sportbetting\\docs\\BetsPlug-Technisch-Juridisch-Kader-NL.docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Created: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}).catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
