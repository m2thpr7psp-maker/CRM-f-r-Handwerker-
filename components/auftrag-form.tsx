import { Feld, feldKlasse, SpeichernButton, AbbrechenLink, Karte } from "@/components/ui";
import type { Auftrag, Kunde } from "@prisma/client";

export function AuftragForm({
  aktion,
  auftrag,
  kunden,
  vorausgewaehlterKundeId,
  abbrechenHref,
}: {
  aktion: (formData: FormData) => Promise<void>;
  auftrag?: Auftrag;
  kunden: Kunde[];
  vorausgewaehlterKundeId?: string;
  abbrechenHref: string;
}) {
  return (
    <Karte className="p-5 md:p-6">
      <form action={aktion} className="flex flex-col gap-4">
        <Feld label="Kunde *">
          <select
            name="kundeId"
            required
            defaultValue={auftrag?.kundeId ?? vorausgewaehlterKundeId ?? ""}
            className={feldKlasse}
          >
            <option value="" disabled>
              Kunde auswählen …
            </option>
            {kunden.map((kunde) => (
              <option key={kunde.id} value={kunde.id}>
                {kunde.name}
                {kunde.firma ? ` (${kunde.firma})` : ""}
              </option>
            ))}
          </select>
        </Feld>
        <Feld label="Titel *">
          <input
            name="titel"
            required
            defaultValue={auftrag?.titel ?? ""}
            placeholder="z. B. Wohnzimmer streichen"
            className={feldKlasse}
          />
        </Feld>
        <Feld label="Beschreibung">
          <textarea
            name="beschreibung"
            rows={4}
            defaultValue={auftrag?.beschreibung ?? ""}
            placeholder="z. B. 2 Zimmer, Wände und Decke, Farbe weiß matt …"
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
