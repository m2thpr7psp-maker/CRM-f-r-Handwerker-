import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ladeEinstellungen } from "@/lib/einstellungen";
import { erstelleNachricht, textErinnerung, textTerminBestaetigt } from "@/lib/nachrichten";
import { berlinZeitZuUtc, parseDatum, toDatumString, zeitZuMinuten } from "@/lib/format";
import { istEntsperrt } from "@/lib/pin";

export const dynamic = "force-dynamic";

const zeitRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const bestaetigenSchema = z.union([
  z.object({ slotId: z.string().min(1) }),
  z.object({
    datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "datum im Format JJJJ-MM-TT"),
    uhrzeitVon: z.string().regex(zeitRegex, "uhrzeitVon im Format HH:mm"),
    uhrzeitBis: z.string().regex(zeitRegex, "uhrzeitBis im Format HH:mm"),
  }),
]);

/**
 * Chef bestätigt einen Slot (One-Tap) oder wählt einen eigenen Termin.
 * Erzeugt die Terminbestätigung an den Kunden sowie eine geplante
 * Erinnerung 24 Stunden vor dem Termin.
 */
export async function PATCH(
  anfrage: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await istEntsperrt())) {
    return Response.json({ fehler: "Gesperrt – bitte zuerst entsperren." }, { status: 401 });
  }

  const { id } = await params;
  let daten: unknown;
  try {
    daten = await anfrage.json();
  } catch {
    return Response.json({ fehler: "Ungültiges JSON." }, { status: 400 });
  }
  const ergebnis = bestaetigenSchema.safeParse(daten);
  if (!ergebnis.success) {
    return Response.json(
      { fehler: "Bitte einen Slot oder Datum/Uhrzeiten angeben." },
      { status: 400 }
    );
  }

  const terminAnfrage = await prisma.terminAnfrage.findUnique({
    where: { id },
    include: { slots: true },
  });
  if (!terminAnfrage) {
    return Response.json({ fehler: "Anfrage nicht gefunden." }, { status: 404 });
  }
  if (terminAnfrage.status === "BESTAETIGT") {
    return Response.json({ fehler: "Anfrage ist bereits bestätigt." }, { status: 409 });
  }

  let gewaehlt: { datum: Date; uhrzeitVon: string; uhrzeitBis: string };

  if ("slotId" in ergebnis.data) {
    const { slotId } = ergebnis.data;
    const slotGefunden = terminAnfrage.slots.find((s) => s.id === slotId);
    if (!slotGefunden) {
      return Response.json({ fehler: "Slot gehört nicht zu dieser Anfrage." }, { status: 400 });
    }
    gewaehlt = slotGefunden;
    await prisma.$transaction([
      prisma.terminSlot.update({
        where: { id: slotGefunden.id },
        data: { status: "GEWAEHLT" },
      }),
      prisma.terminSlot.updateMany({
        where: { anfrageId: id, id: { not: slotGefunden.id } },
        data: { status: "VERWORFEN" },
      }),
      prisma.terminAnfrage.update({ where: { id }, data: { status: "BESTAETIGT" } }),
    ]);
  } else {
    const eingabe = ergebnis.data;
    if (zeitZuMinuten(eingabe.uhrzeitBis) <= zeitZuMinuten(eingabe.uhrzeitVon)) {
      return Response.json(
        { fehler: "Die Endzeit muss nach der Startzeit liegen." },
        { status: 400 }
      );
    }
    gewaehlt = {
      datum: parseDatum(eingabe.datum),
      uhrzeitVon: eingabe.uhrzeitVon,
      uhrzeitBis: eingabe.uhrzeitBis,
    };
    await prisma.$transaction([
      prisma.terminSlot.updateMany({
        where: { anfrageId: id },
        data: { status: "VERWORFEN" },
      }),
      prisma.terminSlot.create({
        data: { anfrageId: id, ...gewaehlt, status: "GEWAEHLT" },
      }),
      prisma.terminAnfrage.update({ where: { id }, data: { status: "BESTAETIGT" } }),
    ]);
  }

  // Kundennachrichten: Bestätigung sofort, Erinnerung 24 h vor dem Termin
  const einstellungen = await ladeEinstellungen();
  const betriebsname = einstellungen.firmenname || "Ihrem Handwerksbetrieb";

  await erstelleNachricht({
    anfrageId: id,
    telefon: terminAnfrage.telefon,
    typ: "TERMIN_BESTAETIGT",
    inhalt: textTerminBestaetigt({
      betriebsname,
      datum: gewaehlt.datum,
      uhrzeit: gewaehlt.uhrzeitVon,
      zusammenfassung: terminAnfrage.anliegen,
    }),
  });

  const terminBeginn = berlinZeitZuUtc(toDatumString(gewaehlt.datum), gewaehlt.uhrzeitVon);
  const erinnerungAt = new Date(terminBeginn.getTime() - 24 * 60 * 60 * 1000);
  if (erinnerungAt.getTime() > Date.now()) {
    await erstelleNachricht({
      anfrageId: id,
      telefon: terminAnfrage.telefon,
      typ: "ERINNERUNG",
      inhalt: textErinnerung({
        betriebsname,
        uhrzeit: gewaehlt.uhrzeitVon,
        anliegen: terminAnfrage.anliegen,
      }),
      faelligAt: erinnerungAt,
    });
  }

  return Response.json({
    status: "BESTAETIGT",
    termin: {
      datum: toDatumString(gewaehlt.datum),
      uhrzeitVon: gewaehlt.uhrzeitVon,
      uhrzeitBis: gewaehlt.uhrzeitBis,
    },
  });
}
