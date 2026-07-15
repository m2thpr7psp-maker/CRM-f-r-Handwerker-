import { prisma } from "@/lib/prisma";
import {
  fensterAnlegen,
  fensterLoeschen,
  fensterUmschalten,
} from "@/app/actions/verfuegbarkeit";
import { SeitenKopf, Karte, feldKlasse, labelKlasse } from "@/components/ui";

export const dynamic = "force-dynamic";

const WOCHENTAGE = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

export default async function VerfuegbarkeitSeite() {
  const fenster = await prisma.verfuegbarkeitsFenster.findMany({
    orderBy: [{ wochentag: "asc" }, { von: "asc" }],
  });

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Verfügbarkeit" zurueckHref="/einstellungen" />
      <p className="-mt-3 mb-5 text-sm text-slate-500">
        In diesen Zeitfenstern nimmt Ihr Betrieb grundsätzlich Termine an.
        Daraus baut die App die Slot-Vorschläge für neue Anfragen.
      </p>

      {fenster.length === 0 ? (
        <p className="mb-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center text-[15px] text-slate-500">
          Noch keine Zeitfenster – legen Sie unten das erste an
          (z. B. Montag 08:00–12:00).
        </p>
      ) : (
        <div className="mb-5 flex flex-col gap-2">
          {fenster.map((f) => (
            <Karte key={f.id} className={`flex items-center justify-between gap-3 p-4 ${f.aktiv ? "" : "opacity-50"}`}>
              <div>
                <p className="text-[15px] font-semibold">
                  {WOCHENTAGE[f.wochentag] ?? `Tag ${f.wochentag}`}
                </p>
                <p className="text-sm text-slate-500">
                  {f.von}–{f.bis} Uhr {f.aktiv ? "" : "· pausiert"}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={fensterUmschalten.bind(null, f.id)}>
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {f.aktiv ? "Pausieren" : "Aktivieren"}
                  </button>
                </form>
                <form action={fensterLoeschen.bind(null, f.id)}>
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Löschen
                  </button>
                </form>
              </div>
            </Karte>
          ))}
        </div>
      )}

      <Karte className="p-5">
        <h2 className="mb-3 text-lg font-bold">Neues Zeitfenster</h2>
        <form action={fensterAnlegen} className="flex flex-col gap-4">
          <div>
            <span className={labelKlasse}>Wochentag</span>
            <select name="wochentag" defaultValue="0" className={feldKlasse}>
              {WOCHENTAGE.map((tag, i) => (
                <option key={tag} value={i}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelKlasse}>Von</span>
              <input type="time" name="von" required step={900} defaultValue="08:00" className={feldKlasse} />
            </div>
            <div>
              <span className={labelKlasse}>Bis</span>
              <input type="time" name="bis" required step={900} defaultValue="12:00" className={feldKlasse} />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-12 self-start rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600"
          >
            Zeitfenster anlegen
          </button>
        </form>
      </Karte>
    </div>
  );
}
