import PDFDocument from "pdfkit";
import type {
  Auftrag,
  Einstellungen,
  Kunde,
  Rechnung,
  RechnungsPosition,
  Termin,
} from "@prisma/client";
import { formatDatum, formatWaehrung } from "@/lib/format";
import { berechneSummen } from "@/lib/geld";
import { statusLabel } from "@/lib/status";

type KundeMitDaten = Kunde & {
  auftraege: (Auftrag & {
    termine: (Termin & { mitarbeiter: { name: string } | null })[];
    rechnungen: (Rechnung & { positionen: RechnungsPosition[] })[];
  })[];
};

/**
 * Datenauskunft nach Art. 15 DSGVO: alle zu einem Kunden gespeicherten
 * Daten als übersichtliches PDF (zum Aushändigen oder Versenden).
 */
export function erzeugeDatenauskunftPdf(
  kunde: KundeMitDaten,
  einstellungen: Einstellungen
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    info: {
      Title: `Datenauskunft ${kunde.name}`,
      Author: einstellungen.firmenname || "HandwerkOS",
    },
  });

  const teile: Buffer[] = [];
  doc.on("data", (teil: Buffer) => teile.push(teil));
  const fertig = new Promise<Buffer>((aufloesen) =>
    doc.on("end", () => aufloesen(Buffer.concat(teile)))
  );

  const grau = "#64748b";
  const dunkel = "#0f172a";

  const ueberschrift = (text: string) => {
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(dunkel).text(text);
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10).fillColor(dunkel);
  };

  const zeile = (label: string, wert: string | null | undefined) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(dunkel)
      .text(`${label}: `, { continued: true })
      .font("Helvetica")
      .text(wert && wert.trim() !== "" ? wert : "–");
  };

  // Kopf
  doc.font("Helvetica-Bold").fontSize(16).fillColor(dunkel);
  doc.text("Datenauskunft nach Art. 15 DSGVO");
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10).fillColor(grau);
  doc.text(
    `Verantwortlicher: ${einstellungen.firmenname || "–"}, ${[
      einstellungen.strasse,
      [einstellungen.plz, einstellungen.ort].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", ")}`
  );
  doc.text(`Erstellt am ${formatDatum(new Date())} mit HandwerkOS.`);
  doc.moveDown(0.3);
  doc.text(
    "Diese Übersicht enthält alle personenbezogenen Daten, die zu der genannten Person " +
      "in HandwerkOS gespeichert sind. Zweck der Verarbeitung: Durchführung von Aufträgen, " +
      "Terminplanung und Rechnungsvorbereitung (Art. 6 Abs. 1 lit. b DSGVO)."
  );

  // Stammdaten
  ueberschrift("Stammdaten");
  zeile("Name", kunde.name);
  zeile("Firma", kunde.firma);
  zeile(
    "Adresse",
    [kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")
  );
  zeile("Telefon", kunde.telefon);
  zeile("E-Mail", kunde.email);
  zeile("Notizen", kunde.notizen);
  zeile("Gespeichert seit", formatDatum(kunde.erstelltAm));

  // Aufträge
  ueberschrift(`Aufträge (${kunde.auftraege.length})`);
  if (kunde.auftraege.length === 0) {
    doc.text("Keine Aufträge gespeichert.");
  }
  for (const auftrag of kunde.auftraege) {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(
        `• ${auftrag.titel} (${statusLabel(auftrag.status)}, angelegt am ${formatDatum(auftrag.erstelltAm)})`
      );
    doc.font("Helvetica").fontSize(10);
    if (auftrag.beschreibung) {
      doc.fillColor(grau).text(auftrag.beschreibung, { indent: 12 });
      doc.fillColor(dunkel);
    }
    for (const termin of auftrag.termine) {
      doc.text(
        `   Termin: ${formatDatum(termin.datum)}, ${termin.startZeit}–${termin.endZeit} Uhr` +
          `${termin.mitarbeiter ? `, Mitarbeiter: ${termin.mitarbeiter.name}` : ""}` +
          `${termin.ort ? `, Ort: ${termin.ort}` : ""}` +
          `${termin.notiz ? `, Notiz: ${termin.notiz}` : ""}`
      );
    }
    for (const rechnung of auftrag.rechnungen) {
      const { brutto } = berechneSummen(rechnung.positionen, rechnung.mwstSatz);
      doc.text(
        `   Rechnungsentwurf ${rechnung.nummer} vom ${formatDatum(rechnung.datum)} über ${formatWaehrung(brutto)}`
      );
    }
    doc.moveDown(0.3);
  }

  // Rechte
  ueberschrift("Ihre Rechte");
  doc
    .fillColor(grau)
    .text(
      "Sie haben das Recht auf Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), " +
        "Einschränkung der Verarbeitung (Art. 18 DSGVO) und Datenübertragbarkeit (Art. 20 DSGVO) " +
        "sowie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde. Steuerlich relevante " +
        "Unterlagen (z. B. Rechnungen) unterliegen gesetzlichen Aufbewahrungsfristen (§ 147 AO) " +
        "und können erst nach deren Ablauf gelöscht werden."
    );

  doc.end();
  return fertig;
}
