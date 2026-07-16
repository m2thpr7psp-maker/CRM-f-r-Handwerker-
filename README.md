# HandwerkOS

**Terminplanung, Aufträge, Kunden und Rechnungsvorbereitung in einem einfachen Tool** – gebaut für kleine Handwerksbetriebe (1–10 Mitarbeiter) in Deutschland.

- Komplett auf Deutsch, radikal einfache Bedienung
- Mobile-First: auf dem Smartphone genauso gut bedienbar wie am PC
- Läuft lokal, keine Cloud, keine externen Dienste, keine Anmeldung (v1)

## Funktionen

| Bereich | Was geht |
|---|---|
| **Kunden** | Anlegen, bearbeiten, Notizen („Schlüssel beim Nachbarn“), Anruf per Tipp auf die Telefonnummer |
| **Aufträge** | Status per Klick wechseln (Anfrage → Geplant → In Arbeit → Abgeschlossen → Abgerechnet), Statusfilter |
| **Kalender** | Wochenansicht Mo–Sa, Tagesansicht für unterwegs, Mitarbeiterfarben, Termin per Klick anlegen |
| **Termine** | Ort wird automatisch mit der Kundenadresse vorbelegt, Warnung bei Doppelbuchung eines Mitarbeiters, „Verschieben auf …“-Dialog |
| **Rechnungen** | Rechnungsentwurf mit einem Klick aus dem Auftrag, Positionen für Arbeitszeit (Std. × Stundensatz) und Material, automatische Netto/MwSt/Brutto-Berechnung, PDF-Export, XRechnung-Export (E-Rechnung, UBL/EN 16931) |
| **Suche** | Eine Suche über Kunden und Aufträge |
| **Datensicherung** | Komplettes Datenbank-Backup per Knopfdruck in den Einstellungen |
| **PIN-Sperre** | Optionaler Geräteschutz (4–8 Ziffern) für Büro und Baustelle |
| **Kleinunternehmer** | § 19 UStG-Modus: 0 % MwSt als Standard, Pflichthinweis auf PDF und XRechnung |
| **DSGVO** | Datenauskunft nach Art. 15 DSGVO als PDF direkt von der Kundenseite |
| **Terminanfragen (Fritz)** | Telefonassistent-Anbindung: Anfragen laufen ein, der Chef bestätigt Termine mit einem Tipp, Kunden erhalten automatische SMS-Bestätigungen |

## Installation

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20.

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank anlegen (SQLite, liegt danach in prisma/dev.db)
npm run db:push

# 3. Optional: Demo-Daten laden (Malerbetrieb mit 8 Kunden,
#    12 Aufträgen, 20 Terminen, 3 Mitarbeitern, 2 Rechnungsentwürfen)
npm run db:seed
```

## Start

```bash
# Für den täglichen Einsatz (schneller):
npm run build
npm run start

# Oder für Entwicklung:
npm run dev
```

Danach im Browser öffnen: **http://localhost:3000**

Auf dem Smartphone im selben WLAN: `http://<IP-des-Rechners>:3000`

### Erste Schritte

1. Unter **Einstellungen** die Betriebsdaten eintragen (Firmenname, Adresse, Telefon, E-Mail, Steuernummer oder USt-IdNr., IBAN, Stundensatz, Logo) – diese Angaben landen auf dem Rechnungs-PDF und in der XRechnung.
2. Unter **Mitarbeiter** das Team mit Kalenderfarben anlegen.
3. Ersten Kunden anlegen → Auftrag anlegen → Termin planen.
4. Ist ein Auftrag fertig: auf der Auftragsseite **„Rechnungsentwurf erzeugen“** tippen, Positionen erfassen, **„PDF ansehen“** oder **„XRechnung (XML)“** herunterladen.
5. Empfohlen: in den Einstellungen die **PIN-Sperre** aktivieren und regelmäßig ein **Backup** herunterladen.

Das Seed-Skript (`npm run db:seed`) löscht vorhandene Daten und füllt die Datenbank mit Demo-Daten – praktisch zum Ausprobieren, **nicht** ausführen, wenn schon echte Daten drin sind.

## E-Rechnung (XRechnung)

Seit 1. Januar 2025 müssen inländische Unternehmen E-Rechnungen **empfangen** können; die Pflicht zur **Ausstellung** im B2B-Geschäft greift stufenweise (Übergangsfristen bis Ende 2027). Für Aufträge von Behörden (B2G) ist die E-Rechnung mit **Leitweg-ID** schon lange Pflicht.

HandwerkOS exportiert Rechnungsentwürfe als **XRechnung** (UBL-Syntax, Profil XRechnung 3.0, EN 16931):

- Button **„XRechnung (XML)“** auf der Rechnungsseite.
- Voraussetzung: vollständige Betriebsdaten (inkl. **Telefon und E-Mail**) und vollständige Kundendaten (Adresse und **E-Mail des Kunden**). Fehlt etwas, zeigt der Export eine verständliche Liste der fehlenden Angaben.
- Für Behörden das Feld **„Leitweg-ID / Referenz des Kunden“** auf der Rechnung ausfüllen.
- **Wichtig:** HandwerkOS bleibt ein Entwurfs-Werkzeug. Prüfen Sie die Datei vor dem Versand (z. B. mit dem KoSIT-Validator oder durch Import in Ihre Buchhaltungssoftware). Die rechtliche Verantwortung für die endgültige Rechnung liegt beim Betrieb.
- **TODO:** ZUGFeRD (PDF mit eingebettetem XML) ist weiterhin nicht enthalten – es erfordert PDF/A-3 mit eingebetteten Schriften und spezieller XMP-Metadatenstruktur. Die XRechnung-XML-Datei deckt die E-Rechnungs-Anforderung ab, da beide Formate der EN 16931 entsprechen.

## Terminanfragen-Modul (Fritz)

Fritz ist der KI-Telefonassistent, der ans Telefon geht, wenn der Chef auf dem
Gerüst steht. HandwerkOS enthält das komplette Anfrage-Backend – die
Voice-Konfiguration (Vapi) erfolgt separat und ruft nur den Webhook auf.

**Ablauf:**

1. Ein Kunde ruft an. Der Voice-Agent erfasst Anliegen, Name, Adresse,
   Rückrufnummer, Dringlichkeit und Wunschzeitraum und schickt alles per
   `POST /api/anfragen` an HandwerkOS (auch manuell/über die Website nutzbar).
2. Der Kunde erhält sofort eine SMS-Eingangsbestätigung mit Frist
   („…meldet sich bis morgen 18 Uhr mit einem Terminvorschlag“) – so ruft er
   nicht bei der Konkurrenz an.
3. Der Chef sieht die Anfrage unter **Anfragen** (rotes Badge in der
   Navigation): Anliegen, Adresse als Karten-Link, Dringlichkeit und 2–3
   Slot-Vorschläge aus seinen Verfügbarkeitsfenstern. **Ein Tipp bestätigt
   den Termin** – alternativ „Anderen Termin wählen“ oder „Ablehnen“ (mit
   Kurzbegründung, die dem Kunden gesendet wird).
4. Der Kunde bekommt automatisch die finale Terminbestätigung mit
   Zusammenfassung sowie eine Erinnerung 24 Stunden vor dem Termin.
5. Optional: **„In Aufträge & Kalender übernehmen“** macht aus der
   bestätigten Anfrage einen Kunden (per Rufnummer wiedererkannt), einen
   Auftrag (Status „Geplant“) und einen Kalendertermin – die Anfrage gilt
   dann als erledigt.

**Einrichtung:**

- Unter **Einstellungen → Verfügbarkeit** die Zeitfenster pflegen, in denen
  der Betrieb Termine annimmt (daraus entstehen die Slot-Vorschläge;
  bei Notfällen wird ab sofort gesucht, sonst ab morgen).
- Geplante Nachrichten (z. B. Erinnerungen) versendet
  `GET /api/cron/nachrichten` – regelmäßig aufrufen (Cronjob, Vercel Cron;
  Beispielkonfiguration im Quelltext der Route). In v1 gibt es bewusst
  keinen eingebauten Scheduler.
- Versandfehler blockieren nie die Anfrage: Nachrichten mit Status FEHLER
  bleiben in der Datenbank nachvollziehbar.

**.env-Schlüssel** (siehe `.env.example`):

| Schlüssel | Zweck |
|---|---|
| `NACHRICHTEN_PROVIDER` | `console` (Standard, loggt statt zu senden) oder `twilio` |
| `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM` | Twilio-Zugangsdaten für echten SMS-Versand |
| `ANFRAGEN_WEBHOOK_SECRET` | optional: sichert `POST /api/anfragen` ab (Header `x-webhook-secret`) |
| `CRON_SECRET` | optional: sichert die Cron-Route ab (`Authorization: Bearer …`) |

**Bewusst nicht in v1:** keine Direktbuchung durch Kunden (der Chef behält
die Kontrolle), WhatsApp-Versand nur als vorbereiteter Stub (360dialog),
keine Vapi-Konfiguration im Code.

**Voice-Agent anbinden:** Der Webhook versteht sowohl rohes JSON als auch
den Vapi-Tool-Call-Umschlag (Antwort im `results`-Format). Kopierfertiger
System-Prompt, Tool-Schema und Demo-Checkliste: `docs/vapi-einrichtung.md`.
Protokoll zur Stimmenauswahl: `docs/stimmen-test.md`.

## Datenschutz & Aufbewahrung (DSGVO/GoBD)

- **Lokale Datenhaltung:** Alle Daten bleiben in einer SQLite-Datei (`prisma/dev.db`) auf Ihrem Rechner. Keine Cloud, keine Telemetrie, keine Übermittlung an Dritte – das minimiert DSGVO-Risiken (keine Auftragsverarbeiter nötig).
- **Personenbezogene Daten:** Die App speichert Kundendaten (Name, Adresse, Telefon, E-Mail, Notizen). Der Betrieb ist dafür Verantwortlicher im Sinne der DSGVO. Tragen Sie in das Notizfeld nur, was Sie auch dem Kunden zeigen könnten (Auskunftsrecht nach Art. 15 DSGVO).
- **Datenauskunft:** Auf jeder Kundenseite erzeugt **„Datenauskunft (DSGVO)“** ein PDF mit allen zu dieser Person gespeicherten Daten (Stammdaten, Aufträge, Termine, Rechnungsentwürfe) – zum Aushändigen, wenn ein Kunde nach Art. 15 DSGVO anfragt.
- **Kleinunternehmer:** In den Einstellungen aktivierbar (§ 19 UStG). Neue Rechnungsentwürfe starten dann mit 0 % MwSt, und PDF wie XRechnung enthalten den Pflichthinweis „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.“
- **Löschen:** Kunde löschen entfernt dauerhaft alle zugehörigen Aufträge, Termine und Rechnungsentwürfe (Art. 17 DSGVO). Achtung: Bereits gestellte Rechnungen unterliegen der steuerlichen **Aufbewahrungspflicht (8 Jahre, § 147 AO)** – bewahren Sie endgültige Rechnungen in Ihrer Buchhaltung auf, bevor Sie hier löschen.
- **Backups:** Das Backup enthält alle personenbezogenen Daten. Sicher aufbewahren (verschlüsselter USB-Stick, verschlüsselte Festplatte), alte Backups löschen.
- **PIN-Sperre:** Schützt vor neugierigen Blicken auf offenen Geräten. Sie ersetzt **keine** Festplatten-Verschlüsselung (BitLocker/FileVault aktivieren!) und keine Benutzerkonten.

## Bekannte Grenzen (v1)

- **Rechnungsentwürfe:** PDF und XRechnung sind als **„Entwurf zur Prüfung“** gedacht. Das PDF ist ausdrücklich **keine Rechnung im Sinne des § 14 UStG**; die App ersetzt keine Buchhaltungssoftware und keine GoBD-konforme Archivierung.
- **Keine Benutzerverwaltung:** Ein Betrieb, eine Datenbank, keine Konten. Die PIN-Sperre ist ein einfacher Sichtschutz. Nicht ungeschützt ins Internet stellen – die App gehört auf einen lokalen Rechner oder ins interne Netz.
- **SQLite-Datei als Datenbank:** Backup über die Einstellungen (empfohlen) oder Datei kopieren. Kein gleichzeitiger Betrieb mehrerer Server-Instanzen.
- **Kalender:** Kein Drag & Drop – Termine werden über den „Verschieben auf …“-Dialog verlegt. Sonntagstermine sind nicht vorgesehen (Wochenansicht Mo–Sa).
- **Rechnungsentwürfe:** Ein MwSt-Satz pro Entwurf (19 % / 7 % / 0 %), keine gemischten Steuersätze innerhalb einer Rechnung. Rechnungsnummern (RE-JJJJ-NNNN) laufen pro Jahr fortlaufend, werden aber bei gelöschten Entwürfen nicht wiederverwendet bzw. aufgefüllt (GoBD-freundlich: keine Doppelvergabe).
- **XRechnung:** Die erzeugte XML wird nicht lokal gegen die offiziellen Schematron-Regeln validiert – vor dem Versand extern prüfen (siehe oben).
- **Suche:** Bei Umlauten wird Groß-/Kleinschreibung unterschieden (technische Grenze von SQLite).
- **Zeiten:** Die App rechnet mit deutscher Ortszeit; es gibt keine Zeitzonen-Unterstützung.

## Technik

- [Next.js 15](https://nextjs.org) (App Router) + TypeScript
- [Prisma 6](https://www.prisma.io) + SQLite (lokale Datei, keine externen Dienste)
- [Tailwind CSS 4](https://tailwindcss.com)
- PDF-Erzeugung serverseitig mit [pdfkit](https://pdfkit.org)

### Nützliche Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm run start` | Produktionsserver (nach Build) |
| `npm run db:push` | Datenbankschema anlegen/aktualisieren |
| `npm run db:seed` | Demo-Daten laden (löscht vorhandene Daten!) |
| `npm run lint` | Code-Prüfung |
