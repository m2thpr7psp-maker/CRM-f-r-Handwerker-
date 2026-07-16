# Stimmen-Test: Welche Telefonstimme für Fritz?

Ziel: Die Stimme finden, die am Telefon (nicht im Browser!) am
vertrauenswürdigsten klingt – bewertet von Leuten, die der Zielgruppe
entsprechen (Handwerksmeister 45+, konservativ).

## Grundregel

**Immer durchs echte Telefon testen.** Telefonleitungen komprimieren auf
8 kHz – eine Stimme, die im Playground brillant klingt, kann am Telefon
blechern wirken, und Qualitätsunterschiede zwischen teuren und günstigen
Anbietern schrumpfen deutlich. Vorgehen: denselben Vapi-Assistenten mehrfach
anlegen (nur Stimme unterschiedlich), jede Nummer mit dem Handy anrufen,
Gespräch aufnehmen.

## Testsätze (deckt die typischen Schwächen deutscher TTS ab)

1. Begrüßung: „Malerbetrieb Farbenfroh, guten Tag! Was kann ich für Sie tun?“
2. Termin mit Datum/Uhrzeit: „Ich schlage Ihnen Donnerstag, den 16. Juli um
   halb drei vor.“
3. Adresse mit PLZ wiederholen: „Olewiger Straße 55 in 54295 Trier – habe
   ich das richtig notiert?“
4. Regionale Eigennamen: „Weisgerber“, „Ehrang“, „Konz“, „Schweich“,
   „Litke und Klein“.
5. Rückfrage mit Betonung: „Nur damit ich das richtig verstehe: Es tropft
   unter der Spüle, nicht am Hahn selbst?“
6. Verabschiedung: „Sie bekommen gleich eine SMS-Bestätigung. Vielen Dank
   für Ihren Anruf!“

## Blindtest-Protokoll

- 3–4 Aufnahmen (gleicher Text, verschiedene Stimmen) in zufälliger
  Reihenfolge 3–5 Personen aus der Zielgruppe vorspielen (nicht
  Tech-affinen Freunden).
- Pro Aufnahme zwei Fragen:
  1. Schulnote 1–6 für „klingt wie ein Mensch, dem ich meinen Auftrag
     anvertraue“.
  2. **„Hättest du aufgelegt?“** (ja/nein) – das ist die entscheidende Frage.
- Zusätzlich selbst messen: **Latenz** vom Satzende des Anrufers bis zum
  Antwortbeginn (Stoppuhr; Ziel < 1 Sekunde) und Verhalten bei
  **Unterbrechungen** (spricht der Agent einfach weiter, ist die Demo tot).

## Anbieter-Shortlist (Stand Juli 2026, alle in Vapi wählbar)

| Anbieter | TTS-Kosten grob | Einschätzung |
|---|---|---|
| ElevenLabs (Flash) | ~0,05–0,08 $/Min | Beste deutsche Stimmen, niedrige Latenz – erste Wahl für die Demo |
| Cartesia (Sonic) | ~0,02–0,04 $/Min | Sehr schnell, gute Qualität – Preis-Leistungs-Kandidat für den Regelbetrieb |
| Azure Neural | ~0,015 $/Min | Solide „Hotline-Stimme“, hörbar künstlicher – Fallback |
| Vapi Voices | ~0,0025 $/Min | Fast gratis, Qualität selbst prüfen |

Dazu kommen immer Vapi-Plattform (~0,05 $/Min), Telefonie, Transkription und
LLM – all-in realistisch **0,12–0,25 $/Min**. Bei 200 Minuten/Monat pro Kunde
macht der Unterschied zwischen Premium- und Billigstimme nur wenige Euro aus;
die Demo ist das wichtigste Verkaufswerkzeug, also nicht an der Stimme sparen.

**Empfehlung:** Mit ElevenLabs Flash (männliche deutsche Stimme) starten,
Cartesia im Blindtest gegentesten. Hört die Zielgruppe keinen Unterschied,
Cartesia für den Regelbetrieb nehmen und ElevenLabs für Demos behalten –
der Stimmwechsel pro Assistent ist in Vapi ein Dropdown.

## Ergebnis festhalten

| Datum | Stimme/Anbieter | Ø Note | „Aufgelegt?“ | Latenz | Entscheidung |
|---|---|---|---|---|---|
| | | | | | |
