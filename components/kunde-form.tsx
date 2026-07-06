import { Feld, feldKlasse, SpeichernButton, AbbrechenLink, Karte } from "@/components/ui";
import type { Kunde } from "@prisma/client";

export function KundeForm({
  aktion,
  kunde,
  abbrechenHref,
}: {
  aktion: (formData: FormData) => Promise<void>;
  kunde?: Kunde;
  abbrechenHref: string;
}) {
  return (
    <Karte className="p-5 md:p-6">
      <form action={aktion} className="flex flex-col gap-4">
        <Feld label="Name *">
          <input
            name="name"
            required
            defaultValue={kunde?.name ?? ""}
            placeholder="z. B. Max Mustermann"
            className={feldKlasse}
          />
        </Feld>
        <Feld label="Firma (optional)">
          <input
            name="firma"
            defaultValue={kunde?.firma ?? ""}
            placeholder="z. B. Mustermann GmbH"
            className={feldKlasse}
          />
        </Feld>
        <Feld label="Straße und Hausnummer">
          <input
            name="strasse"
            defaultValue={kunde?.strasse ?? ""}
            placeholder="z. B. Hauptstraße 12"
            className={feldKlasse}
          />
        </Feld>
        <div className="grid grid-cols-[1fr_2fr] gap-4">
          <Feld label="PLZ">
            <input
              name="plz"
              inputMode="numeric"
              defaultValue={kunde?.plz ?? ""}
              placeholder="12345"
              className={feldKlasse}
            />
          </Feld>
          <Feld label="Ort">
            <input
              name="ort"
              defaultValue={kunde?.ort ?? ""}
              placeholder="z. B. Musterstadt"
              className={feldKlasse}
            />
          </Feld>
        </div>
        <Feld label="Telefon">
          <input
            name="telefon"
            type="tel"
            defaultValue={kunde?.telefon ?? ""}
            placeholder="z. B. 0171 1234567"
            className={feldKlasse}
          />
        </Feld>
        <Feld label="E-Mail">
          <input
            name="email"
            type="email"
            defaultValue={kunde?.email ?? ""}
            placeholder="z. B. max@beispiel.de"
            className={feldKlasse}
          />
        </Feld>
        <Feld label="Notizen">
          <textarea
            name="notizen"
            rows={3}
            defaultValue={kunde?.notizen ?? ""}
            placeholder="z. B. Schlüssel beim Nachbarn, Hund im Garten …"
            className={`${feldKlasse} py-3`}
          />
        </Feld>
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AbbrechenLink href={abbrechenHref} />
          <SpeichernButton />
        </div>
      </form>
    </Karte>
  );
}
