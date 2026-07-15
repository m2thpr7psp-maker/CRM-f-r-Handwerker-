import { versendeFaelligeNachrichten } from "@/lib/nachrichten";

export const dynamic = "force-dynamic";

/**
 * Versendet alle geplanten Nachrichten mit Fälligkeit <= jetzt
 * (z. B. Terminerinnerungen 24 h vorher).
 *
 * v1 hat bewusst keinen eigenen Scheduler. Aufruf-Möglichkeiten:
 * - manuell / per Systemd-Timer / Cronjob: curl http://localhost:3000/api/cron/nachrichten
 * - Vercel Cron (vercel.json), Beispiel für alle 15 Minuten:
 *   { "crons": [{ "path": "/api/cron/nachrichten", "schedule": "0/15 * * * *" }] }
 *
 * Optional absicherbar: Ist CRON_SECRET gesetzt, muss der Aufrufer
 * "Authorization: Bearer <CRON_SECRET>" mitschicken (Vercel Cron tut
 * das automatisch, wenn die Umgebungsvariable CRON_SECRET existiert).
 */
export async function GET(anfrage: Request) {
  const geheimnis = process.env.CRON_SECRET;
  if (geheimnis && anfrage.headers.get("authorization") !== `Bearer ${geheimnis}`) {
    return Response.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  }

  const ergebnis = await versendeFaelligeNachrichten();
  return Response.json(ergebnis);
}
