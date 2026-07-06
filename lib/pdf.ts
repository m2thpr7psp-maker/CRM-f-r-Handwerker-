import PDFDocument from "pdfkit";
import type { Einstellungen, Kunde, Rechnung, RechnungsPosition } from "@prisma/client";
import { addTage, formatDatum } from "@/lib/format";
import { berechneSummen, positionsSumme } from "@/lib/geld";

type RechnungMitDetails = Rechnung & {
  auftrag: { titel: string; kunde: Kunde };
  positionen: RechnungsPosition[];
};

const SEITENRAND = 50;
const INHALT_BREITE = 595.28 - 2 * SEITENRAND; // A4-Breite in pt

function euro(betrag: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(betrag);
}

function menge(wert: number): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(wert);
}

function zeichneEntwurfsWasserzeichen(doc: PDFKit.PDFDocument) {
  doc.save();
  doc.rotate(-30, { origin: [297, 421] });
  doc
    .font("Helvetica-Bold")
    .fontSize(90)
    .fillColor("#e8edf3")
    .text("ENTWURF", 60, 370, { width: 475, align: "center" });
  doc.restore();
  doc.fillColor("#000000");
}

export function erzeugeRechnungsPdf(
  rechnung: RechnungMitDetails,
  einstellungen: Einstellungen
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: SEITENRAND,
    info: {
      Title: `Rechnungsentwurf ${rechnung.nummer}`,
      Author: einstellungen.firmenname || "HandwerkOS",
    },
  });

  const teile: Buffer[] = [];
  doc.on("data", (teil: Buffer) => teile.push(teil));
  const fertig = new Promise<Buffer>((aufloesen) =>
    doc.on("end", () => aufloesen(Buffer.concat(teile)))
  );

  zeichneEntwurfsWasserzeichen(doc);
  doc.on("pageAdded", () => zeichneEntwurfsWasserzeichen(doc));

  const kunde = rechnung.auftrag.kunde;
  const grau = "#64748b";
  const dunkel = "#0f172a";
  const rot = "#b91c1c";

  // Kopf: Firmenname links, Logo rechts
  doc.font("Helvetica-Bold").fontSize(16).fillColor(dunkel);
  doc.text(einstellungen.firmenname || "Mein Betrieb", SEITENRAND, SEITENRAND, {
    width: 300,
  });

  if (einstellungen.logo) {
    const treffer = einstellungen.logo.match(/^data:image\/(?:png|jpeg);base64,(.+)$/);
    if (treffer) {
      try {
        doc.image(Buffer.from(treffer[1], "base64"), 405, 42, {
          fit: [140, 56],
          align: "right",
        });
      } catch {
        // Ungültige Bilddaten: Logo einfach weglassen
      }
    }
  }

  // Absenderzeile (klein) und Empfängeranschrift
  const absenderTeile = [
    einstellungen.firmenname,
    einstellungen.strasse,
    [einstellungen.plz, einstellungen.ort].filter(Boolean).join(" "),
  ].filter(Boolean);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(grau)
    .text(absenderTeile.join(" · "), SEITENRAND, 128);

  doc.font("Helvetica").fontSize(11).fillColor(dunkel);
  let empfaengerY = 145;
  const empfaengerZeilen = [
    kunde.firma,
    kunde.name,
    kunde.strasse,
    [kunde.plz, kunde.ort].filter(Boolean).join(" "),
  ].filter((z): z is string => Boolean(z && z.trim() !== ""));
  for (const zeile of empfaengerZeilen) {
    doc.text(zeile, SEITENRAND, empfaengerY, { width: 250 });
    empfaengerY += 16;
  }

  // Rechnungsdaten rechts
  const infoX = 330;
  const infoBreite = INHALT_BREITE + SEITENRAND - infoX;
  let infoY = 145;
  const infoZeile = (label: string, wert: string) => {
    doc.font("Helvetica").fontSize(9).fillColor(grau).text(label, infoX, infoY, {
      width: 105,
    });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(dunkel)
      .text(wert, infoX + 105, infoY, { width: infoBreite - 105, align: "right" });
    infoY += 14;
  };

  infoZeile("Rechnungsnummer", rechnung.nummer);
  infoZeile("Rechnungsdatum", formatDatum(rechnung.datum));
  if (rechnung.leistungVon && rechnung.leistungBis) {
    const von = formatDatum(rechnung.leistungVon);
    const bis = formatDatum(rechnung.leistungBis);
    infoZeile("Leistungszeitraum", von === bis ? von : `${von} – ${bis}`);
  }
  if (einstellungen.steuernummer) infoZeile("Steuernummer", einstellungen.steuernummer);
  if (einstellungen.ustIdNr) infoZeile("USt-IdNr.", einstellungen.ustIdNr);

  // Titel und Entwurfs-Hinweis
  let y = Math.max(empfaengerY, infoY) + 40;
  doc.font("Helvetica-Bold").fontSize(15).fillColor(dunkel);
  doc.text(`Rechnungsentwurf ${rechnung.nummer}`, SEITENRAND, y);
  y += 22;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(rot);
  doc.text(
    "Entwurf zur Prüfung – dies ist keine Rechnung im Sinne des § 14 UStG.",
    SEITENRAND,
    y
  );
  y += 16;
  doc.font("Helvetica").fontSize(10).fillColor(grau);
  doc.text(`Auftrag: ${rechnung.auftrag.titel}`, SEITENRAND, y);
  y += 24;

  // Positionstabelle
  const spalten = [
    { titel: "Pos.", breite: 28, ausrichtung: "left" as const },
    { titel: "Bezeichnung", breite: 197, ausrichtung: "left" as const },
    { titel: "Menge", breite: 50, ausrichtung: "right" as const },
    { titel: "Einheit", breite: 50, ausrichtung: "left" as const },
    { titel: "Einzelpreis", breite: 85, ausrichtung: "right" as const },
    { titel: "Gesamt", breite: 85, ausrichtung: "right" as const },
  ];

  const zeichneTabellenkopf = () => {
    let x = SEITENRAND;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(dunkel);
    for (const spalte of spalten) {
      doc.text(spalte.titel, x + 2, y, {
        width: spalte.breite - 4,
        align: spalte.ausrichtung,
      });
      x += spalte.breite;
    }
    y += 14;
    doc
      .moveTo(SEITENRAND, y)
      .lineTo(SEITENRAND + INHALT_BREITE, y)
      .strokeColor("#cbd5e1")
      .lineWidth(0.8)
      .stroke();
    y += 6;
  };

  zeichneTabellenkopf();

  doc.font("Helvetica").fontSize(9).fillColor(dunkel);
  rechnung.positionen.forEach((position, index) => {
    const zellen = [
      String(index + 1),
      position.bezeichnung,
      menge(position.menge),
      position.einheit,
      euro(position.einzelpreis),
      euro(positionsSumme(position)),
    ];
    const zeilenHoehe =
      Math.max(
        doc.heightOfString(position.bezeichnung, { width: spalten[1].breite - 4 }),
        11
      ) + 6;

    if (y + zeilenHoehe > 760) {
      doc.addPage();
      y = SEITENRAND;
      zeichneTabellenkopf();
      doc.font("Helvetica").fontSize(9).fillColor(dunkel);
    }

    let x = SEITENRAND;
    zellen.forEach((zelle, i) => {
      doc.text(zelle, x + 2, y, {
        width: spalten[i].breite - 4,
        align: spalten[i].ausrichtung,
      });
      x += spalten[i].breite;
    });
    y += zeilenHoehe;
  });

  // Summen (Entgelt nach Steuersatz aufgeschlüsselt)
  const summen = berechneSummen(rechnung.positionen, rechnung.mwstSatz);
  y += 4;
  doc
    .moveTo(SEITENRAND + 280, y)
    .lineTo(SEITENRAND + INHALT_BREITE, y)
    .strokeColor("#cbd5e1")
    .lineWidth(0.8)
    .stroke();
  y += 8;

  if (y > 700) {
    doc.addPage();
    y = SEITENRAND;
  }

  const summenZeile = (label: string, wert: string, fett = false) => {
    doc
      .font(fett ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fett ? 11 : 9.5)
      .fillColor(dunkel);
    doc.text(label, SEITENRAND + 250, y, { width: 165, lineBreak: false });
    doc.text(wert, SEITENRAND + 415, y, { width: INHALT_BREITE - 415, align: "right" });
    y += fett ? 18 : 15;
  };

  summenZeile(`Nettobetrag (Steuersatz ${menge(rechnung.mwstSatz)} %)`, euro(summen.netto));
  summenZeile(`zzgl. ${menge(rechnung.mwstSatz)} % USt`, euro(summen.mwst));
  summenZeile("Rechnungsbetrag (brutto)", euro(summen.brutto), true);

  if (rechnung.mwstSatz === 0) {
    doc.font("Helvetica").fontSize(9).fillColor(grau);
    doc.text(
      "Hinweis: Es wird keine Umsatzsteuer ausgewiesen (Steuersatz 0 %). Bitte prüfen Sie den zutreffenden Grund (z. B. Kleinunternehmerregelung § 19 UStG oder Steuerschuldnerschaft des Leistungsempfängers § 13b UStG).",
      SEITENRAND,
      y,
      { width: INHALT_BREITE }
    );
    y += 30;
  }

  // Zahlungsinformationen
  y += 14;
  const faellig = addTage(rechnung.datum, rechnung.zahlungszielTage);
  doc.font("Helvetica").fontSize(10).fillColor(dunkel);
  doc.text(
    `Zahlungsziel: ${rechnung.zahlungszielTage} Tage – zahlbar bis ${formatDatum(faellig)}.`,
    SEITENRAND,
    y,
    { width: INHALT_BREITE }
  );
  y += 15;
  if (einstellungen.iban) {
    doc.text(
      `Bitte überweisen Sie den Betrag auf folgendes Konto: IBAN ${einstellungen.iban}`,
      SEITENRAND,
      y,
      { width: INHALT_BREITE }
    );
    y += 15;
  }
  y += 6;
  doc.font("Helvetica").fontSize(9).fillColor(rot);
  doc.text(
    "Dieser Rechnungsentwurf dient nur zur Prüfung. Erstellen Sie die endgültige Rechnung " +
      "(inkl. E-Rechnung/XRechnung, falls erforderlich) mit Ihrer Buchhaltungssoftware.",
    SEITENRAND,
    y,
    { width: INHALT_BREITE }
  );

  // Fußzeile
  const fusszeile = [
    einstellungen.firmenname,
    [einstellungen.strasse, [einstellungen.plz, einstellungen.ort].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", "),
    einstellungen.steuernummer ? `Steuernummer: ${einstellungen.steuernummer}` : "",
    einstellungen.ustIdNr ? `USt-IdNr.: ${einstellungen.ustIdNr}` : "",
    einstellungen.iban ? `IBAN: ${einstellungen.iban}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");
  // Unteren Seitenrand aufheben, damit die Fußzeile keinen
  // automatischen Seitenumbruch auslöst
  doc.page.margins.bottom = 0;
  doc.font("Helvetica").fontSize(7.5).fillColor(grau);
  doc.text(fusszeile, SEITENRAND, 800, {
    width: INHALT_BREITE,
    align: "center",
    height: 20,
  });

  doc.end();
  return fertig;
}
