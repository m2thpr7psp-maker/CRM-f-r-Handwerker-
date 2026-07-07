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
| **Rechnungen** | Rechnungsentwurf mit einem Klick aus dem Auftrag, Positionen für Arbeitszeit (Std. × Stundensatz) und Material, automatische Netto/MwSt/Brutto-Berechnung, PDF-Export |
| **Suche** | Eine Suche über Kunden und Aufträge |

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

1. Unter **Einstellungen** die Betriebsdaten eintragen (Firmenname, Adresse, Steuernummer oder USt-IdNr., IBAN, Stundensatz, Logo) – diese Angaben landen auf dem Rechnungs-PDF.
2. Unter **Mitarbeiter** das Team mit Kalenderfarben anlegen.
3. Ersten Kunden anlegen → Auftrag anlegen → Termin planen.
4. Ist ein Auftrag fertig: auf der Auftragsseite **„Rechnungsentwurf erzeugen“** tippen, Positionen erfassen, **„PDF ansehen“**.

Das Seed-Skript (`npm run db:seed`) löscht vorhandene Daten und füllt die Datenbank mit Demo-Daten – praktisch zum Ausprobieren, **nicht** ausführen, wenn schon echte Daten drin sind.

## Bekannte Grenzen (v1)

- **Keine E-Rechnung:** Das PDF ist ausdrücklich als **„Rechnungsentwurf zur Prüfung“** gekennzeichnet. Es ist **keine Rechnung im Sinne des § 14 UStG** und ersetzt keine Buchhaltungssoftware. Die endgültige Rechnung (insbesondere die seit 2025 im B2B-Bereich verpflichtende E-Rechnung) muss mit einer Buchhaltungs-/Rechnungssoftware erstellt werden.
  - **TODO (bewusst nicht in v1):** Export als XRechnung/ZUGFeRD.
- **Keine Anmeldung/Benutzerverwaltung:** Die App ist für den lokalen bzw. internen Betrieb gedacht (ein Betrieb, ein Rechner oder internes Netz). Nicht ungeschützt ins Internet stellen.
- **SQLite-Datei als Datenbank:** Alle Daten liegen in `prisma/dev.db`. Backup = diese Datei kopieren. Kein gleichzeitiger Betrieb mehrerer Server-Instanzen.
- **Kalender:** Kein Drag & Drop – Termine werden über den „Verschieben auf …“-Dialog verlegt. Sonntagstermine sind nicht vorgesehen (Wochenansicht Mo–Sa).
- **Rechnungsentwürfe:** Ein MwSt-Satz pro Entwurf (19 % / 7 % / 0 %), keine gemischten Steuersätze innerhalb einer Rechnung. Rechnungsnummern (RE-JJJJ-NNNN) laufen pro Jahr fortlaufend, werden aber bei gelöschten Entwürfen nicht wiederverwendet bzw. aufgefüllt.
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
