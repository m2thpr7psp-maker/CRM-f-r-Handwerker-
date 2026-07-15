"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { feldKlasse, labelKlasse } from "@/components/ui";
import { formatDatum, formatWochentagKurz, zeitSeit } from "@/lib/format";

export type AnfrageDaten = {
  id: string;
  kundeName: string;
  telefon: string;
  adresse: string | null;
  anliegen: string;
  dringlichkeit: string;
  wunschZeitraum: string | null;
  quelle: string;
  status: string;
  createdAtIso: string;
  slots: {
    id: string;
    datumIso: string;
    uhrzeitVon: string;
    uhrzeitBis: string;
    status: string;
  }[];
};

const DRINGLICHKEIT_BADGE: Record<string, { label: string; klasse: string }> = {
  NOTFALL: { label: "Notfall", klasse: "bg-red-600 text-white" },
  DRINGEND: { label: "Dringend", klasse: "bg-orange-500 text-white" },
  NORMAL: { label: "Normal", klasse: "bg-slate-200 text-slate-700" },
};

const STATUS_LABEL: Record<string, string> = {
  NEU: "Neu",
  VORGESCHLAGEN: "Vorgeschlagen",
  BESTAETIGT: "Bestätigt",
  ABGELEHNT: "Abgelehnt",
  ERLEDIGT: "Erledigt",
};

const QUELLE_LABEL: Record<string, string> = {
  TELEFON: "Per Telefon (Fritz)",
  WEB: "Über die Website",
  MANUELL: "Manuell erfasst",
};

function slotText(slot: { datumIso: string; uhrzeitVon: string; uhrzeitBis: string }) {
  const datum = new Date(slot.datumIso);
  return `${formatWochentagKurz(datum)} ${formatDatum(datum)}, ${slot.uhrzeitVon}–${slot.uhrzeitBis} Uhr`;
}

export function AnfrageKarte({ anfrage }: { anfrage: AnfrageDaten }) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [modus, setModus] = useState<"slots" | "eigener" | "ablehnen">("slots");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laufend, startTransition] = useTransition();

  const [eigenesDatum, setEigenesDatum] = useState("");
  const [eigeneVon, setEigeneVon] = useState("08:00");
  const [eigeneBis, setEigeneBis] = useState("12:00");
  const [begruendung, setBegruendung] = useState("");

  const badge = DRINGLICHKEIT_BADGE[anfrage.dringlichkeit] ?? DRINGLICHKEIT_BADGE.NORMAL;
  const offeneAnfrage = anfrage.status === "NEU" || anfrage.status === "VORGESCHLAGEN";
  const gewaehlterSlot = anfrage.slots.find((s) => s.status === "GEWAEHLT");

  async function patch(pfad: string, body: unknown) {
    setFehler(null);
    const antwort = await fetch(pfad, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!antwort.ok) {
      const daten = await antwort.json().catch(() => null);
      setFehler(daten?.fehler ?? "Aktion fehlgeschlagen. Bitte erneut versuchen.");
      return false;
    }
    router.refresh();
    return true;
  }

  const bestaetigeSlot = (slotId: string) =>
    startTransition(async () => {
      await patch(`/api/anfragen/${anfrage.id}/bestaetigen`, { slotId });
    });

  const bestaetigeEigenen = () =>
    startTransition(async () => {
      if (!eigenesDatum) {
        setFehler("Bitte ein Datum wählen.");
        return;
      }
      await patch(`/api/anfragen/${anfrage.id}/bestaetigen`, {
        datum: eigenesDatum,
        uhrzeitVon: eigeneVon,
        uhrzeitBis: eigeneBis,
      });
    });

  const lehneAb = () =>
    startTransition(async () => {
      await patch(`/api/anfragen/${anfrage.id}/ablehnen`, { begruendung });
    });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Kopf – immer sichtbar, Tipp öffnet die Karte */}
      <button
        type="button"
        onClick={() => setOffen(!offen)}
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50"
      >
        <div className="min-w-0">
          <p className="text-[15px] font-bold">{anfrage.anliegen}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {anfrage.kundeName}
            {anfrage.adresse ? ` · ${anfrage.adresse}` : ""}
          </p>
          {anfrage.wunschZeitraum && (
            <p className="text-sm text-slate-500">Wunsch: {anfrage.wunschZeitraum}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.klasse}`}>
            {offeneAnfrage ? badge.label : (STATUS_LABEL[anfrage.status] ?? anfrage.status)}
          </span>
          <span className="text-xs text-slate-400">
            {zeitSeit(new Date(anfrage.createdAtIso))}
          </span>
        </div>
      </button>

      {offen && (
        <div className="border-t border-slate-100 px-4 py-4">
          {/* Kontakt & Quelle */}
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={`tel:${anfrage.telefon}`} className="font-semibold text-orange-600 underline">
              {anfrage.telefon}
            </a>
            {anfrage.adresse && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(anfrage.adresse)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-orange-600 underline"
              >
                In Karten öffnen
              </a>
            )}
            <span className="text-slate-400">{QUELLE_LABEL[anfrage.quelle] ?? anfrage.quelle}</span>
          </div>

          {gewaehlterSlot && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              Termin: {slotText(gewaehlterSlot)}
            </p>
          )}

          {anfrage.status === "BESTAETIGT" && (
            <button
              type="button"
              disabled={laufend}
              onClick={() =>
                startTransition(async () => {
                  setFehler(null);
                  const antwort = await fetch(`/api/anfragen/${anfrage.id}/uebernehmen`, {
                    method: "PATCH",
                  });
                  const daten = await antwort.json().catch(() => null);
                  if (!antwort.ok) {
                    setFehler(daten?.fehler ?? "Übernahme fehlgeschlagen.");
                    return;
                  }
                  router.push(`/auftraege/${daten.auftragId}`);
                })
              }
              className="mb-3 min-h-12 w-full rounded-xl bg-orange-500 px-4 text-[15px] font-bold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              In Aufträge &amp; Kalender übernehmen
            </button>
          )}

          {offeneAnfrage && modus === "slots" && (
            <div className="flex flex-col gap-2">
              {anfrage.slots
                .filter((s) => s.status === "VORGESCHLAGEN")
                .map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={laufend}
                    onClick={() => bestaetigeSlot(slot.id)}
                    className="min-h-14 rounded-xl bg-orange-500 px-4 text-[15px] font-bold text-white hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60"
                  >
                    {slotText(slot)} bestätigen
                  </button>
                ))}
              {anfrage.slots.filter((s) => s.status === "VORGESCHLAGEN").length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm text-slate-500">
                  Keine Slot-Vorschläge –{" "}
                  <a href="/einstellungen/verfuegbarkeit" className="font-semibold text-orange-600 underline">
                    Verfügbarkeit pflegen
                  </a>{" "}
                  oder eigenen Termin wählen.
                </p>
              )}
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModus("eigener")}
                  className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Anderen Termin wählen
                </button>
                <button
                  type="button"
                  onClick={() => setModus("ablehnen")}
                  className="min-h-12 flex-1 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Ablehnen
                </button>
              </div>
            </div>
          )}

          {offeneAnfrage && modus === "eigener" && (
            <div className="flex flex-col gap-3">
              <div>
                <span className={labelKlasse}>Datum</span>
                <input
                  type="date"
                  value={eigenesDatum}
                  onChange={(e) => setEigenesDatum(e.target.value)}
                  className={feldKlasse}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className={labelKlasse}>Von</span>
                  <input
                    type="time"
                    step={900}
                    value={eigeneVon}
                    onChange={(e) => setEigeneVon(e.target.value)}
                    className={feldKlasse}
                  />
                </div>
                <div>
                  <span className={labelKlasse}>Bis</span>
                  <input
                    type="time"
                    step={900}
                    value={eigeneBis}
                    onChange={(e) => setEigeneBis(e.target.value)}
                    className={feldKlasse}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={laufend}
                  onClick={bestaetigeEigenen}
                  className="min-h-12 flex-1 rounded-xl bg-orange-500 px-4 text-[15px] font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  Termin bestätigen
                </button>
                <button
                  type="button"
                  onClick={() => setModus("slots")}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                >
                  Zurück
                </button>
              </div>
            </div>
          )}

          {offeneAnfrage && modus === "ablehnen" && (
            <div className="flex flex-col gap-3">
              <div>
                <span className={labelKlasse}>
                  Kurze Begründung (wird dem Kunden gesendet) *
                </span>
                <textarea
                  value={begruendung}
                  onChange={(e) => setBegruendung(e.target.value)}
                  rows={2}
                  placeholder="z. B. Wir sind die nächsten Wochen ausgebucht."
                  className={`${feldKlasse} py-3`}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={laufend || begruendung.trim().length < 3}
                  onClick={lehneAb}
                  className="min-h-12 flex-1 rounded-xl bg-red-600 px-4 text-[15px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Anfrage ablehnen
                </button>
                <button
                  type="button"
                  onClick={() => setModus("slots")}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                >
                  Zurück
                </button>
              </div>
            </div>
          )}

          {fehler && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {fehler}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
