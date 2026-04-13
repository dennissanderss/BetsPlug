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
// Explanation box — gray background paragraph for "what does this mean?" context
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
        p("BetsPlug is een online platform dat met behulp van kunstmatige intelligentie (AI) voorspellingen maakt over de uitslag van voetbalwedstrijden. Het platform is uitsluitend bedoeld voor educatieve en informatieve doeleinden. BetsPlug organiseert geen gokactiviteiten, accepteert geen inzetten en verwerkt geen weddenschappen."),
        p("Het systeem analyseert jarenlange wedstrijddata \u2014 denk aan uitslagen, teamvorm, onderlinge resultaten en competitiestanden \u2014 om een inschatting te maken van de meest waarschijnlijke uitslag van een aankomende wedstrijd. Elke voorspelling wordt vergezeld van een duidelijke vermelding dat het om een simulatie gaat en geen garantie op winst biedt."),
        p("Om de betrouwbaarheid van het systeem aan te tonen, is het uitvoerig getest: 1.295 verschillende configuraties zijn getoetst op meer dan 6.500 historische wedstrijden. De resultaten op data die het systeem nooit eerder had gezien (het jaar 2026) komen overeen met de resultaten op trainingsdata \u2014 dit bevestigt dat het systeem betrouwbaar werkt en niet is \u201Coverfitted\u201D (te specifiek afgestemd op historische data)."),

        // 2. Platformoverzicht
        h1("2. Wat is BetsPlug?"),
        p("BetsPlug is een webapplicatie waar gebruikers kunnen inloggen om AI-gegenereerde voetbalvoorspellingen te bekijken. Het platform werkt als een abonnementsdienst met verschillende niveaus:"),
        table2col([
          ["Onderdeel", "Uitleg"],
          ["Gratis niveau", "Beperkte toegang: 3 dagelijkse voorspellingen, basisstatistieken"],
          ["Silver / Gold / Platinum", "Uitgebreide toegang: alle voorspellingen, track record, exports, Pick van de Dag"],
          ["Competities", "24 voetbalcompetities wereldwijd, waaronder Eredivisie, Premier League, Champions League"],
          ["Databronnen", "Professionele sportdata-API\u2019s (API-Football, Football-Data.org, The Odds API)"],
          ["Betalingen", "Via Stripe \u2014 BetsPlug slaat zelf geen creditcardgegevens op"],
        ]),
        explainBox("BetsPlug is vergelijkbaar met een weerstation dat het weer voorspelt: het geeft een inschatting op basis van data, maar kan het weer niet garanderen. Net zo geeft BetsPlug een inschatting van wedstrijduitslagen, maar garandeert geen resultaat."),

        // 3. Hoe werkt de voorspelling?
        h1("3. Hoe werkt de voorspelling?"),

        h2("3.1 De modellen \u2014 hoe komt een voorspelling tot stand?"),
        p("Het systeem combineert twee wiskundige modellen die elk op een andere manier naar wedstrijddata kijken. Door deze twee perspectieven samen te voegen, ontstaat een nauwkeurigere voorspelling dan elk model alleen zou geven."),

        p("Model 1: Elo-ratingsysteem", { bold: true }),
        p("Elk team krijgt een \u201CElo-score\u201D \u2014 een getal dat aangeeft hoe sterk het team is. Hoe meer wedstrijden een team wint (vooral tegen sterke tegenstanders), hoe hoger de score. Het systeem vergelijkt de Elo-scores van beide teams om te bepalen wie de favoriet is. Vergelijk het met een rankingsysteem in tennis of schaken."),

        p("Model 2: Logistische Regressie", { bold: true }),
        p("Dit model kijkt naar 43 verschillende factoren tegelijk, bijvoorbeeld: hoe heeft het team de laatste 5 wedstrijden gepresteerd? Hoe vaak wonnen ze thuis? Hoe is het onderlinge resultaat? Wat is het verschil in competitiestand? Het model heeft geleerd van duizenden historische wedstrijden welke combinatie van factoren het best de uitslag voorspelt."),

        p("De twee modellen worden samengevoegd met een gewicht: het Logistische model telt 2x zo zwaar mee als het Elo-model, omdat uit tests bleek dat dit de beste resultaten geeft."),

        explainBox("Stel je voor dat je twee experts vraagt wie een wedstrijd wint. Expert 1 (Elo) kijkt alleen naar de algemene sterkte van teams. Expert 2 (Logistisch) kijkt naar 43 details. Je luistert naar allebei, maar geeft Expert 2 meer gewicht omdat die vaker gelijk heeft. Dat is wat BetsPlug doet."),

        h2("3.2 Beveiliging tegen vals spelen met data"),
        p("Een groot risico bij voorspellingssystemen is dat ze per ongeluk gebruikmaken van informatie die op het moment van de voorspelling nog niet beschikbaar was. Bijvoorbeeld: als het systeem de uitslag van een wedstrijd zou kennen terwijl het die wedstrijd probeert te voorspellen, zou het vals spelen."),
        p("BetsPlug heeft meerdere beveiligingen ingebouwd om dit te voorkomen:"),
        bullet("Teamsterktes (Elo-scores) worden alleen opgehaald tot het moment V\u00D3\u00D3R de aftrap \u2014 nooit erna"),
        bullet("Teamvorm (de laatste 5 wedstrijden) bevat alleen wedstrijden die al gespeeld waren v\u00F3\u00F3r de te voorspellen wedstrijd"),
        bullet("Onderlinge resultaten bevatten uitsluitend eerdere ontmoetingen, nooit de wedstrijd zelf"),
        bullet("Als het systeem detecteert dat er per ongeluk toekomstige data wordt gebruikt, stopt het automatisch met een foutmelding"),
        explainBox("Dit is vergelijkbaar met een toets op school: als een leerling de antwoorden al kent, is de toets niet eerlijk. BetsPlug zorgt ervoor dat het systeem de \u201Cantwoorden\u201D (de wedstrijduitslag) nooit kan zien voordat het de voorspelling maakt."),

        h2("3.3 Live vs. Backtest \u2014 twee soorten voorspellingen"),
        p("BetsPlug maakt onderscheid tussen twee soorten voorspellingen:"),
        table2col([
          ["Type", "Uitleg"],
          ["Live voorspelling", "Gemaakt V\u00D3\u00D3R de wedstrijd begint. Wordt vastgelegd met een tijdstempel als bewijs. Dit is de \u201Cechte\u201D voorspelling."],
          ["Backtest voorspelling", "Achteraf gemaakt op historische data om het systeem te testen. Wordt duidelijk gelabeld als \u201Csimulatie\u201D."],
        ]),
        p("Dit onderscheid is cruciaal voor eerlijkheid. Veel voorspellingsplatforms laten dit verschil niet zien, waardoor het lijkt alsof ze beter presteren dan ze werkelijk doen. BetsPlug rapporteert altijd afzonderlijk hoe goed live voorspellingen en backtests presteren."),
        explainBox("Vergelijk het met een dokter die achteraf zegt \u201CIk wist het al\u201D versus een dokter die van tevoren een diagnose stelt. Alleen de vooraf gestelde diagnose telt echt. BetsPlug laat altijd zien welke voorspellingen echt vooraf zijn gemaakt."),

        h2("3.4 Hoe goed presteert het systeem?"),
        p("Het systeem is uitvoerig getest om de betrouwbaarheid te meten. Hieronder de resultaten:"),
        table2col([
          ["Metriek", "Resultaat"],
          ["Aantal geteste configuraties", "1.295 verschillende instellingen vergeleken"],
          ["Totaal getoetste wedstrijden", "6.502 wedstrijden"],
          ["Nauwkeurigheid op trainingsdata (2024\u20132025)", "50,4% correct (bij 3.743 wedstrijden)"],
          ["Nauwkeurigheid op nieuwe data (2026)", "48,9% correct (bij 2.759 wedstrijden)"],
          ["Pick van de Dag op trainingsdata", "70,1% correct (432 picks)"],
          ["Pick van de Dag op nieuwe data", "71,1% correct (232 picks)"],
          ["Willekeurig gokken (thuis/gelijk/uit)", "33,3% correct"],
        ]),
        p("Het verschil tussen trainings- en testresultaten is klein (1,5 procentpunt), wat aantoont dat het systeem niet is \u201Coverfitted\u201D \u2014 het werkt ook betrouwbaar op data die het nog nooit heeft gezien."),
        explainBox("Bij voetbal zijn er drie mogelijke uitslagen: thuiswinst, gelijkspel, of uitwinst. Als je willekeurig gokt heb je 33% kans op goed. BetsPlug scoort gemiddeld 49% \u2014 dat is 48% beter dan willekeurig gokken. De \u201CPick van de Dag\u201D (de beste dagelijkse voorspelling) scoort zelfs 71%."),

        // 4. Eerlijkheid en transparantie
        h1("4. Eerlijkheid & Transparantie"),

        h2("4.1 Twee aparte track records"),
        p("BetsPlug houdt twee aparte scoreborden bij:"),
        bullet("Live track record: alleen voorspellingen die aantoonbaar V\u00D3\u00D3R de wedstrijd zijn gemaakt, met tijdstempelbewijs"),
        bullet("Backtest track record: historische simulaties, duidelijk als zodanig gelabeld"),
        p("Gebruikers kunnen via de API en de website filteren welk type ze willen zien. CSV-exports bevatten altijd de bron (live of backtest), het aantal uren voor aftrap, en alle evaluatiegegevens."),

        h2("4.2 Eerlijke financiele berekeningen"),
        p("Winst- en verliesberekeningen worden uitsluitend gemaakt met echte bookmaker-odds van gelicentieerde databronnen (zoals Bet365, Pinnacle). Het systeem berekent GEEN nep-winst op basis van eigen kansschattingen \u2014 dat zou neerkomen op zelfbeoordeling."),
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
        explainBox("In gewoon Nederlands: BetsPlug weet uw e-mailadres en wat voor abonnement u heeft. Uw creditcardgegevens worden door Stripe verwerkt \u2014 BetsPlug ziet of bewaart deze nooit. U kunt op elk moment al uw gegevens laten verwijderen."),

        h2("5.4 Intellectueel eigendom en licenties"),
        p("Het voorspellingssysteem is volledig in eigen huis ontwikkeld. De data waarop het systeem draait, is gelicentieerd van professionele dataleveranciers:"),
        bullet("API-Football (Pro-licentie): levert wedstrijddata, uitslagen, teamstatistieken"),
        bullet("Football-Data.org: aanvullende competitiedata"),
        bullet("The Odds API: levert bookmaker-odds van 40+ aanbieders"),
        p("Alle data wordt gebruikt binnen de voorwaarden van de respectievelijke licenties."),

        // 6. Risico-informatie
        h1("6. Risico-informatie"),
        p("Het is essentieel dat gebruikers en belanghebbenden de beperkingen van het systeem begrijpen:"),
        bullet("Voorspellingen zijn schattingen op basis van historische patronen \u2014 geen zekerheden. Voetbal is onvoorspelbaar en verrassingen zijn onvermijdelijk."),
        bullet("Dat het systeem in het verleden 49% scoorde, betekent niet dat het in de toekomst hetzelfde zal doen. Omstandigheden veranderen."),
        bullet("Het model kan onderpresteren bij ongewone situaties, zoals pandemie\u00EBn, stakingen, of drastische regelwijzigingen."),
        bullet("De nauwkeurigheid verschilt per competitie: top-6 Europese competities scoren rond de 50%, terwijl kleinere competities rond de 40% scoren."),
        bullet("Gebruik informatie van BetsPlug nooit als enige basis voor financiele beslissingen. Zet nooit geld in dat u niet kunt missen."),
        bullet("BetsPlug aanvaardt geen enkele aansprakelijkheid voor financiele verliezen die ontstaan door het gebruik van haar voorspellingen."),
        explainBox("Vergelijk het met een weersvoorspelling: 70% kans op regen betekent dat het in 3 van de 10 gevallen NIET regent. Zelfs de beste voorspelling is geen garantie. BetsPlug werkt op dezelfde manier \u2014 het geeft kansen, geen zekerheden."),

        // 7. Controleerbaarheid
        h1("7. Controleerbaarheid & Naspeurbaarheid"),
        p("Elke voorspelling die BetsPlug maakt, wordt permanent opgeslagen met alle achterliggende gegevens. Dit maakt het mogelijk om achteraf precies na te gaan hoe een voorspelling tot stand is gekomen:"),
        bullet("Tijdstempel: wanneer de voorspelling is gemaakt (bewijs dat het v\u00F3\u00F3r de wedstrijd was)"),
        bullet("Modelversie: welke versie van het systeem de voorspelling heeft gemaakt"),
        bullet("Kenmerken-snapshot: alle 43 datapunten die op dat moment zijn gebruikt"),
        bullet("Ruwe modeluitvoer: de exacte berekeningen van elk model"),
        bullet("Evaluatierecord: de vergelijking met de daadwerkelijke wedstrijduitslag"),
        p("Al deze gegevens zijn reproduceerbaar: als je dezelfde input geeft, krijg je dezelfde uitvoer. Alle wijzigingen aan het systeem worden bijgehouden in een versiebeheersysteem (git)."),
        explainBox("Dit betekent dat een auditor of toezichthouder op elk moment kan verifi\u00EBren: (1) wanneer een voorspelling is gemaakt, (2) op basis van welke gegevens, (3) of die gegevens eerlijk waren, en (4) of de voorspelling correct was. Niets kan achteraf worden aangepast."),

        // 8. Contact
        h1("8. Contact & Organisatie"),
        table2col([
          ["Onderdeel", "Details"],
          ["Rechtspersoon", "BetsPlug B.V."],
          ["Website", "https://betsplug.com"],
          ["Technisch contact", "Via de contactpagina op de website"],
          ["Privacyverzoeken", "AVG-verzoeken via de contactpagina"],
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
