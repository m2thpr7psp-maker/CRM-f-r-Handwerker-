# Vapi-Einrichtung für Fritz (Demo & Betrieb)

Die Assistant-Konfiguration erfolgt bewusst **in Vapi, nicht im Code** –
HandwerkOS stellt nur das Webhook-Ziel bereit. Dieses Dokument enthält alles
zum Kopieren: System-Prompt, Tool-Definition und die Checkliste bis zur
Demo-Nummer.

> Hinweis: Feldnamen der Vapi-Oberfläche können sich ändern – im Zweifel die
> aktuelle Vapi-Dokumentation prüfen. Stand dieses Dokuments: Juli 2026.

## 1. Voraussetzungen

- HandwerkOS läuft öffentlich erreichbar (z. B. via Tunnel/Server), Basis-URL
  im Folgenden `https://DEINE-DOMAIN`.
- In `.env` ist `ANFRAGEN_WEBHOOK_SECRET` gesetzt (empfohlen).
- In den Einstellungen ist der Betriebsname gepflegt (steht in den SMS).

## 2. Assistant anlegen

**Modell:** ein schnelles Modell mit gutem Deutsch (Latenz schlägt Größe).
**Stimme:** männliche deutsche Stimme als Default (Markenkonsistenz Fritz),
pro Kunde konfigurierbar – siehe `docs/stimmen-test.md`.
**Transcriber:** Deutsch (de), Telefonie-optimiertes Modell.

### System-Prompt (kopierfertig)

```text
Du bist der Telefonassistent des Handwerksbetriebs {{BETRIEBSNAME}}.

WICHTIG – DEINE ROLLE:
- Du meldest dich IMMER im Namen des Betriebs: „{{BETRIEBSNAME}}, guten Tag!
  Was kann ich für Sie tun?" Du nennst dich NIE „Fritz", NIE „KI" und NIE
  „Assistent". Wenn jemand fragt, ob er mit einer Maschine spricht, antwortest
  du ehrlich: „Ich bin der automatische Telefondienst des Betriebs und nehme
  Ihre Anfrage auf – ein Mitarbeiter meldet sich anschließend persönlich."
- Du sprichst Deutsch, siezt konsequent, bleibst freundlich, ruhig und knapp.
  Keine Marketing-Floskeln. Kurze Sätze. Du klingst wie eine erfahrene
  Bürokraft, nicht wie eine Werbung.
- Ziel: Das Gespräch dauert unter 90 Sekunden.

DEINE AUFGABE – diese Angaben nacheinander erfragen (nicht alles auf einmal):
1. Anliegen: Was ist zu tun? Bei Reparaturen kurz nachfragen, wo genau das
   Problem ist (z. B. „Tropft es am Hahn selbst oder unter der Spüle?").
2. Name des Anrufers.
3. Adresse des Einsatzorts (Straße, Hausnummer, Ort).
4. Rückrufnummer: Wenn die Anrufernummer übertragen wurde, frag nur: „Dürfen
   wir Sie unter der Nummer zurückrufen, mit der Sie gerade anrufen?"
5. Dringlichkeit einschätzen: NOTFALL nur bei Gefahr oder laufendem Schaden
   (Wasser läuft, Stromausfall, Sturmschaden am Dach). DRINGEND, wenn es
   diese Woche sein sollte. Sonst NORMAL. Frag im Zweifel: „Wie dringend ist
   es bei Ihnen – läuft gerade etwas aus oder hat es ein paar Tage Zeit?"
6. Wunschzeitraum: z. B. „eher vormittags", „nachmittags", „nächste Woche".

DANACH:
- Fasse kurz zusammen: Anliegen, Adresse, Wunschzeitraum. Frag: „Habe ich
  das so richtig aufgenommen?"
- Rufe das Tool terminanfrage_erfassen mit allen Angaben auf.
- Verabschiede dich: „Sie bekommen gleich eine SMS-Bestätigung. {{BETRIEBSNAME}}
  meldet sich {{FRIST}} mit einem Terminvorschlag. Vielen Dank für Ihren Anruf!"

REGELN:
- Nenne NIEMALS Preise, Kostenschätzungen oder verbindliche Termine – das
  macht der Chef. Bei Preisfragen: „Das bespricht der Meister direkt mit
  Ihnen, dafür meldet er sich bei Ihnen."
- Sprich Uhrzeiten natürlich aus („halb drei", „14 Uhr 30" – nie „14:30").
- Bei einem echten Notfall mit Gefahr für Leib und Leben (Gasgeruch, Brand):
  Verweise SOFORT an den Notruf 112 bzw. den Gas-Notdienst.
- Wenn der Anrufer kein Kunde sein will (Vertrieb, Werbung): höflich beenden,
  KEIN Tool-Aufruf.
```

Platzhalter `{{BETRIEBSNAME}}` durch den Kundenbetrieb ersetzen,
`{{FRIST}}` durch „bis heute 18 Uhr“ / „bis morgen 18 Uhr“ (oder als
dynamische Variable pflegen).

### Erste Nachricht (First Message)

```text
{{BETRIEBSNAME}}, guten Tag! Was kann ich für Sie tun?
```

## 3. Tool „terminanfrage_erfassen“ anlegen

Custom Tool (Function) mit Server-URL:

- **URL:** `https://DEINE-DOMAIN/api/anfragen`
- **Header:** `x-webhook-secret: <Wert aus ANFRAGEN_WEBHOOK_SECRET>`
- **Beschreibung:** „Übermittelt die aufgenommene Terminanfrage an das
  Bürosystem. Erst aufrufen, wenn alle Pflichtangaben vorliegen und der
  Anrufer die Zusammenfassung bestätigt hat.“

**Parameter-Schema (JSON):**

```json
{
  "type": "object",
  "properties": {
    "kundeName": { "type": "string", "description": "Vollständiger Name des Anrufers" },
    "telefon": { "type": "string", "description": "Rückrufnummer mit Vorwahl" },
    "adresse": { "type": "string", "description": "Straße Hausnummer, PLZ Ort des Einsatzorts" },
    "anliegen": { "type": "string", "description": "Kurzbeschreibung der Arbeit, inkl. wichtiger Details" },
    "dringlichkeit": { "type": "string", "enum": ["NOTFALL", "DRINGEND", "NORMAL"] },
    "wunschZeitraum": { "type": "string", "description": "z. B. 'eher nachmittags', 'nächste Woche'" },
    "quelle": { "type": "string", "enum": ["TELEFON"], "description": "Immer TELEFON" }
  },
  "required": ["kundeName", "telefon", "anliegen"]
}
```

HandwerkOS versteht den Vapi-Tool-Call-Umschlag direkt und antwortet im
`results`-Format. Bei unvollständigen Angaben bekommt der Assistent eine
Fehlermeldung als Tool-Ergebnis zurück und kann nachfragen.

**Test ohne Vapi** (simulierter Tool-Call):

```bash
curl -X POST https://DEINE-DOMAIN/api/anfragen \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: DEIN_SECRET" \
  -d '{"message":{"type":"tool-calls","toolCallList":[{"id":"tc_1","name":"terminanfrage_erfassen","arguments":{"kundeName":"Max Test","telefon":"+49 170 1234567","adresse":"Olewiger Straße 55, 54295 Trier","anliegen":"Wasserhahn tropft","dringlichkeit":"DRINGEND","wunschZeitraum":"eher nachmittags","quelle":"TELEFON"}}]}}'
```

## 4. Demo-Checkliste (Tag-14-Ziel)

1. Telefonnummer in Vapi kaufen/verbinden und dem Assistenten zuweisen.
2. Stimmen-Blindtest nach `docs/stimmen-test.md` durchführen, Stimme festlegen.
3. Demo-Szenario einmal komplett durchspielen (siehe Kontextdokument §13):
   tropfender Wasserhahn, Trier-Olewig, „eher nachmittags“ – unter 90 Sekunden.
4. Prüfen: Anfrage erscheint unter **/anfragen** mit rotem Badge,
   Eingangs-SMS wurde erzeugt (bei `NACHRICHTEN_PROVIDER=console` im
   Server-Log), Slot-Vorschläge passen zu den Verfügbarkeitsfenstern.
5. One-Tap-Bestätigung am Handy testen → Bestätigungs-SMS + geplante
   Erinnerung kontrollieren (`GET /api/cron/nachrichten` ausführen).
6. QR-Code auf die Demo-Nummer generieren (für die Briefe).

## 5. Rechtliches für den Betrieb (Kurzfassung)

- Anrufer werden maschinell verarbeitet → Hinweis in der Datenschutzerklärung
  des Kundenbetriebs (Art. 13 DSGVO), AV-Verträge mit Vapi/Twilio/TTS-Anbieter
  abschließen.
- Der Assistent gibt sich auf Nachfrage als automatischer Telefondienst zu
  erkennen (siehe System-Prompt) – keine Irreführung (UWG § 5).
- Demo-Werte in Verkaufsunterlagen immer als Beispielwerte kennzeichnen.
