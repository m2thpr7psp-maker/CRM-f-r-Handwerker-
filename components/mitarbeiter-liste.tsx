"use client";

import { useState } from "react";
import type { Mitarbeiter } from "@prisma/client";
import {
  mitarbeiterAktualisieren,
  mitarbeiterAnlegen,
  mitarbeiterLoeschen,
} from "@/app/actions/mitarbeiter";
import { MitarbeiterForm } from "@/components/mitarbeiter-form";
import { LoeschenButton } from "@/components/loeschen-button";
import { IconPlus } from "@/components/icons";

export function MitarbeiterListe({ mitarbeiter }: { mitarbeiter: Mitarbeiter[] }) {
  const [neuOffen, setNeuOffen] = useState(false);
  const [bearbeiteId, setBearbeiteId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {mitarbeiter.length === 0 && !neuOffen && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-[15px] text-slate-500">
            Noch keine Mitarbeiter – legen Sie Ihr Team an, um Termine zuzuweisen.
          </p>
          <button
            type="button"
            onClick={() => setNeuOffen(true)}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600"
          >
            <IconPlus className="h-5 w-5" /> Ersten Mitarbeiter anlegen
          </button>
        </div>
      )}

      {mitarbeiter.length > 0 && (
        <ul className="flex flex-col gap-3">
          {mitarbeiter.map((m) => (
            <li key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {bearbeiteId === m.id ? (
                <MitarbeiterForm
                  aktion={mitarbeiterAktualisieren.bind(null, m.id)}
                  mitarbeiter={m}
                  onFertig={() => setBearbeiteId(null)}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: m.farbe }}
                    />
                    <span className="text-[15px] font-semibold">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBearbeiteId(m.id)}
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Bearbeiten
                    </button>
                    <LoeschenButton
                      aktion={mitarbeiterLoeschen.bind(null, m.id)}
                      frage="Mitarbeiter löschen? Termine bleiben ohne Zuweisung erhalten."
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {neuOffen ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Neuer Mitarbeiter</h2>
          <MitarbeiterForm aktion={mitarbeiterAnlegen} onFertig={() => setNeuOffen(false)} />
        </div>
      ) : (
        mitarbeiter.length > 0 && (
          <button
            type="button"
            onClick={() => setNeuOffen(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600"
          >
            <IconPlus className="h-5 w-5" /> Neuer Mitarbeiter
          </button>
        )
      )}
    </div>
  );
}
