import { prisma } from "@/lib/prisma";
import { istEntsperrt } from "@/lib/pin";

export const dynamic = "force-dynamic";

/** "Severinstraße 88, 50678 Köln" -> Adressfelder für einen neuen Kunden */
function parseAdresse(adresse: string | null): {
  strasse: string | null;
  plz: string | null;
  ort: string | null;
} {
  if (!adresse) return { strasse: null, plz: null, ort: null };
  const treffer = adresse.match(/^(.*?),?\s*(\d{5})\s+(.+)$/);
  if (treffer) {
    return { strasse: treffer[1].trim() || null, plz: treffer[2], ort: treffer[3].trim() };
  }
  return { strasse: adresse.trim(), plz: null, ort: null };
}

/**
 * Übernimmt eine bestätigte Anfrage in den Betriebsalltag:
 * Kunde (per Telefonnummer wiedererkannt oder neu angelegt) + Auftrag
 * (Status "Geplant") + Termin im Kalender. Die Anfrage wird ERLEDIGT.
 */
export async function PATCH(
  _anfrage: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await istEntsperrt())) {
    return Response.json({ fehler: "Gesperrt – bitte zuerst entsperren." }, { status: 401 });
  }

  const { id } = await params;
  const terminAnfrage = await prisma.terminAnfrage.findUnique({
    where: { id },
    include: { slots: { where: { status: "GEWAEHLT" } } },
  });
  if (!terminAnfrage) {
    return Response.json({ fehler: "Anfrage nicht gefunden." }, { status: 404 });
  }
  if (terminAnfrage.status !== "BESTAETIGT" || terminAnfrage.slots.length === 0) {
    return Response.json(
      { fehler: "Nur bestätigte Anfragen mit gewähltem Termin können übernommen werden." },
      { status: 409 }
    );
  }
  const slot = terminAnfrage.slots[0];

  // Kunde über die Telefonnummer wiedererkennen, sonst neu anlegen
  let kundeId = terminAnfrage.kundeId;
  if (!kundeId) {
    const vorhanden = await prisma.kunde.findFirst({
      where: { telefon: terminAnfrage.telefon },
    });
    if (vorhanden) {
      kundeId = vorhanden.id;
    } else {
      const neu = await prisma.kunde.create({
        data: {
          name: terminAnfrage.kundeName,
          telefon: terminAnfrage.telefon,
          ...parseAdresse(terminAnfrage.adresse),
        },
      });
      kundeId = neu.id;
    }
  }

  const titel =
    terminAnfrage.anliegen.length > 80
      ? terminAnfrage.anliegen.slice(0, 77) + "…"
      : terminAnfrage.anliegen;

  const auftrag = await prisma.auftrag.create({
    data: {
      kundeId,
      titel,
      beschreibung: `${terminAnfrage.anliegen}\n\nÜbernommen aus Terminanfrage vom ${terminAnfrage.createdAt.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}.`,
      status: "GEPLANT",
      termine: {
        create: {
          datum: slot.datum,
          startZeit: slot.uhrzeitVon,
          endZeit: slot.uhrzeitBis,
          ort: terminAnfrage.adresse,
          notiz: terminAnfrage.wunschZeitraum
            ? `Kundenwunsch: ${terminAnfrage.wunschZeitraum}`
            : null,
        },
      },
    },
  });

  await prisma.terminAnfrage.update({
    where: { id },
    data: { status: "ERLEDIGT", kundeId },
  });

  return Response.json({ auftragId: auftrag.id, kundeId });
}
