"use client";

import { useActionState, useState } from "react";
import { terminVerschieben, VerschiebenStatus } from "@/app/actions/termine";
import { feldKlasse, labelKlasse } from "@/components/ui";
import { IconWarnung } from "@/components/icons";

export function VerschiebenDialog({
  terminId,
  vorgabe,
}: {
  terminId: string;
  vorgabe: { datum: string; startZeit: string; endZeit: string };
}) {
  const [offen, setOffen] = useState(false);
  const aktion = terminVerschieben.bind(null, terminId);
  const [status, formAction, laufend] = useActionState<VerschiebenStatus, FormData>(aktion, {
    versuch: 0,
  });

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
      >
        Verschieben auf …
      </button>
    );
  }

  const werte = status.werte ?? vorgabe;

  return (
    <form
      key={status.versuch}
      action={formAction}
      className="flex w-full flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-4"
    >
      <h3 className="text-[15px] font-bold">Termin verschieben auf …</h3>
      <div>
        <span className={labelKlasse}>Neues Datum *</span>
        <input type="date" name="datum" required defaultValue={werte.datum} className={feldKlasse} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className={labelKlasse}>Von *</span>
          <input
            type="time"
            name="startZeit"
            required
            step={900}
            defaultValue={werte.startZeit}
            className={feldKlasse}
          />
        </div>
        <div>
          <span className={labelKlasse}>Bis *</span>
          <input
            type="time"
            name="endZeit"
            required
            step={900}
            defaultValue={werte.endZeit}
            className={feldKlasse}
          />
        </div>
      </div>

      {status.fehler && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {status.fehler}
        </p>
      )}

      {status.konflikt && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="flex items-start gap-2 text-sm font-medium text-amber-900">
            <IconWarnung className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>Doppelbuchung:</strong> {status.konflikt}
            </span>
          </p>
          <button
            type="submit"
            name="trotzdem"
            value="1"
            className="min-h-11 self-start rounded-lg border border-amber-400 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Trotzdem verschieben
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={laufend}
          className="min-h-12 rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {laufend ? "Wird verschoben …" : "Verschieben"}
        </button>
        <button
          type="button"
          onClick={() => setOffen(false)}
          className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
