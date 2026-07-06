"use client";

import { useState } from "react";
import type { Mitarbeiter } from "@prisma/client";
import { MITARBEITER_FARBEN } from "@/lib/farben";
import { feldKlasse, labelKlasse } from "@/components/ui";

export function MitarbeiterForm({
  aktion,
  mitarbeiter,
  onFertig,
}: {
  aktion: (formData: FormData) => Promise<void>;
  mitarbeiter?: Mitarbeiter;
  onFertig?: () => void;
}) {
  const [farbe, setFarbe] = useState(mitarbeiter?.farbe ?? MITARBEITER_FARBEN[0].wert);

  return (
    <form
      action={async (formData) => {
        await aktion(formData);
        onFertig?.();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <span className={labelKlasse}>Name *</span>
        <input
          name="name"
          required
          defaultValue={mitarbeiter?.name ?? ""}
          placeholder="z. B. Peter Schmidt"
          className={feldKlasse}
        />
      </div>
      <div>
        <span className={labelKlasse}>Farbe im Kalender</span>
        <input type="hidden" name="farbe" value={farbe} />
        <div className="flex flex-wrap gap-2">
          {MITARBEITER_FARBEN.map((f) => (
            <button
              key={f.wert}
              type="button"
              onClick={() => setFarbe(f.wert)}
              title={f.name}
              aria-label={f.name}
              className={`h-11 w-11 rounded-full border-4 ${
                farbe === f.wert ? "border-slate-800" : "border-transparent"
              }`}
              style={{ backgroundColor: f.wert }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="min-h-12 flex-1 rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600 sm:flex-none"
        >
          Speichern
        </button>
        {onFertig && (
          <button
            type="button"
            onClick={onFertig}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
