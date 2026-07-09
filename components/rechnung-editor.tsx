"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  rechnungSpeichern,
  PositionEingabe,
  RechnungKopfEingabe,
} from "@/app/actions/rechnungen";
import { berechneSummen, EINHEITEN, formatDezimal, MWST_SAETZE, parseDezimal } from "@/lib/geld";
import { formatWaehrung } from "@/lib/format";
import { feldKlasse, labelKlasse } from "@/components/ui";
import { IconPlus } from "@/components/icons";

type PositionZeile = {
  schluessel: number;
  bezeichnung: string;
  mengeText: string;
  einheit: string;
  preisText: string;
};

export function RechnungEditor({
  rechnungId,
  kopf,
  positionen,
  stundensatz,
}: {
  rechnungId: string;
  kopf: RechnungKopfEingabe;
  positionen: PositionEingabe[];
  stundensatz: number;
}) {
  const router = useRouter();
  const [laufend, startTransition] = useTransition();
  const [meldung, setMeldung] = useState<{ art: "ok" | "fehler"; text: string } | null>(null);

  const [datum, setDatum] = useState(kopf.datum);
  const [leistungVon, setLeistungVon] = useState(kopf.leistungVon);
  const [leistungBis, setLeistungBis] = useState(kopf.leistungBis);
  const [mwstSatz, setMwstSatz] = useState(kopf.mwstSatz);
  const [zahlungsziel, setZahlungsziel] = useState(String(kopf.zahlungszielTage));
  const [kaeuferReferenz, setKaeuferReferenz] = useState(kopf.kaeuferReferenz);

  const [zeilen, setZeilen] = useState<PositionZeile[]>(
    positionen.map((p, i) => ({
      schluessel: i,
      bezeichnung: p.bezeichnung,
      mengeText: formatDezimal(p.menge),
      einheit: p.einheit,
      preisText: formatDezimal(p.einzelpreis),
    }))
  );
  const [zaehler, setZaehler] = useState(positionen.length);

  function zeileHinzufuegen(vorlage: Partial<PositionZeile>) {
    setZeilen((z) => [
      ...z,
      {
        schluessel: zaehler,
        bezeichnung: "",
        mengeText: "1",
        einheit: "Stk.",
        preisText: "",
        ...vorlage,
      },
    ]);
    setZaehler((n) => n + 1);
  }

  function zeileAendern(schluessel: number, aenderung: Partial<PositionZeile>) {
    setZeilen((z) => z.map((r) => (r.schluessel === schluessel ? { ...r, ...aenderung } : r)));
  }

  function zeileEntfernen(schluessel: number) {
    setZeilen((z) => z.filter((r) => r.schluessel !== schluessel));
  }

  const summen = useMemo(() => {
    const werte = zeilen
      .filter((z) => z.bezeichnung.trim() !== "")
      .map((z) => ({
        menge: parseDezimal(z.mengeText),
        einzelpreis: parseDezimal(z.preisText),
      }))
      .filter((p) => Number.isFinite(p.menge) && Number.isFinite(p.einzelpreis));
    return berechneSummen(werte, mwstSatz);
  }, [zeilen, mwstSatz]);

  function speichern() {
    setMeldung(null);
    const eingaben: PositionEingabe[] = zeilen
      .filter((z) => z.bezeichnung.trim() !== "")
      .map((z) => ({
        bezeichnung: z.bezeichnung,
        menge: parseDezimal(z.mengeText),
        einheit: z.einheit,
        einzelpreis: parseDezimal(z.preisText),
      }));

    startTransition(async () => {
      const ergebnis = await rechnungSpeichern(
        rechnungId,
        {
          datum,
          leistungVon,
          leistungBis,
          mwstSatz,
          zahlungszielTage: Math.max(0, Number(zahlungsziel) || 0),
          kaeuferReferenz,
        },
        eingaben
      );
      if (ergebnis?.fehler) {
        setMeldung({ art: "fehler", text: ergebnis.fehler });
      } else {
        setMeldung({ art: "ok", text: "Rechnungsentwurf gespeichert." });
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Kopf-Daten */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Rechnungsdaten</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={labelKlasse}>Rechnungsdatum</span>
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className={feldKlasse}
            />
          </div>
          <div>
            <span className={labelKlasse}>Zahlungsziel (Tage)</span>
            <input
              type="number"
              min={0}
              value={zahlungsziel}
              onChange={(e) => setZahlungsziel(e.target.value)}
              className={feldKlasse}
            />
          </div>
          <div>
            <span className={labelKlasse}>Leistung von</span>
            <input
              type="date"
              value={leistungVon}
              onChange={(e) => setLeistungVon(e.target.value)}
              className={feldKlasse}
            />
          </div>
          <div>
            <span className={labelKlasse}>Leistung bis</span>
            <input
              type="date"
              value={leistungBis}
              onChange={(e) => setLeistungBis(e.target.value)}
              className={feldKlasse}
            />
          </div>
          <div>
            <span className={labelKlasse}>MwSt-Satz</span>
            <select
              value={mwstSatz}
              onChange={(e) => setMwstSatz(Number(e.target.value))}
              className={feldKlasse}
            >
              {MWST_SAETZE.map((s) => (
                <option key={s} value={s}>
                  {s} %
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={labelKlasse}>Leitweg-ID / Referenz des Kunden</span>
            <input
              value={kaeuferReferenz}
              onChange={(e) => setKaeuferReferenz(e.target.value)}
              placeholder="Für Behörden: Leitweg-ID (Pflicht)"
              className={feldKlasse}
            />
          </div>
        </div>
      </div>

      {/* Positionen */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Positionen</h2>

        {zeilen.length === 0 && (
          <p className="mb-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-[15px] text-slate-500">
            Noch keine Positionen – fügen Sie Arbeitszeit oder Material hinzu.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {zeilen.map((zeile, index) => {
            const menge = parseDezimal(zeile.mengeText);
            const preis = parseDezimal(zeile.preisText);
            const summe =
              Number.isFinite(menge) && Number.isFinite(preis)
                ? Math.round(menge * preis * 100) / 100
                : null;
            return (
              <div
                key={zeile.schluessel}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">Position {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => zeileEntfernen(zeile.schluessel)}
                    className="min-h-9 rounded-lg px-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Entfernen
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                  <div className="col-span-2 sm:col-span-1">
                    <span className={labelKlasse}>Bezeichnung</span>
                    <input
                      value={zeile.bezeichnung}
                      onChange={(e) => zeileAendern(zeile.schluessel, { bezeichnung: e.target.value })}
                      placeholder="z. B. Wände spachteln und streichen"
                      className={feldKlasse}
                    />
                  </div>
                  <div>
                    <span className={labelKlasse}>Menge</span>
                    <input
                      inputMode="decimal"
                      value={zeile.mengeText}
                      onChange={(e) => zeileAendern(zeile.schluessel, { mengeText: e.target.value })}
                      placeholder="z. B. 8"
                      className={feldKlasse}
                    />
                  </div>
                  <div>
                    <span className={labelKlasse}>Einheit</span>
                    <select
                      value={zeile.einheit}
                      onChange={(e) => zeileAendern(zeile.schluessel, { einheit: e.target.value })}
                      className={feldKlasse}
                    >
                      {EINHEITEN.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className={labelKlasse}>Einzelpreis (netto)</span>
                    <input
                      inputMode="decimal"
                      value={zeile.preisText}
                      onChange={(e) => zeileAendern(zeile.schluessel, { preisText: e.target.value })}
                      placeholder="z. B. 55,00"
                      className={feldKlasse}
                    />
                  </div>
                </div>
                <p className="mt-2 text-right text-sm font-semibold text-slate-600">
                  {summe !== null ? formatWaehrung(summe) : "–"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              zeileHinzufuegen({
                bezeichnung: "Arbeitszeit",
                einheit: "Std.",
                mengeText: "1",
                preisText: formatDezimal(stundensatz),
              })
            }
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 text-[15px] font-semibold text-orange-700 hover:bg-orange-100"
          >
            <IconPlus className="h-5 w-5" /> Arbeitszeit
          </button>
          <button
            type="button"
            onClick={() => zeileHinzufuegen({ einheit: "Stk.", mengeText: "1" })}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <IconPlus className="h-5 w-5" /> Material
          </button>
        </div>
      </div>

      {/* Summen */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="ml-auto flex max-w-xs flex-col gap-1.5">
          <div className="flex justify-between text-[15px]">
            <dt className="text-slate-600">Netto</dt>
            <dd className="font-semibold">{formatWaehrung(summen.netto)}</dd>
          </div>
          <div className="flex justify-between text-[15px]">
            <dt className="text-slate-600">MwSt ({mwstSatz} %)</dt>
            <dd className="font-semibold">{formatWaehrung(summen.mwst)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
            <dt>Brutto</dt>
            <dd>{formatWaehrung(summen.brutto)}</dd>
          </div>
        </dl>
      </div>

      {meldung && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            meldung.art === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {meldung.text}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={speichern}
          disabled={laufend}
          className="min-h-12 flex-1 rounded-xl bg-orange-500 px-6 text-[15px] font-semibold text-white hover:bg-orange-600 disabled:opacity-60 sm:flex-none sm:px-10"
        >
          {laufend ? "Wird gespeichert …" : "Speichern"}
        </button>
        <a
          href={`/api/rechnungen/${rechnungId}/pdf`}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          PDF ansehen
        </a>
        <a
          href={`/api/rechnungen/${rechnungId}/xrechnung`}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          XRechnung (XML)
        </a>
      </div>
      <p className="-mt-2 text-sm text-slate-500">
        Tipp: Erst speichern – PDF und XRechnung zeigen immer den gespeicherten Stand.
        Die XRechnung-Datei können Sie in Ihre Buchhaltungssoftware übernehmen oder an
        Behörden/Firmenkunden übermitteln; prüfen Sie sie vor dem Versand.
      </p>
    </div>
  );
}
