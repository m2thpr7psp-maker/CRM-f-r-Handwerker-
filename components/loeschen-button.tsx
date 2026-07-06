"use client";

import { useState } from "react";

export function LoeschenButton({
  aktion,
  frage,
  label = "Löschen",
}: {
  aktion: () => Promise<void>;
  frage: string;
  label?: string;
}) {
  const [bestaetigen, setBestaetigen] = useState(false);

  if (!bestaetigen) {
    return (
      <button
        type="button"
        onClick={() => setBestaetigen(true)}
        className="min-h-12 rounded-xl border border-red-200 bg-white px-5 text-[15px] font-semibold text-red-600 hover:bg-red-50"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
      <span className="text-sm font-medium text-red-800">{frage}</span>
      <div className="flex gap-2">
        <form action={aktion}>
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
          >
            Ja, löschen
          </button>
        </form>
        <button
          type="button"
          onClick={() => setBestaetigen(false)}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
