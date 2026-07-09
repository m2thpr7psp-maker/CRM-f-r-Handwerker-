/**
 * Seed-Skript: realistische Demo-Daten für einen kleinen Malerbetrieb.
 * Start mit: npm run db:seed
 *
 * ACHTUNG: Löscht alle vorhandenen Daten und legt sie neu an.
 */
import { PrismaClient } from "@prisma/client";
import { addTage, heuteDatum } from "../lib/format";

const prisma = new PrismaClient();

async function main() {
  console.log("Lösche vorhandene Daten …");
  await prisma.kunde.deleteMany({});
  await prisma.mitarbeiter.deleteMany({});

  console.log("Lege Betriebseinstellungen an …");
  await prisma.einstellungen.upsert({
    where: { id: 1 },
    update: {
      firmenname: "Malerbetrieb Farbenfroh GmbH",
      strasse: "Werkstattweg 5",
      plz: "50823",
      ort: "Köln",
      telefon: "0221 9876543",
      email: "info@farbenfroh-example.de",
      steuernummer: "215/5310/1234",
      ustIdNr: "DE123456789",
      iban: "DE89 3704 0044 0532 0130 00",
      stundensatz: 58,
    },
    create: {
      id: 1,
      firmenname: "Malerbetrieb Farbenfroh GmbH",
      strasse: "Werkstattweg 5",
      plz: "50823",
      ort: "Köln",
      telefon: "0221 9876543",
      email: "info@farbenfroh-example.de",
      steuernummer: "215/5310/1234",
      ustIdNr: "DE123456789",
      iban: "DE89 3704 0044 0532 0130 00",
      stundensatz: 58,
    },
  });

  console.log("Lege Mitarbeiter an …");
  const [klaus, ali, jonas] = await Promise.all([
    prisma.mitarbeiter.create({ data: { name: "Klaus Weber", farbe: "#2563eb" } }),
    prisma.mitarbeiter.create({ data: { name: "Ali Yilmaz", farbe: "#dc2626" } }),
    prisma.mitarbeiter.create({ data: { name: "Jonas Brandt", farbe: "#16a34a" } }),
  ]);

  console.log("Lege 8 Kunden an …");
  const kundenDaten = [
    {
      name: "Familie Sonnenschein",
      strasse: "Ahornallee 21",
      plz: "50858",
      ort: "Köln",
      telefon: "0221 5551234",
      email: "sonnenschein@example.de",
      notizen: "Klingel defekt – bitte anrufen, wenn man vor der Tür steht.",
    },
    {
      name: "Herbert Klein",
      strasse: "Lindenstraße 8",
      plz: "50674",
      ort: "Köln",
      telefon: "0170 2223344",
      email: "h.klein@example.de",
      notizen: "Rentner, ist fast immer zu Hause.",
    },
    {
      name: "Sabine Vogel",
      firma: "Praxis Dr. Vogel",
      strasse: "Hauptstraße 112",
      plz: "50996",
      ort: "Köln",
      telefon: "0221 998877",
      email: "praxis@vogel-example.de",
      notizen: "Arbeiten nur mittwochnachmittags oder am Wochenende möglich.",
    },
    {
      name: "Thomas Berger",
      firma: "Hausverwaltung Berger & Söhne",
      strasse: "Am Rathausplatz 3",
      plz: "50667",
      ort: "Köln",
      telefon: "0221 445566",
      email: "info@berger-hv-example.de",
      notizen: "Rechnungen immer an die Hausverwaltung, nicht an Mieter.",
    },
    {
      name: "Gaststätte Zur Post",
      firma: "Gaststätte Zur Post GmbH",
      strasse: "Poststraße 1",
      plz: "51063",
      ort: "Köln",
      telefon: "0221 334455",
      email: "wirt@zurpost-example.de",
      notizen: "Ruhetag Montag – da können wir durcharbeiten.",
    },
    {
      name: "Miriam Schuster",
      strasse: "Birkenweg 14",
      plz: "50765",
      ort: "Köln",
      telefon: "0157 8899001",
      email: "m.schuster@example.de",
    },
    {
      name: "Kita Regenbogen",
      firma: "Kita Regenbogen e.V.",
      strasse: "Schulgasse 7",
      plz: "50737",
      ort: "Köln",
      telefon: "0221 776655",
      email: "leitung@kita-regenbogen-example.de",
      notizen: "Arbeiten nur in den Schließzeiten (Ferien) möglich.",
    },
    {
      name: "Peter und Anna Lorenz",
      strasse: "Feldstraße 33",
      plz: "50823",
      ort: "Köln",
      telefon: "0175 4433221",
      notizen: "Hund (freundlich), Schlüssel liegt beim Nachbarn Nr. 35.",
    },
  ];
  const kunden = [];
  for (const daten of kundenDaten) {
    kunden.push(await prisma.kunde.create({ data: daten }));
  }
  const [sonnenschein, klein, vogel, berger, zurPost, schuster, kita, lorenz] = kunden;

  console.log("Lege 12 Aufträge an …");
  const auftragsDaten: {
    kundeId: string;
    titel: string;
    beschreibung: string;
    status: string;
  }[] = [
    {
      kundeId: sonnenschein.id,
      titel: "Fassade streichen",
      beschreibung: "Einfamilienhaus, ca. 180 m² Fassadenfläche. Silikonharzfarbe weiß, 2 Anstriche inkl. Grundierung. Gerüst wird gestellt.",
      status: "IN_ARBEIT",
    },
    {
      kundeId: sonnenschein.id,
      titel: "Kinderzimmer tapezieren",
      beschreibung: "Raufaser neu, anschließend Wandfarbe hellblau. Möbel werden von der Familie ausgeräumt.",
      status: "ANFRAGE",
    },
    {
      kundeId: klein.id,
      titel: "Wohnzimmer und Flur streichen",
      beschreibung: "Decken und Wände weiß, kleinere Risse vorher verspachteln. Ca. 45 m² Grundfläche.",
      status: "GEPLANT",
    },
    {
      kundeId: vogel.id,
      titel: "Praxisräume renovieren",
      beschreibung: "Wartezimmer und 2 Behandlungsräume: Wände scheuerbeständige Latexfarbe, Farbton nach Bemusterung.",
      status: "GEPLANT",
    },
    {
      kundeId: berger.id,
      titel: "Treppenhaus Mehrfamilienhaus",
      beschreibung: "4 Etagen, Wände und Decken, Sockel in Ölfarbe grau. Arbeiten wochentags 8–16 Uhr.",
      status: "IN_ARBEIT",
    },
    {
      kundeId: berger.id,
      titel: "Wohnungsübergabe Musterstr. 12",
      beschreibung: "3-Zimmer-Wohnung komplett weißen vor Neuvermietung. Übergabe zum Monatsende.",
      status: "ABGESCHLOSSEN",
    },
    {
      kundeId: zurPost.id,
      titel: "Gastraum neu gestalten",
      beschreibung: "Gastraum ca. 90 m²: Wände Lehmputz-Optik, Holzvertäfelung lasieren. Nur montags arbeiten.",
      status: "ANFRAGE",
    },
    {
      kundeId: schuster.id,
      titel: "Badezimmer-Decke nach Wasserschaden",
      beschreibung: "Decke isolieren (Fleckenblocker) und 2× streichen. Versicherung übernimmt – Rechnung mit Fotos.",
      status: "ABGESCHLOSSEN",
    },
    {
      kundeId: kita.id,
      titel: "Gruppenräume streichen (Sommerferien)",
      beschreibung: "3 Gruppenräume mit abwaschbarer, schadstofffreier Farbe. Nur in der Schließzeit 20.07.–07.08.",
      status: "GEPLANT",
    },
    {
      kundeId: lorenz.id,
      titel: "Haustür und Fensterläden lackieren",
      beschreibung: "Haustür abschleifen und neu lackieren (RAL 6005), 6 Fensterläden ausbauen und in der Werkstatt lackieren.",
      status: "IN_ARBEIT",
    },
    {
      kundeId: lorenz.id,
      titel: "Garage streichen",
      beschreibung: "Innenwände der Doppelgarage weiß, Boden mit 2K-Bodenbeschichtung grau.",
      status: "ANFRAGE",
    },
    {
      kundeId: klein.id,
      titel: "Schlafzimmer streichen",
      beschreibung: "Wände in ruhigem Graugrün (Bemusterung erfolgt), Decke weiß.",
      status: "ABGERECHNET",
    },
  ];
  const auftraege = [];
  for (const daten of auftragsDaten) {
    auftraege.push(await prisma.auftrag.create({ data: daten }));
  }
  const [
    fassade,
    ,
    wohnzimmerKlein,
    praxis,
    treppenhaus,
    uebergabe,
    gastraum,
    badDecke,
    kitaRaeume,
    haustuer,
    ,
    schlafzimmer,
  ] = auftraege;

  console.log("Lege 20 Termine an …");
  const heute = heuteDatum();
  const adresseVon = (kunde: { strasse: string | null; plz: string | null; ort: string | null }) =>
    [kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  const termine: {
    auftragId: string;
    tagOffset: number;
    startZeit: string;
    endZeit: string;
    mitarbeiterId: string;
    ort: string;
    notiz?: string;
  }[] = [
    // Letzte Woche: Wohnungsübergabe und Wasserschaden (abgeschlossen)
    { auftragId: uebergabe.id, tagOffset: -7, startZeit: "07:30", endZeit: "16:00", mitarbeiterId: ali.id, ort: "Musterstraße 12, 50667 Köln" },
    { auftragId: uebergabe.id, tagOffset: -6, startZeit: "07:30", endZeit: "15:00", mitarbeiterId: ali.id, ort: "Musterstraße 12, 50667 Köln" },
    { auftragId: badDecke.id, tagOffset: -5, startZeit: "08:00", endZeit: "12:00", mitarbeiterId: jonas.id, ort: adresseVon(schuster), notiz: "Fotos für die Versicherung machen!" },
    { auftragId: badDecke.id, tagOffset: -3, startZeit: "08:00", endZeit: "10:30", mitarbeiterId: jonas.id, ort: adresseVon(schuster), notiz: "2. Anstrich Decke" },
    { auftragId: schlafzimmer.id, tagOffset: -4, startZeit: "09:00", endZeit: "16:30", mitarbeiterId: klaus.id, ort: adresseVon(klein) },

    // Diese Woche: Fassade (laufend), Treppenhaus, Haustür
    { auftragId: fassade.id, tagOffset: 0, startZeit: "07:30", endZeit: "16:00", mitarbeiterId: klaus.id, ort: adresseVon(sonnenschein), notiz: "Gerüst steht, Westseite grundieren" },
    { auftragId: fassade.id, tagOffset: 1, startZeit: "07:30", endZeit: "16:00", mitarbeiterId: klaus.id, ort: adresseVon(sonnenschein) },
    { auftragId: fassade.id, tagOffset: 2, startZeit: "07:30", endZeit: "16:00", mitarbeiterId: klaus.id, ort: adresseVon(sonnenschein), notiz: "1. Anstrich komplett" },
    { auftragId: treppenhaus.id, tagOffset: 0, startZeit: "08:00", endZeit: "16:00", mitarbeiterId: ali.id, ort: adresseVon(berger), notiz: "Etage 3 und 4 abkleben" },
    { auftragId: treppenhaus.id, tagOffset: 1, startZeit: "08:00", endZeit: "16:00", mitarbeiterId: ali.id, ort: adresseVon(berger) },
    { auftragId: treppenhaus.id, tagOffset: 3, startZeit: "08:00", endZeit: "16:00", mitarbeiterId: ali.id, ort: adresseVon(berger), notiz: "Sockel Ölfarbe" },
    { auftragId: haustuer.id, tagOffset: 1, startZeit: "08:00", endZeit: "12:00", mitarbeiterId: jonas.id, ort: adresseVon(lorenz), notiz: "Fensterläden ausbauen und mitnehmen" },
    { auftragId: haustuer.id, tagOffset: 2, startZeit: "08:00", endZeit: "16:00", mitarbeiterId: jonas.id, ort: "Werkstatt, Werkstattweg 5", notiz: "Läden schleifen und lackieren" },
    { auftragId: haustuer.id, tagOffset: 4, startZeit: "08:00", endZeit: "13:00", mitarbeiterId: jonas.id, ort: adresseVon(lorenz), notiz: "Läden wieder einbauen" },

    // Nächste Woche: geplante Aufträge
    { auftragId: wohnzimmerKlein.id, tagOffset: 7, startZeit: "08:00", endZeit: "16:00", mitarbeiterId: jonas.id, ort: adresseVon(klein), notiz: "Risse verspachteln, 1. Anstrich" },
    { auftragId: wohnzimmerKlein.id, tagOffset: 8, startZeit: "08:00", endZeit: "14:00", mitarbeiterId: jonas.id, ort: adresseVon(klein) },
    { auftragId: praxis.id, tagOffset: 9, startZeit: "14:00", endZeit: "19:00", mitarbeiterId: klaus.id, ort: adresseVon(vogel), notiz: "Nur mittwochnachmittags!" },
    { auftragId: praxis.id, tagOffset: 12, startZeit: "08:00", endZeit: "16:00", mitarbeiterId: klaus.id, ort: adresseVon(vogel), notiz: "Samstag – Praxis geschlossen" },
    { auftragId: kitaRaeume.id, tagOffset: 14, startZeit: "07:30", endZeit: "16:00", mitarbeiterId: ali.id, ort: adresseVon(kita), notiz: "Beginn Schließzeit" },
    // Besichtigungstermin für eine Anfrage
    { auftragId: gastraum.id, tagOffset: 7, startZeit: "10:00", endZeit: "11:00", mitarbeiterId: klaus.id, ort: adresseVon(zurPost), notiz: "Besichtigung und Aufmaß (Ruhetag)" },
  ];

  for (const t of termine) {
    await prisma.termin.create({
      data: {
        auftragId: t.auftragId,
        datum: addTage(heute, t.tagOffset),
        startZeit: t.startZeit,
        endZeit: t.endZeit,
        mitarbeiterId: t.mitarbeiterId,
        ort: t.ort,
        notiz: t.notiz,
      },
    });
  }

  console.log("Lege 2 Rechnungsentwürfe an …");
  const jahr = heute.getUTCFullYear();
  await prisma.rechnung.create({
    data: {
      nummer: `RE-${jahr}-0001`,
      auftragId: schlafzimmer.id,
      datum: addTage(heute, -2),
      leistungVon: addTage(heute, -4),
      leistungBis: addTage(heute, -4),
      mwstSatz: 19,
      zahlungszielTage: 14,
      positionen: {
        create: [
          { bezeichnung: "Arbeitszeit Malerarbeiten (Wände und Decke)", menge: 7.5, einheit: "Std.", einzelpreis: 58, sortierung: 0 },
          { bezeichnung: "Wandfarbe Graugrün, matt", menge: 12.5, einheit: "l", einzelpreis: 14.8, sortierung: 1 },
          { bezeichnung: "Abdeckmaterial und Kleinteile", menge: 1, einheit: "pauschal", einzelpreis: 35, sortierung: 2 },
        ],
      },
    },
  });
  await prisma.rechnung.create({
    data: {
      nummer: `RE-${jahr}-0002`,
      auftragId: uebergabe.id,
      datum: heute,
      leistungVon: addTage(heute, -7),
      leistungBis: addTage(heute, -6),
      mwstSatz: 19,
      zahlungszielTage: 14,
      positionen: {
        create: [
          { bezeichnung: "Arbeitszeit Malerarbeiten (3-Zimmer-Wohnung komplett weißen)", menge: 15, einheit: "Std.", einzelpreis: 58, sortierung: 0 },
          { bezeichnung: "Dispersionsfarbe weiß", menge: 30, einheit: "l", einzelpreis: 9.9, sortierung: 1 },
        ],
      },
    },
  });

  console.log("Fertig! Demo-Daten: 8 Kunden, 12 Aufträge, 20 Termine, 3 Mitarbeiter, 2 Rechnungsentwürfe.");
}

main()
  .catch((fehler) => {
    console.error(fehler);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
