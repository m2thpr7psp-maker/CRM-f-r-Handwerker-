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

type AnfrageEingabe = z.infer<typeof anfrageSchema>;

/**
 * Vapi verpackt Tool-Aufrufe in einen eigenen Umschlag:
 *   { "message": { "type": "tool-calls", "toolCallList": [{ "id", "name", "arguments" }] } }
 * und erwartet als Antwort { "results": [{ "toolCallId", "result" }] }.
 * Diese Funktion erkennt den Umschlag und liefert die Argumente des
 * ersten Tool-Aufrufs, sonst null (dann gilt der Body als rohes JSON).
 */
function entpackeVapiToolCall(daten: unknown): { toolCallId: string; argumente: unknown } | null {
  if (typeof daten !== "object" || daten === null || !("message" in daten)) return null;
  const message = (daten as { message: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  const m = message as {
    type?: string;
    toolCallList?: { id?: string; arguments?: unknown }[];
    toolCalls?: { id?: string; function?: { arguments?: unknown } }[];
  };
  if (m.type !== "tool-calls") return null;

  const eintrag = m.toolCallList?.[0];
  if (eintrag) {
    return { toolCallId: eintrag.id ?? "unbekannt", argumente: parseArgumente(eintrag.arguments) };
  }
  const aufruf = m.toolCalls?.[0];
  if (aufruf) {
    return {
      toolCallId: aufruf.id ?? "unbekannt",
      argumente: parseArgumente(aufruf.function?.arguments),
    };
  }
  return null;
}

function parseArgumente(argumente: unknown): unknown {
  if (typeof argumente !== "string") return argumente;
  try {
    return JSON.parse(argumente);
  } catch {
    return argumente;
  }
}

/**
 * Neue Terminanfrage – Webhook-Ziel für den Voice-Agenten (Vapi),
 * auch manuell nutzbar. Erzeugt automatisch die Eingangsbestätigung
 * an den Kunden und 2–3 Slot-Vorschläge für den Chef.
 *
 * Akzeptiert zwei Formate:
 * 1. Rohes JSON mit den Anfrage-Feldern (manuell, Website, Make.com …)
 * 2. Vapi-Tool-Call-Umschlag (Antwort dann im Vapi-"results"-Format)
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

  // Vapi-Umschlag? Dann Argumente entpacken und im Vapi-Format antworten.
  const toolCall = entpackeVapiToolCall(daten);
  if (toolCall) {
    const ergebnis = anfrageSchema.safeParse(toolCall.argumente);
    if (!ergebnis.success) {
      const fehlend = ergebnis.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return Response.json({
        results: [
          {
            toolCallId: toolCall.toolCallId,
            result: `Fehler: Anfrage unvollständig (${fehlend}). Bitte fehlende Angaben beim Anrufer erfragen und erneut senden.`,
          },
        ],
      });
    }
    const angelegt = await verarbeiteAnfrage(ergebnis.data);
    return Response.json({
      results: [
        {
          toolCallId: toolCall.toolCallId,
          result: `Anfrage erfasst (${angelegt.slotAnzahl} Terminvorschläge für den Chef). Der Kunde erhält eine SMS-Eingangsbestätigung.`,
        },
      ],
    });
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

  const angelegt = await verarbeiteAnfrage(eingabe);
  return Response.json(
    { id: angelegt.id, status: "NEU", slotVorschlaege: angelegt.slotAnzahl },
    { status: 201 }
  );
}

/** Legt die Anfrage mit Slot-Vorschlägen an und verschickt die Eingangsbestätigung. */
async function verarbeiteAnfrage(
  eingabe: AnfrageEingabe
): Promise<{ id: string; slotAnzahl: number }> {
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

  return { id: terminAnfrage.id, slotAnzahl: terminAnfrage.slots.length };
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
