/**
 * IBAN-Prüfung nach ISO 13616 (Mod-97). Erkennt Tippfehler,
 * ersetzt aber keine Prüfung durch die Bank.
 */
export function ibanGueltig(iban: string): boolean {
  const kompakt = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(kompakt)) return false;
  // Deutsche IBAN ist immer 22 Zeichen lang
  if (kompakt.startsWith("DE") && kompakt.length !== 22) return false;

  const umgestellt = kompakt.slice(4) + kompakt.slice(0, 4);
  const alsZahl = umgestellt.replace(/[A-Z]/g, (z) => String(z.charCodeAt(0) - 55));
  return BigInt(alsZahl) % 97n === 1n;
}
