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
      new TextRun({ text: "\u26A0 Belangrijk: ", bold: true, size: 20, font: "Arial", color: "996600" }),
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
      new TextRun({ text: "In gewoon Nederlands: ", bold: true, size: 20, font: "Arial", color: BLUE }),
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
          children: [new TextRun({ text: "Juridisch Kader", size: 40, font: "Arial", color: "444444" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
          children: [new TextRun({ text: "Compliance, Disclaimers & Aansprakelijkheid", size: 24, font: "Arial", color: "666666", italics: true })] }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "VERTROUWELIJK", size: 20, bold: true, font: "Arial", color: "cc0000" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "Uitsluitend voor juridische & compliance belanghebbenden", size: 20, font: "Arial", color: "666666" })] }),
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
          new TextRun({ text: "BetsPlug \u2014 Juridisch Kader", size: 18, font: "Arial", color: "999999", italics: true }),
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
        p("Dit document beschrijft het juridische kader waarbinnen BetsPlug opereert. Het is bedoeld voor juridisch adviseurs, compliance officers, toezichthouders, auditors en zakelijke partners."),
        p("BetsPlug is een informatiedienst die AI-gegenereerde voetbalvoorspellingen aanbiedt voor educatieve en onderzoeksdoeleinden. BetsPlug accepteert geen inzetten, organiseert geen gokactiviteiten, en faciliteert geen weddenschappen. Het platform kwalificeert als een informatiedienst onder de EU Digital Services Act (DSA)."),
        p("Elke voorspelling bevat een verplichte disclaimer. Gebruikersdata wordt verwerkt in overeenstemming met de AVG. Betalingen lopen via Stripe; BetsPlug slaat geen creditcardgegevens op."),

        h1("2. Productclassificatie"),

        h2("2.1 Wat BetsPlug WEL en NIET is"),
        p("Heldere afbakening van de dienst:"),
        table2col([
          ["BetsPlug is WEL", "BetsPlug is NIET"],
          ["Een informatieplatform met AI-analyses", "Een gokbedrijf of casino"],
          ["Een educatieve dienst over sportstatistiek", "Een tipgeverdienst die winst garandeert"],
          ["Een abonnementsdienst voor data-inzichten", "Financieel of beleggingsadvies"],
          ["Een software-as-a-service (SaaS) aanbieder", "Een tussenpersoon voor weddenschappen"],
        ]),

        h2("2.2 Regelgeving positionering"),
        bullet("EU Digital Services Act (DSA): BetsPlug is een informatiedienst"),
        bullet("EU AVG: BetsPlug is verwerkingsverantwoordelijke voor gebruikersaccountdata"),
        bullet("Nederlandse Kansspelautoriteit (KSA): BetsPlug is GEEN kansspelaanbieder en heeft geen vergunning nodig"),
        bullet("Consumentenbescherming (ACM): BetsPlug biedt abonnementsgebonden informatiediensten"),
        warningBox("BetsPlug maakt geen inzet met echt geld mogelijk. Gebruikers die elders weddenschappen plaatsen doen dat op eigen risico, op basis van eigen oordeel, bij gelicentieerde gokaanbieders."),

        h1("3. Verplichte Disclaimers"),
        p("Elke voorspelling op het platform bevat de volgende disclaimer:"),
        p("\u201CSIMULATIE / UITSLUITEND EDUCATIEF GEBRUIK. Deze kansschattingen zijn gegenereerd door een statistisch model voor onderzoeks- en educatieve doeleinden. Ze vormen GEEN financieel, gok- of beleggingsadvies. Prestaties uit het verleden bieden geen garantie voor toekomstige resultaten. Gok altijd verantwoord en binnen de geldende wetgeving.\u201D",
          { italics: true, size: 20 }),
        p("Deze disclaimer verschijnt:"),
        bullet("Op elke individuele voorspelling"),
        bullet("In elk API-antwoord met voorspellingsdata"),
        bullet("In elk downloadbaar rapport (CSV, PDF)"),
        bullet("In de Gebruiksvoorwaarden die worden geaccepteerd bij registratie"),

        h1("4. Maatregelen Verantwoord Gokken"),
        p("Hoewel BetsPlug zelf geen gokdienst is, erkent het platform dat sommige gebruikers de informatie mogelijk gebruiken in combinatie met gokactiviteiten. BetsPlug neemt daarom de volgende maatregelen:"),

        h2("4.1 Leeftijdsverificatie"),
        bullet("Minimumleeftijd 18 jaar vereist bij registratie"),
        bullet("Geboortedatum geverifieerd via account aanmaak flow"),
        bullet("Accounts onder 18 zijn niet toegestaan"),

        h2("4.2 Verplichte Disclaimers"),
        bullet("Weergegeven op elke voorspelling"),
        bullet("Kan niet worden weggeklikt of verborgen"),
        bullet("Opgenomen in CSV/PDF exports"),

        h2("4.3 Verantwoord gokken messaging"),
        bullet("\u201CPrestaties uit het verleden bieden geen garantie voor toekomstige resultaten\u201D op elke metric"),
        bullet("Sample size altijd getoond naast accuracy claims"),
        bullet("Links naar verantwoord gokken hulpbronnen (loketkansspel.nl)"),

        h2("4.4 Zelfuitsluiting"),
        bullet("Gebruikers kunnen hun account te allen tijde verwijderen via account instellingen"),
        bullet("Account verwijderen verwijdert alle gebruikersdata (AVG recht op vergetelheid)"),
        bullet("Abonnement wordt direct geannuleerd bij account verwijdering"),

        h2("4.5 Verboden Claims"),
        p("De volgende claims zijn uitdrukkelijk verboden op het platform en in marketing materiaal:"),
        bullet("\u201CGegarandeerde winst\u201D"),
        bullet("\u201CWinning system\u201D"),
        bullet("\u201CKan niet verliezen\u201D"),
        bullet("ROI percentages > 10% zonder duidelijke historische context en sample size"),
        bullet("Winrates > 60% zonder \u201CBOTD alleen, N picks\u201D kwalificatie"),

        h1("5. Privacy & Gegevensbescherming (AVG)"),

        h2("5.1 Verwerkingsverantwoordelijke"),
        p("BetsPlug B.V. is de verwerkingsverantwoordelijke voor persoonsgegevens die via het platform worden verwerkt. Contact: via de contactpagina op de website."),

        h2("5.2 Verzamelde Gegevens"),
        table2col([
          ["Datacategorie", "Doel"],
          ["E-mailadres", "Account toegang en authenticatie"],
          ["Gebruikersnaam", "Profielidentificatie"],
          ["Abonnementsniveau", "Feature gating"],
          ["Bekeken voorspellingen", "Dienstlevering (track record)"],
          ["Login timestamps", "Beveiliging en fraudedetectie"],
          ["Betaalgegevens (kaart, IBAN)", "NIET opgeslagen door BetsPlug \u2014 volledig via Stripe"],
        ]),
        explainBox("BetsPlug slaat uw e-mailadres, gebruikersnaam en abonnementsstatus op. Betaalgegevens worden verwerkt door Stripe; BetsPlug ziet of bewaart uw kaartgegevens nooit."),

        h2("5.3 Grondslag voor Verwerking"),
        bullet("Contract (AVG Art. 6(1)(b)): accountdata noodzakelijk voor dienstlevering"),
        bullet("Wettelijke verplichting (AVG Art. 6(1)(c)): belasting- en boekhoudgegevens"),
        bullet("Gerechtvaardigd belang (AVG Art. 6(1)(f)): fraudepreventie, beveiligingslogs"),
        bullet("Toestemming (AVG Art. 6(1)(a)): marketing communicatie (opt-in, herroepelijk)"),

        h2("5.4 Gebruikersrechten onder AVG"),
        bullet("Recht op inzage: download uw data via account instellingen"),
        bullet("Recht op rectificatie: werk profielinformatie bij"),
        bullet("Recht op vergetelheid: verwijder account (alle data weg)"),
        bullet("Recht op dataportabiliteit: export data in JSON/CSV formaat"),
        bullet("Recht op bezwaar: opt-out voor marketing"),
        bullet("Recht op klacht: bij de Autoriteit Persoonsgegevens (NL)"),

        h2("5.5 Bewaartermijnen"),
        table2col([
          ["Datatype", "Bewaartermijn"],
          ["Actieve accountdata", "Tot account verwijdering"],
          ["Verwijderde accountdata", "Verwijderd binnen 30 dagen"],
          ["Financi\u00EBle gegevens (facturen)", "7 jaar (wettelijke verplichting NL)"],
          ["Beveiligingslogs", "90 dagen"],
          ["Geanonimiseerde analytics", "Onbepaald (geen persoonsgegevens)"],
        ]),

        h2("5.6 Datalocatie & Doorgiften"),
        bullet("Alle data opgeslagen op Europese servers (Railway EU regio, Vercel EU edge)"),
        bullet("Geen doorgifte buiten de EU/EER"),
        bullet("API-Football Pro is een gelicentieerde databron \u2014 BetsPlug leest alleen wedstrijddata, geen persoonsgegevens gedeeld"),
        bullet("Stripe (betalingsverwerker) is AVG-conform met standaardcontractbepalingen"),

        h2("5.7 Geautomatiseerde Besluitvorming"),
        p("BetsPlug's voorspellingsalgoritmen nemen geen beslissingen die gebruikers juridisch of aanzienlijk treffen. Voorspellingen zijn uitsluitend informatieve output. Feature-gating op basis van abonnementsniveau is een contractuele kwestie, geen geautomatiseerde profilering onder AVG Art. 22."),

        h1("6. Intellectueel Eigendom"),

        h2("6.1 BetsPlug-eigendom"),
        bullet("Broncode voorspellingsengine"),
        bullet("Getrainde machine learning modellen (gewichten, scalers)"),
        bullet("Feature engineering logica"),
        bullet("Website design, branding, logo"),
        bullet("Gegenereerde voorspellingen (als output van gelicentieerde inputs)"),

        h2("6.2 Gelicentieerde Data"),
        bullet("API-Football Pro: wedstrijdfixtures, uitslagen, statistieken \u2014 gebruikt onder commerci\u00EBle licentie"),
        bullet("Bookmaker odds (indien getoond): gebruikt onder geldende voorwaarden van The Odds API of vergelijkbaar"),
        p("Alle data wordt gebruikt binnen de voorwaarden van de respectievelijke licenties. BetsPlug scrapet geen data uit ongeautoriseerde bronnen."),

        h2("6.3 Gebruikersgegenereerde Content"),
        p("Gebruikers genereren geen publieke content op het platform. Priv\u00E9 notities en favorieten blijven eigendom van de gebruiker en worden verwijderd bij account verwijdering."),

        h1("7. Gebruiksvoorwaarden"),

        h2("7.1 Abonnementsmodel"),
        bullet("Gelaagde toegang: Free Access (Bronze, gratis), Silver, Gold en Platinum (lifetime)"),
        bullet("Silver en Gold zijn maandelijks terugkerende abonnementen, gefactureerd via Stripe"),
        bullet("Platinum is een eenmalige lifetime-betaling via Stripe; deze wordt niet automatisch verlengd"),
        bullet("Doorlopende abonnementen worden automatisch verlengd totdat de klant opzegt"),
        bullet("Klanten kunnen hun abonnement op elk moment beheren, upgraden, downgraden of opzeggen via de in-app Stripe Billing Portal"),
        bullet("Opzegging: effectief aan het einde van de huidige factureringsperiode; geen pro-rata terugbetaling voor ongebruikte dagen"),
        bullet("Bij upgraden van een doorlopend abonnement naar Platinum lifetime wordt het lopende abonnement automatisch opgezegd zodat de klant nooit dubbel betaalt"),
        bullet("Prijswijzigingen: 30 dagen opzegtermijn vereist"),

        h2("7.2 Acceptabel Gebruik"),
        p("Gebruikers stemmen ermee in om NIET:"),
        bullet("De voorspellingsengine te scrapen of reverse-engineeren"),
        bullet("Accountgegevens te delen"),
        bullet("Voorspellingen door te verkopen of verspreiden zonder Platinum API licentie"),
        bullet("De dienst te gebruiken om gokregelgeving te omzeilen in hun jurisdictie"),
        bullet("De dienst te gebruiken onder de 18 jaar"),

        h2("7.3 Aansprakelijkheidsbeperkingen"),
        warningBox("BetsPlug aanvaardt GEEN aansprakelijkheid voor financi\u00EBle verliezen die ontstaan door het gebruik van haar voorspellingen. Voorspellingen zijn enkel schattingen. Prestaties uit het verleden zijn geen indicatie voor toekomstige resultaten. Gebruikers maken hun eigen beoordeling."),
        p("Specifiek:"),
        bullet("Maximale aansprakelijkheid BetsPlug is beperkt tot het bedrag betaald in de laatste 12 maanden"),
        bullet("BetsPlug is niet aansprakelijk voor indirecte, gevolg- of bijzondere schade"),
        bullet("Overmacht (API-uitval, dataprovider storingen) geeft geen aanleiding tot claims"),
        bullet("Lokale gokverliezen zijn volledig de verantwoordelijkheid van de gebruiker"),

        h2("7.4 Geschillenbeslechting"),
        bullet("Toepasselijk recht: Nederlands recht"),
        bullet("Bevoegde rechtbank: Rechtbank Amsterdam"),
        bullet("Consument-gebruikers kunnen rechten onder EU consumentenbeschermingsrichtlijnen inroepen"),
        bullet("Vooraf-procesgang: gebruikers moeten eerst proberen op te lossen via contactpagina"),

        h2("7.5 Wijzigingen Voorwaarden"),
        p("BetsPlug behoudt het recht om Gebruiksvoorwaarden bij te werken. Materi\u00EBle wijzigingen vereisen 30 dagen opzegging; gebruikers mogen hun abonnement opzeggen als ze het niet eens zijn met nieuwe voorwaarden."),

        h1("8. Risico-informatie"),
        p("Essenti\u00EBle beperkingen die gebruikers en belanghebbenden moeten begrijpen:"),
        bullet("Voorspellingen zijn statistische schattingen, geen zekerheden. Voetbal is inherent onvoorspelbaar."),
        bullet("Prestaties uit het verleden bieden geen garantie voor toekomstige resultaten. Marktomstandigheden, spelerslijsten, weer, blessures en vele andere factoren be\u00EFnvloeden uitkomsten."),
        bullet("Het model kan onderpresteren bij anomaliteiten: pandemie\u00EBn, stakingen of drastische regelwijzigingen."),
        bullet("Nauwkeurigheid verschilt per competitie, toernooi en confidence niveau."),
        bullet("BetsPlug informatie mag nooit de enige basis zijn voor financi\u00EBle beslissingen."),
        bullet("Zet nooit geld in dat u niet kunt missen."),
        explainBox("Vergelijk het met een weersvoorspelling: 70% kans op regen betekent dat het in 3 van de 10 gevallen NIET regent. Zelfs de beste voorspelling is geen garantie. BetsPlug werkt op dezelfde manier \u2014 het geeft kansen, geen zekerheden."),

        h1("9. Contact & Organisatie"),
        table2col([
          ["Onderdeel", "Details"],
          ["Rechtspersoon", "BetsPlug B.V."],
          ["Statutaire vestiging", "Nederland"],
          ["Website", "https://betsplug.com"],
          ["Algemeen contact", "Via de contactpagina op de website"],
          ["Privacy/AVG verzoeken", "Via contactpagina (tag: 'AVG' of 'GDPR')"],
          ["Functionaris Gegevensbescherming", "Aan te wijzen wanneer gebruikersbestand AVG Art. 37 drempel overschrijdt"],
          ["Bevoegde toezichthouder", "Autoriteit Persoonsgegevens (NL)"],
          ["Documentversie", "8.1 (april 2026)"],
        ]),

        new Paragraph({ spacing: { before: 600 } }),
        p("\u2014 Einde document \u2014", { italics: true, color: "999999" }),
      ],
    },
  ],
});

const OUTPUT = "C:\\Users\\denni\\Documents\\Claude coding\\Sportbetting\\docs\\BetsPlug-Juridisch-Kader-NL.docx";
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Created: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}).catch(err => { console.error("Error:", err.message); process.exit(1); });
