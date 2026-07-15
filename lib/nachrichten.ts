import { prisma } from "@/lib/prisma";
import { aktiverProvider } from "@/lib/nachrichten/provider";
import { formatDatum } from "@/lib/format";

/**
 * Nachrichten-Templates (deutsch, Sie-Form, kein Marketing-Sprech).
 * Wichtig: Fritz taucht in Kundennachrichten NICHT auf –
 * Absender ist immer der Betrieb.
 */

export function textEingangBestaetigt(werte: {
  betriebsname: string;
  kundeName: string;
  anliegen: string;
  frist: string;
}): string {
  return `Guten Tag ${werte.kundeName}, Ihre Anfrage (${werte.anliegen}) ist bei ${werte.betriebsname} eingegangen. Sie erhalten bis ${werte.frist} einen Terminvorschlag.`;
}

export function textTerminBestaetigt(werte: {
  betriebsname: string;
  datum: Date;
  uhrzeit: string;
  zusammenfassung: string;
}): string {
  return `Ihr Termin mit ${werte.betriebsname}: ${formatDatum(werte.datum)} um ${werte.uhrzeit} Uhr. Besprochen: ${werte.zusammenfassung}. Bei Fragen antworten Sie einfach auf diese Nachricht.`;
}

export function textErinnerung(werte: {
  betriebsname: string;
  uhrzeit: string;
  anliegen: string;
}): string {
  return `Erinnerung: Morgen um ${werte.uhrzeit} Uhr kommt ${werte.betriebsname} zu Ihnen (${werte.anliegen}).`;
}

export function textAbsage(werte: {
  betriebsname: string;
  kundeName: string;
  begruendung: string;
}): string {
  return `Guten Tag ${werte.kundeName}, ${werte.betriebsname} kann Ihre Anfrage leider nicht übernehmen. Grund: ${werte.begruendung}`;
}

/**
 * Frist für die Eingangsbestätigung: vor 12 Uhr angerufen -> „heute 18 Uhr“,
 * danach -> „morgen 18 Uhr“.
 */
export function fristText(): string {
  const stundeInBerlin = Number(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
  return stundeInBerlin < 12 ? "heute 18 Uhr" : "morgen 18 Uhr";
}

/**
 * Legt eine Nachricht an und versendet sie sofort, wenn sie fällig ist.
 * Versandfehler blockieren NIE den Aufrufer: Die Nachricht bleibt dann
 * mit Status FEHLER (bzw. GEPLANT bei späterer Fälligkeit) bestehen.
 */
export async function erstelleNachricht(werte: {
  anfrageId: string;
  telefon: string;
  typ: "EINGANG_BESTAETIGT" | "TERMIN_BESTAETIGT" | "ERINNERUNG" | "ABSAGE";
  inhalt: string;
  faelligAt?: Date;
}): Promise<void> {
  const faelligAt = werte.faelligAt ?? new Date();
  const nachricht = await prisma.nachricht.create({
    data: {
      anfrageId: werte.anfrageId,
      kanal: "SMS",
      typ: werte.typ,
      inhalt: werte.inhalt,
      telefon: werte.telefon,
      faelligAt,
    },
  });

  if (faelligAt.getTime() <= Date.now()) {
    await versendeNachricht(nachricht.id);
  }
}

/** Versendet eine einzelne Nachricht; setzt GESENDET oder FEHLER. Wirft nie. */
export async function versendeNachricht(nachrichtId: string): Promise<boolean> {
  const nachricht = await prisma.nachricht.findUnique({ where: { id: nachrichtId } });
  if (!nachricht || nachricht.status === "GESENDET") return false;

  try {
    await aktiverProvider().sende(nachricht.telefon, nachricht.inhalt);
    await prisma.nachricht.update({
      where: { id: nachrichtId },
      data: { status: "GESENDET", gesendetAt: new Date() },
    });
    return true;
  } catch (fehler) {
    console.error(`Nachrichtenversand fehlgeschlagen (${nachrichtId}):`, fehler);
    await prisma.nachricht
      .update({ where: { id: nachrichtId }, data: { status: "FEHLER" } })
      .catch(() => {});
    return false;
  }
}

/** Versendet alle fälligen geplanten Nachrichten (für die Cron-Route). */
export async function versendeFaelligeNachrichten(): Promise<{
  gesendet: number;
  fehler: number;
}> {
  const faellige = await prisma.nachricht.findMany({
    where: { status: "GEPLANT", faelligAt: { lte: new Date() } },
    orderBy: { faelligAt: "asc" },
  });

  let gesendet = 0;
  let fehler = 0;
  for (const nachricht of faellige) {
    if (await versendeNachricht(nachricht.id)) gesendet++;
    else fehler++;
  }
  return { gesendet, fehler };
}
