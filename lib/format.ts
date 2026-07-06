// Alle Datumswerte werden als UTC-Mitternacht gespeichert und als UTC formatiert,
// damit es keine Zeitzonen-Verschiebungen gibt (die App läuft lokal in Deutschland).

export function formatWaehrung(betrag: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(betrag);
}

export function formatDatum(datum: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(datum);
}

export function formatDatumLang(datum: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(datum);
}

export function formatWochentagKurz(datum: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    timeZone: "UTC",
  }).format(datum);
}

/** "2026-07-06" -> Date (UTC-Mitternacht) */
export function parseDatum(datumString: string): Date {
  return new Date(`${datumString}T00:00:00.000Z`);
}

/** Date (UTC-Mitternacht) -> "2026-07-06" (für <input type="date">) */
export function toDatumString(datum: Date): string {
  return datum.toISOString().slice(0, 10);
}

/** Heutiges Datum in Deutschland als "yyyy-MM-dd" */
export function heuteDatumString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
  }).format(new Date());
}

/** Heutiges Datum in Deutschland als Date (UTC-Mitternacht) */
export function heuteDatum(): Date {
  return parseDatum(heuteDatumString());
}

/** "08:30" -> Minuten seit Mitternacht */
export function zeitZuMinuten(zeit: string): number {
  const [h, m] = zeit.split(":").map(Number);
  return h * 60 + m;
}

export function addTage(datum: Date, tage: number): Date {
  const neu = new Date(datum);
  neu.setUTCDate(neu.getUTCDate() + tage);
  return neu;
}

/** Montag der Woche, in der das Datum liegt (UTC-Mitternacht) */
export function montagDerWoche(datum: Date): Date {
  const tag = datum.getUTCDay(); // 0 = So, 1 = Mo, ...
  const diff = tag === 0 ? -6 : 1 - tag;
  return addTage(datum, diff);
}
