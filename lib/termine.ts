import { prisma } from "@/lib/prisma";
import { formatDatum, zeitZuMinuten } from "@/lib/format";

/**
 * Prüft, ob ein Mitarbeiter im angegebenen Zeitraum bereits einen
 * anderen Termin hat (Doppelbuchung).
 */
export async function findeKonflikt({
  mitarbeiterId,
  datum,
  startZeit,
  endZeit,
  ausgenommenTerminId,
}: {
  mitarbeiterId: string | null;
  datum: Date;
  startZeit: string;
  endZeit: string;
  ausgenommenTerminId?: string;
}): Promise<string | null> {
  if (!mitarbeiterId) return null;

  const termineAmTag = await prisma.termin.findMany({
    where: {
      mitarbeiterId,
      datum,
      ...(ausgenommenTerminId ? { id: { not: ausgenommenTerminId } } : {}),
    },
    include: { auftrag: { include: { kunde: true } }, mitarbeiter: true },
  });

  const neuStart = zeitZuMinuten(startZeit);
  const neuEnde = zeitZuMinuten(endZeit);

  for (const t of termineAmTag) {
    const start = zeitZuMinuten(t.startZeit);
    const ende = zeitZuMinuten(t.endZeit);
    if (neuStart < ende && neuEnde > start) {
      return `${t.mitarbeiter?.name} ist am ${formatDatum(t.datum)} von ${t.startZeit} bis ${t.endZeit} Uhr bereits eingeplant („${t.auftrag.titel}“ bei ${t.auftrag.kunde.name}).`;
    }
  }
  return null;
}
