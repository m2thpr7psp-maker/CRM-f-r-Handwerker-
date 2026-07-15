import { prisma } from "@/lib/prisma";
import {
  addTage,
  heuteDatum,
  jetztZeitString,
  toDatumString,
  wochentagIndex,
  zeitZuMinuten,
} from "@/lib/format";

export type SlotVorschlag = { datum: Date; uhrzeitVon: string; uhrzeitBis: string };

/**
 * Schlägt die nächsten freien Verfügbarkeitsfenster als Termin-Slots vor.
 *
 * Einfacher v1-Algorithmus laut Spezifikation:
 * - Kandidaten sind die aktiven Verfügbarkeitsfenster der nächsten Tage.
 * - Fenster, in denen an dem Tag bereits ein bestätigter Slot liegt, fallen weg.
 * - NOTFALL/DRINGEND: ab heute (heutige Fenster nur, solange sie nicht vorbei
 *   sind); NORMAL: ab morgen, damit der Chef Luft zum Bestätigen hat.
 * - Es werden maximal `anzahl` (Standard 3) Vorschläge geliefert.
 */
export async function schlageSlotsVor(
  dringlichkeit: string,
  anzahl = 3
): Promise<SlotVorschlag[]> {
  const [fenster, belegteSlots] = await Promise.all([
    prisma.verfuegbarkeitsFenster.findMany({
      where: { aktiv: true },
      orderBy: [{ wochentag: "asc" }, { von: "asc" }],
    }),
    prisma.terminSlot.findMany({
      where: {
        status: "GEWAEHLT",
        datum: { gte: heuteDatum() },
        anfrage: { status: "BESTAETIGT" },
      },
    }),
  ]);

  if (fenster.length === 0) return [];

  const istBelegt = (datum: Date, von: string, bis: string) =>
    belegteSlots.some(
      (slot) =>
        toDatumString(slot.datum) === toDatumString(datum) &&
        zeitZuMinuten(slot.uhrzeitVon) < zeitZuMinuten(bis) &&
        zeitZuMinuten(slot.uhrzeitBis) > zeitZuMinuten(von)
    );

  const heute = heuteDatum();
  const sofort = dringlichkeit === "NOTFALL" || dringlichkeit === "DRINGEND";
  const startOffset = sofort ? 0 : 1;
  const jetzt = jetztZeitString();

  const vorschlaege: SlotVorschlag[] = [];
  for (let offset = startOffset; offset <= 21 && vorschlaege.length < anzahl; offset++) {
    const datum = addTage(heute, offset);
    const tagesFenster = fenster.filter((f) => f.wochentag === wochentagIndex(datum));
    for (const f of tagesFenster) {
      if (vorschlaege.length >= anzahl) break;
      // Heutige Fenster nur vorschlagen, solange sie noch nicht vorbei sind
      if (offset === 0 && zeitZuMinuten(f.bis) <= zeitZuMinuten(jetzt)) continue;
      if (istBelegt(datum, f.von, f.bis)) continue;
      vorschlaege.push({ datum, uhrzeitVon: f.von, uhrzeitBis: f.bis });
    }
  }
  return vorschlaege;
}
