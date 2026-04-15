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
      new TextRun({ text: "Wat betekent dit? ", bold: true, size: 20, font: "Arial", color: BLUE }),
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
      new TextRun({ text: "Kwaliteitseis: ", bold: true, size: 20, font: "Arial", color: "1e6b3a" }),
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
          children: [new TextRun({ text: "Versie 8.0  |  April 2026", size: 22, font: "Arial", color: "444444" })],
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
        p("BetsPlug is een online platform dat met behulp van kunstmatige intelligentie (AI) voorspellingen maakt over de uitslag van voetbalwedstrijden. Het platform is uitsluitend bedoeld voor educatieve en informatieve doeleinden. BetsPlug organiseert geen gokactiviteiten, accepteert geen inzetten en verwerkt geen weddenschappen."),
        p("Het systeem is getraind op 43.257 echte wedstrijden uit 30 verschillende competities, verzameld over 5,5 jaar (augustus 2020 \u2014 april 2026). Alle data komt uit \u00E9\u00E9n gelicentieerde professionele databron (API-Football Pro). Geen externe of willekeurige data."),
        p("Om de betrouwbaarheid te bewijzen is het systeem getest via \u201Cwalk-forward validatie\u201D: het model wordt getraind op het verleden en getest op wedstrijden die het nog nooit heeft gezien. Deze test is uitgevoerd op 28.838 wedstrijden verdeeld over 4 aparte periodes. De resultaten zijn consistent en eerlijk \u2014 geen data-leakage, geen gebruik van toekomstinformatie."),
        p("Het model behaalt op zeer zekere voorspellingen (confidence \u2265 70%) een nauwkeurigheid van 74,4% op 2.473 test-picks \u2014 een professioneel niveau volgens internationale benchmarks.", { bold: true }),

        // 2. Platformoverzicht
        h1("2. Wat is BetsPlug?"),
        p("BetsPlug is een webapplicatie waar gebruikers kunnen inloggen om AI-gegenereerde voetbalvoorspellingen te bekijken. Het platform werkt als een abonnementsdienst met verschillende niveaus:"),
        table2col([
          ["Onderdeel", "Uitleg"],
          ["Gratis niveau", "Beperkte toegang: dagelijkse Pick van de Dag, basisstatistieken"],
          ["Silver / Gold / Platinum", "Uitgebreide toegang: filtering op betrouwbaarheidsniveau, volledige trackrecord, exports"],
          ["Competities", "30 voetbalcompetities wereldwijd, waaronder Eredivisie, Premier League, Champions League, Saudi Pro League"],
          ["Databron", "Uitsluitend API-Football Pro (gelicentieerd, betaalde abonnement)"],
          ["Betalingen", "Via Stripe \u2014 BetsPlug slaat zelf geen creditcardgegevens op"],
        ]),
        explainBox("BetsPlug is vergelijkbaar met een weerstation dat het weer voorspelt: het geeft een inschatting op basis van data, maar kan het weer niet garanderen. Net zo geeft BetsPlug een inschatting van wedstrijduitslagen, maar garandeert geen resultaat."),

        // 3. Hoe werkt de voorspelling?
        h1("3. Hoe werkt de voorspelling?"),

        h2("3.1 De modellen \u2014 hoe komt een voorspelling tot stand?"),
        p("Het systeem combineert meerdere wiskundige modellen die elk op een andere manier naar wedstrijddata kijken. Door deze perspectieven samen te voegen, ontstaat een nauwkeurigere voorspelling dan elk model alleen zou geven."),

        p("Model 1: Elo-ratingsysteem", { bold: true }),
        p("Elk team krijgt een \u201CElo-score\u201D \u2014 een getal dat aangeeft hoe sterk het team is. Hoe meer wedstrijden een team wint (vooral tegen sterke tegenstanders), hoe hoger de score. Het systeem vergelijkt de Elo-scores van beide teams om te bepalen wie de favoriet is. Alle Elo-scores worden chronologisch opgebouwd uit 43.257 historische wedstrijden."),

        p("Model 2: Logistische Regressie", { bold: true }),
        p("Dit model kijkt naar 39 verschillende factoren tegelijk, bijvoorbeeld: teamvorm laatste 5 wedstrijden, thuis/uit-specifieke prestaties, onderling resultaat, seizoensstatistieken, rustdagen tussen wedstrijden, scoring-consistentie. Het model heeft geleerd van duizenden historische wedstrijden welke combinatie van factoren het best de uitslag voorspelt."),

        p("Model 3: XGBoost (Gradient Boosting)", { bold: true }),
        p("Een geavanceerd machine-learningmodel dat niet-lineaire patronen kan vinden tussen de 39 factoren. Waar Logistische Regressie alleen rechte verbanden ziet, kan XGBoost complexe interacties detecteren (bijvoorbeeld: \u201Ceen sterk thuisteam tegen een vermoeide uitploeg met weinig rust\u201D)."),

        p("De drie modellen worden samengevoegd met gewichten. De verhouding (Elo 1.2, Logistisch 2.0, XGBoost 1.0) is bepaald door wetenschappelijke validatie op de historische dataset."),

        explainBox("Stel je voor dat je drie experts vraagt wie een wedstrijd wint. Expert 1 (Elo) kijkt alleen naar de algemene sterkte van teams. Expert 2 (Logistisch) kijkt naar 39 details. Expert 3 (XGBoost) zoekt naar ingewikkelde patronen. Je luistert naar alle drie, maar geeft Expert 2 meer gewicht omdat die het vaakst gelijk heeft. Dat is wat BetsPlug doet."),

        h2("3.2 Beveiliging tegen vals spelen met data (anti-leakage)"),
        p("Een groot risico bij voorspellingssystemen is dat ze per ongeluk gebruikmaken van informatie die op het moment van de voorspelling nog niet beschikbaar was. Bijvoorbeeld: als het systeem de uitslag van een wedstrijd zou kennen terwijl het die wedstrijd probeert te voorspellen, zou het vals spelen."),
        p("BetsPlug heeft meerdere lagen beveiliging ingebouwd om dit te voorkomen:"),
        bullet("Teamsterktes (Elo-scores) worden alleen berekend tot het moment V\u00D3\u00D3R de aftrap \u2014 nooit erna"),
        bullet("Teamvorm (laatste 5/10 wedstrijden) bevat alleen wedstrijden die al gespeeld waren v\u00F3\u00F3r de te voorspellen wedstrijd"),
        bullet("Onderlinge resultaten bevatten uitsluitend eerdere ontmoetingen, nooit de wedstrijd zelf"),
        bullet("Seizoensstatistieken (doelpunten, winstpercentage) worden \u201Cpoint-in-time\u201D berekend: alleen uit wedstrijden v\u00F3\u00F3r de kickoff"),
        bullet("Het systeem heeft een ingebouwde \u201Ctripwire\u201D: als per ongeluk toekomstige data wordt gebruikt, stopt het automatisch met een foutmelding (FeatureLeakageError)"),
        p("De afwezigheid van leakage is bewezen met drie onafhankelijke controle-tests (zie sectie 9 Kwaliteitseisen)."),
        explainBox("Dit is vergelijkbaar met een toets op school: als een leerling de antwoorden al kent, is de toets niet eerlijk. BetsPlug zorgt ervoor dat het systeem de \u201Cantwoorden\u201D (de wedstrijduitslag) nooit kan zien voordat het de voorspelling maakt."),

        h2("3.3 Walk-forward validatie \u2014 hoe meten we de echte prestatie?"),
        p("Het model wordt getest via \u201Cwalk-forward validatie\u201D, de gouden standaard in statistiek voor tijdsafhankelijke data:"),
        bullet("Periode 1: train op wedstrijden v\u00F3\u00F3r dec 2021, test op dec 2021 \u2014 sep 2022"),
        bullet("Periode 2: train op alles v\u00F3\u00F3r sep 2022, test op sep 2022 \u2014 jul 2023"),
        bullet("Periode 3: train op alles v\u00F3\u00F3r jul 2023, test op jul 2023 \u2014 apr 2024"),
        bullet("Periode 4: train op alles v\u00F3\u00F3r apr 2024, test op apr 2024 \u2014 apr 2026"),
        p("Bij elke periode wordt het model volledig opnieuw getraind zonder toegang tot de testdata. De resultaten uit de 4 periodes worden samengevoegd tot \u00E9\u00E9n totaalscore."),
        explainBox("In plaats van \u00E9\u00E9n grote toets geven we het systeem vier aparte toetsen verspreid over 2,5 jaar. Daardoor weten we zeker dat het systeem niet toevallig goed scoort \u2014 het doet het consistent goed over verschillende tijdsperiodes."),

        h2("3.4 Hoe goed presteert het systeem?"),
        p("Het systeem is getoetst op 28.838 wedstrijden die het model nog nooit had gezien. De resultaten:"),
        table2col([
          ["Metriek", "Resultaat"],
          ["Totaal test-picks (walk-forward)", "28.838 wedstrijden over 4 periodes"],
          ["Willekeurig gokken (thuis/gelijk/uit)", "33,3%"],
          ["Altijd \u201Cthuis\u201D voorspellen", "43,5% (meest voorkomende uitkomst)"],
          ["Alle voorspellingen meegerekend", "49,2%"],
          ["Confidence \u2265 50%", "58,9% op 12.735 picks"],
          ["Confidence \u2265 55%", "63,0% op 8.951 picks"],
          ["Confidence \u2265 60%", "67,4% op 6.060 picks"],
          ["Confidence \u2265 65%", "70,6% op 3.942 picks"],
          ["Confidence \u2265 70%", "74,4% op 2.473 picks"],
          ["Confidence \u2265 75% (Premium picks)", "78,2% op 1.497 picks"],
        ]),
        p("Het systeem gebruikt een \u201Cconfidence filter\u201D: alleen voorspellingen waar het model erg zeker van is worden getoond als premium picks. Hoe hoger de drempel, hoe nauwkeuriger de voorspelling, maar hoe minder wedstrijden ervoor in aanmerking komen."),
        explainBox("Bij voetbal zijn er drie mogelijke uitslagen: thuiswinst, gelijkspel, of uitwinst. Als je willekeurig gokt heb je 33% kans op goed. BetsPlug scoort op zeer zekere voorspellingen (\u2265 70% confidence) 74,4% \u2014 meer dan twee keer zo goed als gokken. Dit is vergelijkbaar met professionele voorspellingsdiensten op internationaal niveau."),

        // 4. Eerlijkheid en transparantie
        h1("4. Eerlijkheid & Transparantie"),

        h2("4.1 Twee aparte track records"),
        p("BetsPlug houdt twee aparte scoreborden bij:"),
        bullet("Live track record: alleen voorspellingen die aantoonbaar V\u00D3\u00D3R de wedstrijd zijn gemaakt, met tijdstempelbewijs"),
        bullet("Backtest track record: historische simulaties uit de walk-forward validatie, duidelijk als zodanig gelabeld"),
        p("Gebruikers kunnen via de website filteren welk type ze willen zien. CSV-exports bevatten altijd de bron (live of backtest), het aantal uren voor aftrap, en alle evaluatiegegevens."),

        h2("4.2 Eerlijke financi\u00EBle berekeningen"),
        p("Winst- en verliesberekeningen worden uitsluitend gemaakt met echte bookmaker-odds van gelicentieerde databronnen. Het systeem berekent GEEN nep-winst op basis van eigen kansschattingen \u2014 dat zou neerkomen op zelfbeoordeling."),
        bullet("Wanneer echte odds beschikbaar zijn: W/V wordt berekend op basis van die odds"),
        bullet("Wanneer geen echte odds beschikbaar zijn: W/V wordt als \u201Conbekend\u201D gerapporteerd, niet geschat"),
        bullet("Bij elke metriek wordt vermeld welk percentage van de picks echte odds had"),
        explainBox("Stel: het model zegt \u201C60% kans op thuiswinst\u201D. Als we dan zelf odds berekenen (1/0.60 = 1.67) en zeggen \u201Cwe maakten winst!\u201D, dan beoordeelt het model zichzelf. BetsPlug doet dit niet \u2014 we gebruiken alleen echte bookmaker-odds."),

        h2("4.3 Verplichte waarschuwingen"),
        p("Elke voorspelling die BetsPlug toont, bevat de volgende disclaimer:"),
        p("\u201CSIMULATIE / UITSLUITEND EDUCATIEF GEBRUIK. Deze kansschattingen zijn gegenereerd door een statistisch model voor onderzoeks- en educatieve doeleinden. Ze vormen GEEN financieel, gok- of beleggingsadvies. Prestaties uit het verleden bieden geen garantie voor toekomstige resultaten. Gok altijd verantwoord en binnen de geldende wetgeving.\u201D", { italics: true, size: 20 }),

        // 5. Juridisch kader
        h1("5. Juridisch Kader"),

        h2("5.1 Wat is BetsPlug WEL en wat NIET?"),
        p("BetsPlug is een informatiedienst die statistische analyses aanbiedt. Het is belangrijk te begrijpen wat het platform WEL en NIET is:"),
        table2col([
          ["BetsPlug is WEL", "BetsPlug is NIET"],
          ["Een informatieplatform met AI-analyses", "Een gokbedrijf of casino"],
          ["Een educatieve dienst over sportstatistiek", "Een tipgevendienst die winst garandeert"],
          ["Een abonnementsdienst voor data-inzichten", "Financieel of beleggingsadvies"],
        ]),
        p("BetsPlug accepteert geen inzetten, organiseert geen weddenschappen en faciliteert op geen enkele wijze gokactiviteiten. Het platform valt onder de EU Digital Services Act als informatiedienst."),

        h2("5.2 Verantwoord gokken"),
        p("Hoewel BetsPlug zelf geen gokdienst is, erkent het platform dat sommige gebruikers de informatie mogelijk gebruiken in combinatie met gokactiviteiten. Daarom neemt BetsPlug de volgende maatregelen:"),
        bullet("Verplichte disclaimer bij elke voorspelling"),
        bullet("Duidelijke vermelding dat nauwkeurigheid niet gegarandeerd is"),
        bullet("De boodschap \u201CResultaten uit het verleden bieden geen garantie voor de toekomst\u201D"),
        bullet("Leeftijdsverificatie (18+) bij het afsluiten van een abonnement"),
        bullet("Mogelijkheid tot zelfuitsluiting: gebruikers kunnen hun account volledig verwijderen"),

        h2("5.3 Privacy en gegevensbescherming (AVG/GDPR)"),
        p("BetsPlug verwerkt zo min mogelijk persoonsgegevens, in volledige overeenstemming met de Algemene Verordening Gegevensbescherming (AVG):"),
        table2col([
          ["Wat we bewaren", "Waarom"],
          ["E-mailadres en gebruikersnaam", "Nodig om in te loggen en het account te beheren"],
          ["Abonnementsstatus", "Om te bepalen welke content toegankelijk is"],
          ["Betaalgegevens (creditcard, IBAN)", "Worden NIET door BetsPlug opgeslagen \u2014 Stripe verwerkt alle betalingen"],
          ["Voorspellingsgeschiedenis", "Om het track record te tonen en de dienst te leveren"],
        ]),
        bullet("Recht op vergetelheid: u kunt uw account en alle gegevens laten verwijderen via de instellingen of een AVG-verzoek"),
        bullet("Gegevensverwerking vindt plaats op Europese servers (Railway EU, Vercel EU)"),
        bullet("Er vindt geen profilering of geautomatiseerde besluitvorming plaats die gebruikers raakt"),

        h2("5.4 Intellectueel eigendom en licenties"),
        p("Het voorspellingssysteem is volledig in eigen huis ontwikkeld. De data waarop het systeem draait, is gelicentieerd van \u00E9\u00E9n professionele dataleverancier:"),
        bullet("API-Football (Pro-licentie): levert wedstrijddata, uitslagen, teamstatistieken, standings voor 30 competities"),
        p("Alle data wordt gebruikt binnen de voorwaarden van de licentie. Er wordt geen data van onbetrouwbare of gratis bronnen gebruikt om inconsistenties in het model te voorkomen."),

        // 6. Risico-informatie
        h1("6. Risico-informatie"),
        p("Het is essentieel dat gebruikers en belanghebbenden de beperkingen van het systeem begrijpen:"),
        bullet("Voorspellingen zijn schattingen op basis van historische patronen \u2014 geen zekerheden. Voetbal is onvoorspelbaar en verrassingen zijn onvermijdelijk."),
        bullet("Dat het systeem in het verleden 74% scoorde op premium picks, betekent niet dat het in de toekomst hetzelfde zal doen. Omstandigheden veranderen."),
        bullet("Het model kan onderpresteren bij ongewone situaties, zoals pandemie\u00EBn, stakingen, of drastische regelwijzigingen."),
        bullet("De nauwkeurigheid verschilt per competitie: sommige competities (zoals Premier League) zijn moeilijker voorspelbaar dan andere."),
        bullet("Gebruik informatie van BetsPlug nooit als enige basis voor financi\u00EBle beslissingen. Zet nooit geld in dat u niet kunt missen."),
        bullet("BetsPlug aanvaardt geen enkele aansprakelijkheid voor financi\u00EBle verliezen die ontstaan door het gebruik van haar voorspellingen."),
        explainBox("Vergelijk het met een weersvoorspelling: 70% kans op regen betekent dat het in 3 van de 10 gevallen NIET regent. Zelfs de beste voorspelling is geen garantie. BetsPlug werkt op dezelfde manier \u2014 het geeft kansen, geen zekerheden."),

        // 7. Controleerbaarheid
        h1("7. Controleerbaarheid & Naspeurbaarheid"),
        p("Elke voorspelling die BetsPlug maakt, wordt permanent opgeslagen met alle achterliggende gegevens. Dit maakt het mogelijk om achteraf precies na te gaan hoe een voorspelling tot stand is gekomen:"),
        bullet("Tijdstempel: wanneer de voorspelling is gemaakt (bewijs dat het v\u00F3\u00F3r de wedstrijd was)"),
        bullet("Modelversie: welke versie van het systeem de voorspelling heeft gemaakt"),
        bullet("Kenmerken-snapshot: alle 39 datapunten die op dat moment zijn gebruikt"),
        bullet("Ruwe modeluitvoer: de exacte berekeningen van elk submodel (Elo, Logistisch, XGBoost)"),
        bullet("Evaluatierecord: de vergelijking met de daadwerkelijke wedstrijduitslag"),
        p("Al deze gegevens zijn reproduceerbaar: als je dezelfde input geeft, krijg je dezelfde uitvoer. Alle wijzigingen aan het systeem worden bijgehouden in een versiebeheersysteem (git)."),

        // 8. Datakwaliteit & validatie
        h1("8. Datakwaliteit & Validatie"),
        p("BetsPlug hanteert strikte normen voor de data die in het model gaat. Alle data wordt uit \u00E9\u00E9n bron gehaald (API-Football Pro) om inconsistenties te voorkomen."),
        table2col([
          ["Kwaliteitsaspect", "Status"],
          ["Databron", "API-Football Pro (gelicentieerd, betaald abonnement)"],
          ["Aantal wedstrijden", "43.257 finished matches"],
          ["Aantal competities", "30 wereldwijd"],
          ["Historische diepte", "5,5 jaar (aug 2020 \u2014 apr 2026)"],
          ["Aantal teams", "1.082 unieke teams"],
          ["Point-in-time correctheid", "Afgedwongen door FeatureLeakageError tripwire"],
          ["Reproduceerbaarheid", "100% \u2014 vaste seed voor alle training"],
        ]),

        // 9. KWALITEITSEISEN (NIEUW)
        h1("9. Kwaliteitseisen voor de Prediction Engine"),
        p("Om de kwaliteit en betrouwbaarheid van BetsPlug te waarborgen, hanteert het platform de volgende kwaliteitseisen. Elke toekomstige wijziging aan de engine moet aan deze eisen voldoen voordat het live gaat."),

        h2("9.1 Eisen aan de trainingsdata"),
        qualityBox("Data komt uitsluitend uit \u00E9\u00E9n gelicentieerde betaalde bron (API-Football Pro). Geen data van gratis of externe bronnen."),
        qualityBox("Minimaal 20.000 wedstrijden in de trainingsdata over minimaal 3 seizoenen."),
        qualityBox("Alle uitslagen moeten een \u201Cwinner\u201D-veld hebben (home/draw/away) en kloppen met de scores."),
        qualityBox("Wedstrijden met ontbrekende scores worden uitgesloten van training."),

        h2("9.2 Eisen aan feature-engineering"),
        qualityBox("Alle features moeten \u201Cpoint-in-time\u201D zijn: alleen data van v\u00F3\u00F3r de kickoff."),
        qualityBox("De FeatureLeakageError tripwire moet actief zijn en fouten opwerpen bij poging tot toekomst-data gebruik."),
        qualityBox("Minimaal 30 features in het model, gedocumenteerd met uitleg wat elke feature meet."),
        qualityBox("Alle features moeten deterministisch zijn: dezelfde input geeft dezelfde output."),

        h2("9.3 Eisen aan modeltraining"),
        qualityBox("Train/test split moet temporeel zijn (training v\u00F3\u00F3r test), nooit random."),
        qualityBox("Minimaal 4 walk-forward validatie-folds."),
        qualityBox("Controle-tests (shuffled labels, random features) moeten bij de majority baseline uitkomen, niet hoger."),
        qualityBox("Het model moet minimaal 2 procentpunten beter scoren dan de majority class baseline."),
        qualityBox("Geen hyperparameter-tuning op de test-set (data lekkage)."),

        h2("9.4 Eisen aan productie-deployment"),
        qualityBox("Nieuwe modelversies mogen pas live als walk-forward validatie met voldoende samples succesvol is."),
        qualityBox("Alle voorspellingen moeten gelogd worden met timestamp, model version en feature snapshot."),
        qualityBox("Een voorspelling gemaakt v\u00F3\u00F3r de kickoff is \u201Clive\u201D, alle andere zijn \u201Cbacktest\u201D."),
        qualityBox("Het model moet automatisch uitschakelen als de health check faalt."),

        h2("9.5 Eisen aan transparantie voor gebruikers"),
        qualityBox("Elke voorspelling toont het confidence-niveau duidelijk."),
        qualityBox("De trackrecord-pagina scheidt live van backtest data."),
        qualityBox("Geen ROI-claims zonder echte bookmaker-odds (geen fake odds aanname)."),
        qualityBox("Verplichte disclaimer op elke voorspelling."),
        qualityBox("Sample size wordt altijd vermeld bij elke accuracy-claim."),

        h2("9.6 Eisen aan auditeerbaarheid"),
        qualityBox("Alle code-wijzigingen in git vastgelegd met beschrijvende commit messages."),
        qualityBox("Elke release heeft een bijbehorend validatierapport."),
        qualityBox("Trainingsdata, features, en modelparameters zijn altijd reconstrueerbaar."),
        qualityBox("Externe audit moet mogelijk zijn via leesrechten op de database en codebase."),

        h2("9.7 Prestatiedrempels"),
        p("Als de prestatie onder deze waarden zakt, wordt het model herzien:"),
        table2col([
          ["Metriek", "Minimum drempel"],
          ["Overall accuracy (alle picks)", "\u2265 47%"],
          ["Accuracy bij confidence \u2265 60%", "\u2265 60%"],
          ["Accuracy bij confidence \u2265 70%", "\u2265 65%"],
          ["Brier score (calibration)", "\u2264 0,22"],
          ["Backtest \u2194 live verschil", "\u2264 5 procentpunten"],
        ]),

        // 10. Contact
        h1("10. Contact & Organisatie"),
        table2col([
          ["Onderdeel", "Details"],
          ["Rechtspersoon", "BetsPlug B.V."],
          ["Website", "https://betsplug.com"],
          ["Technisch contact", "Via de contactpagina op de website"],
          ["Privacyverzoeken", "AVG-verzoeken via de contactpagina"],
          ["Documentversie", "8.0 (april 2026)"],
          ["Laatste validatie", "15 april 2026 (walk-forward op 28.838 picks)"],
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
