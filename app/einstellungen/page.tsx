/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { einstellungenSpeichern } from "@/app/actions/einstellungen";
import { ladeEinstellungen } from "@/lib/einstellungen";
import { formatDezimal } from "@/lib/geld";
import { SeitenKopf, Karte, Feld, feldKlasse, SpeichernButton } from "@/components/ui";
import { PinVerwaltung } from "@/components/pin-verwaltung";

export const dynamic = "force-dynamic";

export default async function EinstellungenSeite({
  searchParams,
}: {
  searchParams: Promise<{ gespeichert?: string }>;
}) {
  const [einstellungen, { gespeichert }] = await Promise.all([
    ladeEinstellungen(),
    searchParams,
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Einstellungen" />

      {gespeichert === "1" && (
        <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Einstellungen wurden gespeichert.
        </p>
      )}

      <Karte className="p-5 md:p-6">
        <form action={einstellungenSpeichern} className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Mein Betrieb</h2>
          <Feld label="Firmenname">
            <input
              name="firmenname"
              defaultValue={einstellungen.firmenname}
              placeholder="z. B. Malerbetrieb Weber GmbH"
              className={feldKlasse}
            />
          </Feld>
          <Feld label="Straße und Hausnummer">
            <input
              name="strasse"
              defaultValue={einstellungen.strasse}
              placeholder="z. B. Werkstattweg 5"
              className={feldKlasse}
            />
          </Feld>
          <div className="grid grid-cols-[1fr_2fr] gap-4">
            <Feld label="PLZ">
              <input
                name="plz"
                inputMode="numeric"
                defaultValue={einstellungen.plz}
                placeholder="12345"
                className={feldKlasse}
              />
            </Feld>
            <Feld label="Ort">
              <input
                name="ort"
                defaultValue={einstellungen.ort}
                placeholder="z. B. Musterstadt"
                className={feldKlasse}
              />
            </Feld>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Feld label="Telefon">
              <input
                name="telefon"
                type="tel"
                defaultValue={einstellungen.telefon}
                placeholder="z. B. 0221 123456"
                className={feldKlasse}
              />
            </Feld>
            <Feld label="E-Mail">
              <input
                name="email"
                type="email"
                defaultValue={einstellungen.email}
                placeholder="z. B. info@betrieb.de"
                className={feldKlasse}
              />
            </Feld>
          </div>
          <p className="-mt-2 text-sm text-slate-500">
            Telefon und E-Mail sind Pflichtangaben für die XRechnung (E-Rechnung).
          </p>

          <h2 className="mt-2 text-lg font-bold">Steuern &amp; Bank</h2>
          <p className="-mt-2 text-sm text-slate-500">
            Steuernummer oder USt-IdNr. ist eine Pflichtangabe auf Rechnungen.
          </p>
          <Feld label="Steuernummer">
            <input
              name="steuernummer"
              defaultValue={einstellungen.steuernummer}
              placeholder="z. B. 21/815/08150"
              className={feldKlasse}
            />
          </Feld>
          <Feld label="USt-IdNr.">
            <input
              name="ustIdNr"
              defaultValue={einstellungen.ustIdNr}
              placeholder="z. B. DE123456789"
              className={feldKlasse}
            />
          </Feld>
          <Feld label="IBAN">
            <input
              name="iban"
              defaultValue={einstellungen.iban}
              placeholder="z. B. DE89 3704 0044 0532 0130 00"
              className={feldKlasse}
            />
          </Feld>

          <h2 className="mt-2 text-lg font-bold">Rechnungen</h2>
          <Feld label="Standard-Stundensatz (netto, in Euro)">
            <input
              name="stundensatz"
              inputMode="decimal"
              defaultValue={formatDezimal(einstellungen.stundensatz)}
              placeholder="z. B. 55,00"
              className={feldKlasse}
            />
          </Feld>

          <Feld label="Logo (PNG oder JPG, max. 1 MB)">
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg"
              className="block w-full text-[15px] file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            />
          </Feld>
          {einstellungen.logo && (
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <img
                src={einstellungen.logo}
                alt="Aktuelles Logo"
                className="h-16 max-w-40 object-contain"
              />
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" name="logoEntfernen" value="1" className="h-5 w-5" />
                Logo entfernen
              </label>
            </div>
          )}

          <div className="mt-2">
            <SpeichernButton />
          </div>
        </form>
      </Karte>

      <Karte className="mt-5 p-5 md:p-6">
        <h2 className="mb-3 text-lg font-bold">Datensicherung</h2>
        <p className="mb-4 text-sm text-slate-500">
          Lädt eine Kopie der kompletten Datenbank herunter (Kunden, Aufträge, Termine,
          Rechnungsentwürfe, Einstellungen). Bewahren Sie die Datei sicher auf – sie
          enthält personenbezogene Daten Ihrer Kunden. Zum Wiederherstellen ersetzen Sie
          die Datei <code className="rounded bg-slate-100 px-1">prisma/dev.db</code> bei
          gestoppter App durch das Backup.
        </p>
        <a
          href="/api/backup"
          className="inline-flex min-h-12 items-center rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600"
        >
          Backup herunterladen
        </a>
      </Karte>

      <Karte className="mt-5 p-5 md:p-6">
        <h2 className="mb-3 text-lg font-bold">PIN-Sperre</h2>
        <PinVerwaltung pinAktiv={Boolean(einstellungen.pinHash)} />
      </Karte>

      <p className="mt-4 text-center text-sm text-slate-500">
        Ihr Team finden Sie unter{" "}
        <Link href="/mitarbeiter" className="font-semibold text-orange-600 hover:underline">
          Mitarbeiter
        </Link>
        .
      </p>
    </div>
  );
}
