"use server";

import { prisma } from "@/lib/prisma";
import { heuteDatum, parseDatum } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Fortlaufende Rechnungsnummer im Format RE-2026-0001 (pro Jahr neu ab 0001).
 * Läuft in einer Transaktion, damit keine Nummer doppelt vergeben wird.
 */
async function naechsteRechnungsnummer(
  tx: Pick<typeof prisma, "rechnung">,
  jahr: number
): Promise<string> {
  const praefix = `RE-${jahr}-`;
  const letzte = await tx.rechnung.findFirst({
    where: { nummer: { startsWith: praefix } },
    orderBy: { nummer: "desc" },
  });
  const letzteNummer = letzte ? Number(letzte.nummer.slice(praefix.length)) : 0;
  return `${praefix}${String(letzteNummer + 1).padStart(4, "0")}`;
}

/** Erzeugt mit einem Klick einen Rechnungsentwurf aus einem Auftrag */
export async function rechnungAusAuftragErzeugen(auftragId: string) {
  const auftrag = await prisma.auftrag.findUnique({
    where: { id: auftragId },
    include: { termine: { orderBy: { datum: "asc" } } },
  });
  if (!auftrag) return;

  const heute = heuteDatum();
  const leistungVon = auftrag.termine[0]?.datum ?? heute;
  const leistungBis = auftrag.termine[auftrag.termine.length - 1]?.datum ?? heute;

  const rechnung = await prisma.$transaction(async (tx) => {
    const nummer = await naechsteRechnungsnummer(tx, heute.getUTCFullYear());
    return tx.rechnung.create({
      data: {
        nummer,
        auftragId,
        datum: heute,
        leistungVon,
        leistungBis,
        mwstSatz: 19,
        zahlungszielTage: 14,
      },
    });
  });

  revalidatePath("/rechnungen");
  revalidatePath(`/auftraege/${auftragId}`);
  redirect(`/rechnungen/${rechnung.id}`);
}

export type PositionEingabe = {
  bezeichnung: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
};

export type RechnungKopfEingabe = {
  datum: string;
  leistungVon: string;
  leistungBis: string;
  mwstSatz: number;
  zahlungszielTage: number;
};

export async function rechnungSpeichern(
  rechnungId: string,
  kopf: RechnungKopfEingabe,
  positionen: PositionEingabe[]
): Promise<{ fehler?: string } | void> {
  if (!kopf.datum) return { fehler: "Bitte ein Rechnungsdatum angeben." };
  if (![19, 7, 0].includes(kopf.mwstSatz)) return { fehler: "Ungültiger MwSt-Satz." };

  const gueltige = positionen
    .map((p) => ({
      bezeichnung: p.bezeichnung.trim(),
      menge: p.menge,
      einheit: p.einheit,
      einzelpreis: p.einzelpreis,
    }))
    .filter((p) => p.bezeichnung !== "");

  for (const p of gueltige) {
    if (!Number.isFinite(p.menge) || p.menge <= 0) {
      return { fehler: `Ungültige Menge bei „${p.bezeichnung}“.` };
    }
    if (!Number.isFinite(p.einzelpreis) || p.einzelpreis < 0) {
      return { fehler: `Ungültiger Einzelpreis bei „${p.bezeichnung}“.` };
    }
  }

  await prisma.$transaction([
    prisma.rechnung.update({
      where: { id: rechnungId },
      data: {
        datum: parseDatum(kopf.datum),
        leistungVon: kopf.leistungVon ? parseDatum(kopf.leistungVon) : null,
        leistungBis: kopf.leistungBis ? parseDatum(kopf.leistungBis) : null,
        mwstSatz: kopf.mwstSatz,
        zahlungszielTage: kopf.zahlungszielTage,
      },
    }),
    prisma.rechnungsPosition.deleteMany({ where: { rechnungId } }),
    prisma.rechnungsPosition.createMany({
      data: gueltige.map((p, i) => ({ ...p, rechnungId, sortierung: i })),
    }),
  ]);

  revalidatePath("/rechnungen");
  revalidatePath(`/rechnungen/${rechnungId}`);
}

export async function rechnungLoeschen(id: string) {
  const rechnung = await prisma.rechnung.delete({ where: { id } });
  revalidatePath("/rechnungen");
  revalidatePath(`/auftraege/${rechnung.auftragId}`);
  redirect("/rechnungen");
}
