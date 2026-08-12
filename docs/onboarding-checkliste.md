# Onboarding-Checkliste: Neuer Fritz-Kunde

Ziel: Ein neuer Betrieb ist in **unter einem halben Tag** live – wiederholbar,
ohne Improvisation. Diese Liste bei jedem Onboarding kopieren, abhaken und
Besonderheiten unten notieren (daraus wird das dokumentierte Onboarding,
Tag-90-Ziel).

**Kunde:** ______________________  **Datum:** ____________  **Tarif:** Starter / Standard / Pro

## 1. Vorgespräch (30 Min, beim Kunden oder Telefon)

- [ ] Gewerk, typische Anliegen und die 3 häufigsten Anrufgründe notieren
      (fließt in den System-Prompt: „Tropft es am Hahn oder unter der Spüle?“)
- [ ] Was gilt bei euch als Notfall? (für die Dringlichkeits-Regeln)
- [ ] Verfügbarkeitsfenster abfragen (Wochentage + Zeiten, in denen Termine
      grundsätzlich möglich sind)
- [ ] Stimme wählen lassen: 2–3 Hörproben vorspielen (m/w) – „Sie wählen die
      Stimme Ihres Betriebs“
- [ ] Rufnummer und Telefonanlage klären: klassischer Anschluss oder
      Cloud-Anlage (Placetel/3CX/NFON)? → bestimmt Schritt 4
- [ ] Erwartungen setzen: Fritz nimmt auf und bestätigt – Termine entscheidet
      IMMER der Chef (One-Tap). Keine Preisauskünfte am Telefon.

## 2. HandwerkOS-Instanz aufsetzen (30 Min)

- [ ] Instanz auf dem Server anlegen (ein Betrieb = eine Instanz),
      `npm install && npm run db:push`
- [ ] Einstellungen ausfüllen: Firmenname, Adresse, Telefon, E-Mail,
      Steuernummer/USt-IdNr, IBAN, Stundensatz, ggf. Kleinunternehmer-Haken
- [ ] Logo hochladen
- [ ] Verfügbarkeitsfenster aus dem Vorgespräch eintragen
      (Einstellungen → Verfügbarkeit)
- [ ] Mitarbeiter mit Kalenderfarben anlegen
- [ ] PIN-Sperre aktivieren, PIN mit dem Chef vereinbaren
- [ ] `.env`: `ANFRAGEN_WEBHOOK_SECRET` setzen, `NACHRICHTEN_PROVIDER=twilio`
      + Twilio-Keys eintragen, Cronjob für `/api/cron/nachrichten` prüfen

## 3. Vapi-Assistent anlegen (30 Min)

- [ ] Assistent aus der Vorlage duplizieren (`docs/vapi-einrichtung.md`)
- [ ] `{{BETRIEBSNAME}}` ersetzen, gewerkspezifische Rückfragen ergänzen
- [ ] Gewählte Stimme eintragen, Transcriber auf Deutsch prüfen
- [ ] Tool `terminanfrage_erfassen`: Webhook-URL der Kunden-Instanz + Secret
- [ ] Telefonnummer zuweisen (pro Kunde eine eigene Vapi-Nummer)
- [ ] Testgespräch im Browser: Standard-Fall + Notfall-Fall + Preisfrage
      (muss abwehren) + „Sind Sie ein Mensch?“ (muss ehrlich antworten)

## 4. Rufumleitung beim Kunden einrichten (15–30 Min)

- [ ] Klassischer Anschluss: netzseitige Rufumleitung im Kundenportal des
      Telefonanbieters auf die Fritz-Nummer (Empfehlung für den Start:
      „bei besetzt / keine Antwort nach X Sekunden“ – Fritz fängt nur ab,
      was sonst verloren ginge)
- [ ] Cloud-Telefonanlage: Weiterleitung + CLIP-Passthrough aktivieren,
      damit die Anrufernummer durchgereicht wird
- [ ] Testanruf: Wird die Original-Anrufernummer in der Anfrage angezeigt?

## 5. Ende-zu-Ende-Test (15 Min, zusammen mit dem Chef)

- [ ] Chef ruft selbst an und spielt einen Kunden – Anfrage erscheint in
      HandwerkOS mit rotem Badge
- [ ] SMS-Eingangsbestätigung kommt auf dem Testhandy an
- [ ] Chef bestätigt per One-Tap → Bestätigungs-SMS kommt an
- [ ] Erinnerung ist unter den Nachrichten als GEPLANT sichtbar
- [ ] „In Aufträge & Kalender übernehmen“ einmal zeigen

## 6. Rechtliches (15 Min)

- [ ] AV-Vertrag zwischen Betrieb und Fritz unterschreiben lassen
- [ ] Datenschutz-Textbaustein übergeben (`docs/datenschutz-textbaustein.md`)
      → gehört in die Datenschutzerklärung der Kunden-Website
- [ ] Hinweisen: Auf Nachfrage gibt sich der Assistent als automatischer
      Telefondienst zu erkennen (ist im Prompt verankert)

## 7. Übergabe an den Chef (15 Min)

- [ ] HandwerkOS auf dem Chef-Handy einrichten (Browser-Lesezeichen auf dem
      Homescreen, PIN einmal gemeinsam eingeben)
- [ ] Die drei Handgriffe zeigen: Anfrage bestätigen, anderen Termin wählen,
      ablehnen mit Begründung
- [ ] Backup zeigen (Einstellungen → Datensicherung), Rhythmus vereinbaren
- [ ] Deine Erreichbarkeit für die erste Woche nennen

## 8. Nachbetreuung Woche 1

- [ ] Tag 2: kurz anrufen – läuft die Umleitung, kommen Anfragen an?
- [ ] Tag 7: Zahlen besprechen (wie viele Anrufe hat Fritz angenommen,
      wie viele Termine bestätigt) – das ist das Material für die
      Referenz und den Nachfass bei den nächsten Briefen

## Notizen / Besonderheiten dieses Kunden

_________________________________________________________________
_________________________________________________________________
