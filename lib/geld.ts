/** Deutsche Zahleneingabe: "1.234,56" oder "12,5" oder "12.5" -> Zahl (NaN bei ungültiger Eingabe) */
export function parseDezimal(eingabe: string): number {
  const s = eingabe.trim();
  if (s === "") return NaN;
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
  return Number(s);
}

export function rundeGeld(betrag: number): number {
  return Math.round(betrag * 100) / 100;
}

export type PositionWerte = { menge: number; einzelpreis: number };

export function positionsSumme(p: PositionWerte): number {
  return rundeGeld(p.menge * p.einzelpreis);
}

export function berechneSummen(positionen: PositionWerte[], mwstSatz: number) {
  const netto = rundeGeld(positionen.reduce((s, p) => s + positionsSumme(p), 0));
  const mwst = rundeGeld((netto * mwstSatz) / 100);
  const brutto = rundeGeld(netto + mwst);
  return { netto, mwst, brutto };
}

/** 1234.56 -> "1.234,56" (ohne €-Zeichen, z. B. für Eingabefelder) */
export function formatDezimal(wert: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(wert);
}

export const EINHEITEN = ["Std.", "Stk.", "m", "m²", "l", "kg", "pauschal"] as const;

export const MWST_SAETZE = [19, 7, 0] as const;
