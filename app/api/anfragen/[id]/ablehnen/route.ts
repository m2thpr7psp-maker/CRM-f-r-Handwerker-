import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ladeEinstellungen } from "@/lib/einstellungen";
import { erstelleNachricht, textAbsage } from "@/lib/nachrichten";
import { istEntsperrt } from "@/lib/pin";

export const dynamic = "force-dynamic";

const ablehnenSchema = z.object({
  begruendung: z
    .string()
    .trim()
    .min(3, "Bitte eine kurze Begründung angeben (wird dem Kunden gesendet).")
    .max(500),
});

/** Chef lehnt eine Anfrage ab – die Kurzbegründung geht per Nachricht an den Kunden. */
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
  const ergebnis = ablehnenSchema.safeParse(daten);
  if (!ergebnis.success) {
    return Response.json(
      { fehler: ergebnis.error.issues[0]?.message ?? "Begründung fehlt." },
      { status: 400 }
    );
  }

  const terminAnfrage = await prisma.terminAnfrage.findUnique({ where: { id } });
  if (!terminAnfrage) {
    return Response.json({ fehler: "Anfrage nicht gefunden." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.terminSlot.updateMany({ where: { anfrageId: id }, data: { status: "VERWORFEN" } }),
    prisma.terminAnfrage.update({ where: { id }, data: { status: "ABGELEHNT" } }),
  ]);

  const einstellungen = await ladeEinstellungen();
  await erstelleNachricht({
    anfrageId: id,
    telefon: terminAnfrage.telefon,
    typ: "ABSAGE",
    inhalt: textAbsage({
      betriebsname: einstellungen.firmenname || "Ihr Handwerksbetrieb",
      kundeName: terminAnfrage.kundeName,
      begruendung: ergebnis.data.begruendung,
    }),
  });

  return Response.json({ status: "ABGELEHNT" });
}
