import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ladeEinstellungen } from "@/lib/einstellungen";
import { erstelleNachricht, fristText, textEingangBestaetigt } from "@/lib/nachrichten";
import { schlageSlotsVor } from "@/lib/slots";
import { istEntsperrt } from "@/lib/pin";

export const dynamic = "force-dynamic";

const anfrageSchema = z.object({
  kundeName: z.string().trim().min(1, "kundeName fehlt").max(200),
  telefon: z.string().trim().min(3, "telefon fehlt").max(50),
  adresse: z.string().trim().max(300).optional(),
  anliegen: z.string().trim().min(1, "anliegen fehlt").max(2000),
  dringlichkeit: z.enum(["NOTFALL", "DRINGEND", "NORMAL"]).default("NORMAL"),
  wunschZeitraum: z.string().trim().max(200).optional(),
  quelle: z.enum(["TELEFON", "WEB", "MANUELL"]).default("TELEFON"),
});

/**
 * Neue Terminanfrage – Webhook-Ziel für den Voice-Agenten (Vapi),
 * auch manuell nutzbar. Erzeugt automatisch die Eingangsbestätigung
 * an den Kunden und 2–3 Slot-Vorschläge für den Chef.
 *
 * Optional absicherbar: Ist ANFRAGEN_WEBHOOK_SECRET gesetzt, muss der
 * Aufrufer den Header "x-webhook-secret" mit diesem Wert mitschicken.
 */
export async function POST(anfrage: Request) {
  const geheimnis = process.env.ANFRAGEN_WEBHOOK_SECRET;
  if (geheimnis && anfrage.headers.get("x-webhook-secret") !== geheimnis) {
    return Response.json({ fehler: "Ungültiges Webhook-Secret." }, { status: 401 });
  }

  let daten: unknown;
  try {
    daten = await anfrage.json();
  } catch {
    return Response.json({ fehler: "Ungültiges JSON." }, { status: 400 });
  }

  const ergebnis = anfrageSchema.safeParse(daten);
  if (!ergebnis.success) {
    return Response.json(
      {
        fehler: "Validierung fehlgeschlagen.",
        details: ergebnis.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
      { status: 400 }
    );
  }
  const eingabe = ergebnis.data;

  // Slot-Vorschläge berechnen und Anfrage anlegen
  const vorschlaege = await schlageSlotsVor(eingabe.dringlichkeit);
  const terminAnfrage = await prisma.terminAnfrage.create({
    data: {
      kundeName: eingabe.kundeName,
      telefon: eingabe.telefon,
      adresse: eingabe.adresse || null,
      anliegen: eingabe.anliegen,
      dringlichkeit: eingabe.dringlichkeit,
      wunschZeitraum: eingabe.wunschZeitraum || null,
      quelle: eingabe.quelle,
      status: "NEU",
      slots: {
        create: vorschlaege.map((s) => ({
          datum: s.datum,
          uhrzeitVon: s.uhrzeitVon,
          uhrzeitBis: s.uhrzeitBis,
        })),
      },
    },
    include: { slots: true },
  });

  // Eingangsbestätigung an den Kunden – Versandfehler blockieren nie
  const einstellungen = await ladeEinstellungen();
  await erstelleNachricht({
    anfrageId: terminAnfrage.id,
    telefon: terminAnfrage.telefon,
    typ: "EINGANG_BESTAETIGT",
    inhalt: textEingangBestaetigt({
      betriebsname: einstellungen.firmenname || "Ihrem Handwerksbetrieb",
      kundeName: terminAnfrage.kundeName,
      anliegen: terminAnfrage.anliegen,
      frist: fristText(),
    }),
  });

  return Response.json(
    {
      id: terminAnfrage.id,
      status: terminAnfrage.status,
      slotVorschlaege: terminAnfrage.slots.length,
    },
    { status: 201 }
  );
}

/** Anfragen auflisten, optional gefiltert: /api/anfragen?status=NEU */
export async function GET(anfrage: Request) {
  if (!(await istEntsperrt())) {
    return Response.json({ fehler: "Gesperrt – bitte zuerst entsperren." }, { status: 401 });
  }

  const status = new URL(anfrage.url).searchParams.get("status");
  const anfragen = await prisma.terminAnfrage.findMany({
    where: status ? { status } : undefined,
    include: { slots: true, nachrichten: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(anfragen);
}
