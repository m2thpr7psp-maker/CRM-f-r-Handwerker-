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

/** Wochentag-Index 0 = Montag … 6 = Sonntag (für VerfuegbarkeitsFenster) */
export function wochentagIndex(datum: Date): number {
  const tag = datum.getUTCDay(); // 0 = So
  return tag === 0 ? 6 : tag - 1;
}

/**
 * "2026-07-15" + "08:00" (deutsche Ortszeit) -> echter UTC-Zeitpunkt.
 * Berücksichtigt Sommer-/Winterzeit über den tatsächlichen Berlin-Offset.
 */
export function berlinZeitZuUtc(datumString: string, zeitString: string): Date {
  const naiv = new Date(`${datumString}T${zeitString}:00Z`);
  const offsetText = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    timeZoneName: "longOffset",
  })
    .formatToParts(naiv)
    .find((teil) => teil.type === "timeZoneName")?.value; // z. B. "GMT+02:00"
  const treffer = offsetText?.match(/([+-])(\d{2}):(\d{2})/);
  if (!treffer) return naiv;
  const vorzeichen = treffer[1] === "+" ? 1 : -1;
  const offsetMinuten = vorzeichen * (Number(treffer[2]) * 60 + Number(treffer[3]));
  return new Date(naiv.getTime() - offsetMinuten * 60_000);
}

/** Aktuelle Uhrzeit in Deutschland als "HH:mm" */
export function jetztZeitString(): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** "vor 5 Min" / "vor 2 Std" / "vor 3 Tagen" */
export function zeitSeit(zeitpunkt: Date): string {
  const minuten = Math.max(0, Math.floor((Date.now() - zeitpunkt.getTime()) / 60_000));
  if (minuten < 1) return "gerade eben";
  if (minuten < 60) return `vor ${minuten} Min`;
  const stunden = Math.floor(minuten / 60);
  if (stunden < 24) return `vor ${stunden} Std`;
  const tage = Math.floor(stunden / 24);
  return tage === 1 ? "vor 1 Tag" : `vor ${tage} Tagen`;
}
