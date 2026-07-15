/**
 * Austauschbare Versand-Provider für Kundennachrichten.
 * Auswahl über die Umgebungsvariable NACHRICHTEN_PROVIDER:
 *   "console" (Standard, loggt statt zu senden) | "twilio"
 * WhatsApp (360dialog) ist in v1 nur als Stub vorgesehen.
 */

export type NachrichtenProvider = {
  name: string;
  sende(anTelefon: string, text: string): Promise<void>;
};

/** Entwicklung: loggt Nachrichten in die Server-Konsole statt zu senden */
export const consoleProvider: NachrichtenProvider = {
  name: "console",
  async sende(anTelefon, text) {
    console.log(`[Nachricht -> ${anTelefon}] ${text}`);
  },
};

/** SMS-Versand über Twilio (TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM in .env) */
export const twilioProvider: NachrichtenProvider = {
  name: "twilio",
  async sende(anTelefon, text) {
    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_TOKEN;
    const von = process.env.TWILIO_FROM;
    if (!sid || !token || !von) {
      throw new Error("Twilio ist nicht konfiguriert (TWILIO_SID/TWILIO_TOKEN/TWILIO_FROM).");
    }

    const antwort = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: anTelefon, From: von, Body: text }),
      }
    );
    if (!antwort.ok) {
      throw new Error(`Twilio-Fehler ${antwort.status}: ${await antwort.text()}`);
    }
  },
};

/** TODO (v2): WhatsApp-Versand über 360dialog – in v1 bewusst nur ein Stub. */
export const whatsappStubProvider: NachrichtenProvider = {
  name: "whatsapp-stub",
  async sende() {
    throw new Error("WhatsApp-Versand ist in v1 noch nicht verfügbar (360dialog-Stub).");
  },
};

export function aktiverProvider(): NachrichtenProvider {
  switch (process.env.NACHRICHTEN_PROVIDER) {
    case "twilio":
      return twilioProvider;
    default:
      return consoleProvider;
  }
}
