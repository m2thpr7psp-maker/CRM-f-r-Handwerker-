"use client";

import { useState, useTransition } from "react";
import { AUFTRAG_STATUS, statusFarbe, statusLabel } from "@/lib/status";
import { auftragStatusSetzen } from "@/app/actions/auftraege";

/**
 * Zeigt den aktuellen Status als Badge. Ein Klick öffnet die Auswahl
 * aller Status – ein weiterer Klick setzt den neuen Status (Kanban per Klick).
 */
export function StatusWechsler({
  auftragId,
  status,
}: {
  auftragId: string;
  status: string;
}) {
  const [offen, setOffen] = useState(false);
  const [laufend, startTransition] = useTransition();

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold ${statusFarbe(status)} ${laufend ? "opacity-50" : ""}`}
        title="Status ändern"
      >
        {statusLabel(status)}
        <svg className="ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-md">
      {AUFTRAG_STATUS.map((s) => (
        <button
          key={s}
          type="button"
          disabled={laufend}
          onClick={() => {
            setOffen(false);
            startTransition(() => auftragStatusSetzen(auftragId, s));
          }}
          className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${
            s === status
              ? statusFarbe(s) + " ring-2 ring-orange-400"
              : statusFarbe(s) + " opacity-70 hover:opacity-100"
          }`}
        >
          {statusLabel(s)}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOffen(false)}
        className="min-h-9 rounded-full px-2 text-sm text-slate-400 hover:text-slate-600"
        aria-label="Schließen"
      >
        ✕
      </button>
    </div>
  );
}
